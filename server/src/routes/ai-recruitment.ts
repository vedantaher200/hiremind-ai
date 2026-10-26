import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Initialize Google Gen AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

/* ---------------- A. JD ANALYSIS AGENT ---------------- */
router.post('/analyze-jd', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { jdText } = req.body;
    if (!jdText) return res.status(400).json({ error: 'Job description text required' });

    if (genAI) {
      const prompt = `Analyze this Job Description and extract: Mandatory skills, Preferred skills, Education, Experience, Location, Certifications, Responsibilities, Other requirements. Return JSON:
      {
        "mandatorySkills": [], "preferredSkills": [], "education": "", "experience": "", "location": "", "certifications": [], "responsibilities": [], "other": []
      }
      JD: ${jdText}`;
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return res.json(JSON.parse(response.text || '{}'));
    }

    return res.status(503).json({ error: 'JD analysis is not configured. No analysis was generated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- B. CANDIDATE EVIDENCE AGENT & C. EVIDENCE-BASED MATCHING AGENT & D. HIDDEN SKILL DETECTION ---------------- */
router.post('/candidate-evidence', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { candidateId, requirements } = req.body;
    if (typeof candidateId !== 'string' || !Array.isArray(requirements)) return res.status(400).json({ error: 'Candidate ID and a requirements list are required.' });
    const candidate = await prisma.user.findFirst({ where: { id: candidateId, applications: { some: { recruiterId: req.user!.id } } }, include: { resumes: true } });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    return res.status(501).json({ error: 'Evidence-grounded matching is not implemented for this account. No candidate score was generated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- E. RECRUITER AI ASSISTANT ---------------- */
router.post('/ask-assistant', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (typeof question !== 'string' || !question.trim() || question.length > 1000) return res.status(400).json({ error: 'A question up to 1000 characters is required.' });
    return res.status(503).json({ error: 'Recruiter assistant retrieval is not configured. No records were summarized.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- F. CANDIDATE COMPARISON ---------------- */
router.post('/compare-candidates', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 10 || candidateIds.some((id: unknown) => typeof id !== 'string')) return res.status(400).json({ error: 'Select between two and ten candidate IDs.' });
    const records = await prisma.user.findMany({ where: { id: { in: candidateIds }, applications: { some: { recruiterId: req.user!.id } } }, select: { id: true } });
    if (records.length !== new Set(candidateIds).size) return res.status(403).json({ error: 'One or more selected candidates are not authorized for your postings.' });
    return res.status(501).json({ error: 'Candidate comparison is not implemented. No scores were generated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- G. WHAT-IF RECRUITMENT SIMULATION ---------------- */
router.post('/simulate', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    return res.status(501).json({ error: 'What-if simulation is not implemented. No simulated ranking was generated.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- H. OUTCOME / LEARNING ENGINE ---------------- */
router.get('/outcomes', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const rows = await prisma.application.groupBy({ by: ['status'], where: { recruiterId: req.user!.id }, _count: { _all: true } });
    res.json({ analytics: Object.fromEntries(rows.map(row => [row.status.toLowerCase(), row._count._all])), sampleSize: rows.reduce((sum, row) => sum + row._count._all, 0), limitations: 'Outcome tracking only; no automatic model retraining.' });
  } catch { res.status(500).json({ error: 'Unable to load outcome analytics.' }); }
});

/* ---------------- 5. GOOGLE MEET INTERVIEW AUTOMATION ---------------- */
router.post('/schedule-meet', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    return res.status(503).json({ error: 'Calendar event creation requires recruiter Google OAuth authorization. No meeting was created.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
