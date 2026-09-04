import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '150kb' }));

const requireUser = async (req: Request, res: Response): Promise<boolean> => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!url || !anonKey || !token) { res.status(401).json({ error: 'Sign in is required to use AI features.' }); return false; }
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  if (!response.ok) { res.status(401).json({ error: 'Your session is invalid or expired.' }); return false; }
  return true;
};

app.post('/api/ai', async (req, res) => {
  try {
    if (!(await requireUser(req, res))) return;
    if (req.body?.action !== 'analyze-resume') return res.status(400).json({ error: 'Unsupported AI action.' });
    const { resumeText, targetJobRole, requiredSkills } = req.body;
    if (typeof resumeText !== 'string' || resumeText.trim().length < 50) return res.status(400).json({ error: 'Provide readable resume text.' });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI analysis is not configured on this deployment.' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Analyze this resume against the ${String(targetJobRole || 'selected')} role. Required skills: ${Array.isArray(requiredSkills) ? requiredSkills.join(', ') : 'not supplied'}.
Return only JSON with numeric atsCompatibilityScore (0-100), extractedSkills, strengths, missingSkills, experienceSummary, educationSummary, and improvementSuggestions. Do not invent facts. Resume:\n${resumeText.slice(0, 12000)}`;
    const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
    const parsed = JSON.parse(result.text || '{}');
    res.status(200).json({
      atsCompatibilityScore: Math.max(0, Math.min(100, Number(parsed.atsCompatibilityScore) || 0)),
      extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      experienceSummary: String(parsed.experienceSummary || ''),
      educationSummary: String(parsed.educationSummary || ''),
      improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : []
    });
  } catch (error) {
    console.error('AI analysis failed', error);
    res.status(502).json({ error: 'AI analysis could not be completed. Please try again.' });
  }
});

export default app;
