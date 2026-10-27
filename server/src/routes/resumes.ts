import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Role, PostingStatus } from '@prisma/client';
import { scoreResumeText } from '../services/resumeScoring.js';

const router = Router();

/* Resume files are private: only the owner or a recruiter with an application
   linked to that resume can retrieve them. */
router.get('/:id/file', requireAuth, async (req: Request, res: Response) => {
  try {
    const where = req.user!.role === Role.ADMIN
      ? { id: req.params.id }
      : {
          id: req.params.id,
          OR: [
            { candidateId: req.user!.id },
            { applications: { some: { recruiterId: req.user!.id } } }
          ]
        };
    const resume = await prisma.resume.findFirst({ where });
    if (!resume) return res.status(404).json({ error: 'Resume not found or access denied.' });

    const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join('/tmp', 'uploads') : './uploads');
    const resumeDirectory = path.resolve(uploadDir, 'resumes');
    const filePath = path.resolve(resumeDirectory, path.basename(resume.storagePath));
    const relativeFilePath = path.relative(resumeDirectory, filePath);
    if (relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Resume file is unavailable.' });
    }
    res.download(filePath, resume.fileName);
  } catch (err: any) {
    console.error('Resume download error:', err?.message || 'unknown error');
    res.status(500).json({ error: 'Unable to retrieve resume.' });
  }
});

/* ---------------- UPLOAD RESUME & EXTRACT TEXT ---------------- */
router.post(
  '/upload',
  requireAuth,
  requireRole(Role.CANDIDATE),
  upload.single('resume'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please select a resume file to upload.' });
      }

      const filePath = req.file.path;
      if (!['application/pdf', 'text/plain'].includes(req.file.mimetype)) {
        fs.unlink(filePath, () => undefined);
        return res.status(415).json({ error: 'Resume parsing currently supports PDF and plain text files only.' });
      }
      let extractedText = '';

      // Text extraction
      if (req.file.mimetype === 'application/pdf') {
        try {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfParseModule = await import('pdf-parse');
          
          if ((pdfParseModule as any).PDFParse) {
             // pdf-parse version 2.4.5 API (Vercel production)
             const PDFParse = (pdfParseModule as any).PDFParse;
             const parser = new PDFParse({ data: dataBuffer });
             const pdfData = await parser.getText();
             extractedText = pdfData.text || '';
          } else {
             // pdf-parse version 1.1.1 API (Local development)
             const pdfParseFn = (pdfParseModule as any).default || pdfParseModule;
             const pdfData = await pdfParseFn(dataBuffer);
             extractedText = pdfData.text || '';
          }
        } catch {
          fs.unlink(filePath, () => undefined);
          return res.status(422).json({ error: 'The PDF could not be parsed. Please upload a readable, text-based PDF.' });
        }
      }

      if (req.file.mimetype === 'text/plain') {
        extractedText = fs.readFileSync(filePath, 'utf8');
      }
      if (!extractedText || extractedText.trim().length < 30) {
        fs.unlink(filePath, () => undefined);
        return res.status(422).json({ error: 'No readable resume text was extracted. No resume record or ATS result was created.' });
      }

      // Save Resume record in PostgreSQL
      const resume = await prisma.resume.create({
        data: {
          candidateId: req.user!.id,
          fileName: req.file.originalname,
          storagePath: req.file.filename,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          extractedText: extractedText.slice(0, 50000)
        }
      });

      res.status(201).json({
        message: 'Resume uploaded and processed successfully.',
        resumeId: resume.id,
        fileName: resume.fileName,
        extractedText: resume.extractedText
      });
    } catch (err: any) {
      console.error('Resume upload error:', err);
      res.status(500).json({ error: err.message || 'Failed to upload and parse resume.' });
    }
  }
);

