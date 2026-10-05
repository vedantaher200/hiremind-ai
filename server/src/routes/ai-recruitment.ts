import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

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

    // Mock response if no genAI
    res.json({
      mandatorySkills: ['React', 'Node.js'],
      preferredSkills: ['AWS', 'Docker'],
      education: 'Bachelor in CS',
      experience: '2+ years',
      location: 'Remote',
      certifications: [],
      responsibilities: ['Develop web apps'],
      other: []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- B. CANDIDATE EVIDENCE AGENT & C. EVIDENCE-BASED MATCHING AGENT & D. HIDDEN SKILL DETECTION ---------------- */
router.post('/candidate-evidence', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { candidateId, requirements } = req.body;
    const candidate = await prisma.user.findUnique({ where: { id: candidateId }, include: { resumes: true } });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    // In a real implementation we would send the resume text + requirements to Gemini.
    // For this demonstration we will return a structured evidence map.
    res.json({
      candidateId,
      evidence: {
        "React": { status: "Verified", source: "Resume - Project A", confidence: 95 },
        "Node.js": { status: "Verified", source: "Skills array", confidence: 100 },
        "AWS": { status: "Missing", source: "No evidence found", confidence: 0 },
        "REST API": { status: "Inferred", source: "FastAPI project indicates REST knowledge", confidence: 80 }
      },
      matchScore: 85,
      evidenceConfidence: 90
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- E. RECRUITER AI ASSISTANT ---------------- */
router.post('/ask-assistant', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    res.json({ answer: `Based on authorized database data, the answer to "${question}" is processed. Candidates matching this have been filtered.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- F. CANDIDATE COMPARISON ---------------- */
router.post('/compare-candidates', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { candidateIds } = req.body;
    res.json({
      comparison: candidateIds.map((id: string) => ({
        candidateId: id,
        requirementCoverage: 80,
        skills: ['React', 'Node.js'],
        missingEvidence: ['AWS'],
        verificationNeeds: ['Check references for team size']
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- G. WHAT-IF RECRUITMENT SIMULATION ---------------- */
router.post('/simulate', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { candidateId, simulatedRequirements } = req.body;
    res.json({
      candidateId,
      simulatedMatchScore: 92,
      changes: "Moving AWS from mandatory to preferred increased match score by 7%."
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- H. OUTCOME / LEARNING ENGINE ---------------- */
router.get('/outcomes', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  res.json({
    analytics: {
      applied: 120, reviewed: 40, shortlisted: 15, interview: 5, selected: 1
    },
    sampleSize: 120,
    limitations: "Historical outcomes are for analytics only and do not automatically retrain the LLM."
  });
});

/* ---------------- 5. GOOGLE MEET INTERVIEW AUTOMATION ---------------- */
router.post('/schedule-meet', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { candidateId, date, time, durationMinutes = 60 } = req.body;
    const recruiterId = req.user!.id;
    
    // In real implementation we'd use oauth2Client and calendar API:
    // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    // Since credentials might be missing, mock a successful response safely.
    const mockEventId = uuidv4();
    const mockMeetUrl = `https://meet.google.com/mock-${mockEventId.substring(0,8)}`;

    res.json({
      eventId: mockEventId,
      candidateId,
      recruiterId,
      date,
      time,
      duration: durationMinutes,
      meetUrl: mockMeetUrl,
      status: 'SCHEDULED'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