/* ---------------- DETERMINISTIC RESUME EVIDENCE ANALYSIS ---------------- */
router.post('/analyze', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const { resumeId } = req.body;
    const resume = typeof resumeId === 'string'
      ? await prisma.resume.findFirst({ where: { id: resumeId, candidateId: req.user!.id } })
      : await prisma.resume.findFirst({ where: { candidateId: req.user!.id }, orderBy: { createdAt: 'desc' } });
    if (!resume) return res.status(404).json({ error: 'No resume belonging to this account was found.' });
    if (!resume.extractedText || resume.extractedText.trim().length < 30) {
      return res.status(422).json({ error: 'The stored resume has no readable extracted text. Upload a readable PDF or text file before analyzing.' });
    }

    const existingAnalysis = await prisma.resumeAnalysis.findFirst({ where: { resumeId: resume.id, scoringVersion: 'deterministic-v1' }, orderBy: { createdAt: 'desc' } });
    if (existingAnalysis) return res.json({ message: 'Loaded the current deterministic resume analysis.', analysis: existingAnalysis });

    const result = scoreResumeText(resume.extractedText);
    const savedAnalysis = await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        candidateId: req.user!.id,
        atsScore: result.atsScore,
        skillMatch: result.skillMatch,
        experienceMatch: result.experienceMatch,
        educationMatch: result.educationMatch,
        extractedSkills: result.extractedSkills,
        skillEvidence: result.skillEvidence,
        missingSkills: result.missingSkills,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        experienceSummary: result.experienceSummary,
        educationSummary: result.educationSummary,
        recommendation: result.recommendation,
        improvementSuggestions: result.improvementSuggestions,
        scoringVersion: result.scoringVersion
      }
    });

    res.json({
      message: 'Resume evidence analysis completed and saved permanently.',
      analysis: savedAnalysis
    });
  } catch (err: any) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze resume.' });
  }
});

/* ---------------- GET LATEST RESUME & SAVED ANALYSIS ---------------- */
router.get('/latest', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { candidateId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!resume) {
      return res.json({ resume: null, analysis: null });
    }

    res.json({
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        createdAt: resume.createdAt,
        extractedText: resume.extractedText
      },
      analysis: resume.analyses[0] || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch resume.' });
  }
});

/* ---------------- MULTI-POSTING MATCHING ENGINE ---------------- */
// Matches candidate's resume skills against ALL active jobs & internships
router.get('/match-all', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const candidate = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        resumes: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { analyses: { take: 1, orderBy: { createdAt: 'desc' } } }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const latestAnalysis = candidate.resumes[0]?.analyses[0];
    const candidateSkills: string[] = latestAnalysis?.scoringVersion === 'deterministic-v1'
      ? latestAnalysis.extractedSkills
      : [];

    const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());

    const [activeJobs, activeInternships] = await Promise.all([
      prisma.job.findMany({
        where: { status: PostingStatus.ACTIVE },
        include: { company: { select: { name: true, logo: true } } }
      }),
      prisma.internship.findMany({
        where: { status: PostingStatus.ACTIVE },
        include: { company: { select: { name: true, logo: true } } }
      })
    ]);

    // Matching Algorithm
    const calculateMatch = (requiredSkills: string[], preferredSkills: string[] = []): number | null => {
      // Do not manufacture a match score when either side has no evidence.
      if (candidateSkillsLower.length === 0 || !requiredSkills || requiredSkills.length === 0) return null;

      let matchedCount = 0;
      requiredSkills.forEach((reqSkill) => {
        const lower = reqSkill.toLowerCase();
        if (candidateSkillsLower.some((candSkill) => candSkill.includes(lower) || lower.includes(candSkill))) {
          matchedCount++;
        }
      });

      const reqRatio = matchedCount / requiredSkills.length;
      let score = Math.round(50 + reqRatio * 45); // 50% base + up to 45% based on required skills

      // Preferred skills bonus
      if (preferredSkills && preferredSkills.length > 0) {
        const matchedPref = preferredSkills.filter((p) =>
          candidateSkillsLower.some((c) => c.includes(p.toLowerCase()))
        ).length;
        score += Math.min(5, matchedPref * 2);
      }

      return Math.min(99, Math.max(35, score));
    };

    const jobMatches = activeJobs.map((job) => ({
      id: job.id,
      title: job.title,
      type: 'JOB',
      company: job.company.name,
      location: job.location,
      department: job.department,
      requiredSkills: job.requiredSkills,
      matchScore: calculateMatch(job.requiredSkills, job.preferredSkills),
      matchStatus: candidateSkillsLower.length === 0 || job.requiredSkills.length === 0 ? 'INSUFFICIENT_EVIDENCE' : 'SCORED'
    }));

    const internshipMatches = activeInternships.map((internship) => ({
      id: internship.id,
      title: internship.title,
      type: 'INTERNSHIP',
      company: internship.company.name,
      location: internship.location,
      department: internship.department,
      requiredSkills: internship.skills,
      matchScore: calculateMatch(internship.skills),
      matchStatus: candidateSkillsLower.length === 0 || internship.skills.length === 0 ? 'INSUFFICIENT_EVIDENCE' : 'SCORED'
    }));

    // Combine and sort by match score descending
    const allMatches = [...jobMatches, ...internshipMatches].sort(
      (a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1)
    );

    res.json({
      candidateSkills,
      totalPostingsEvaluated: allMatches.length,
      matches: allMatches
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Matching engine calculation failed.' });
  }
});

export default router;
