import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, ApplicationType, ApplicationStatus } from '@prisma/client';

const router = Router();

/* ---------------- CANDIDATE: APPLY FOR JOB OR INTERNSHIP ---------------- */
router.post('/', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const { jobId, internshipId, resumeId, notes } = req.body;

    if (!jobId && !internshipId) {
      return res.status(400).json({ error: 'Please specify either a jobId or internshipId.' });
    }

    const applicationType = jobId ? ApplicationType.JOB : ApplicationType.INTERNSHIP;

    // Verify posting exists and get recruiter & company IDs
    let recruiterId = '';
    let companyId = '';
    let postingTitle = '';

    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) return res.status(404).json({ error: 'Job posting not found.' });
      recruiterId = job.recruiterId;
      companyId = job.companyId;
      postingTitle = job.title;

      // Duplicate check
      const existing = await prisma.application.findFirst({
        where: { candidateId: req.user!.id, jobId }
      });
      if (existing) {
        return res.status(400).json({ error: 'You have already applied for this job.' });
      }
    } else if (internshipId) {
      const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
      if (!internship) return res.status(404).json({ error: 'Internship posting not found.' });
      recruiterId = internship.recruiterId;
      companyId = internship.companyId;
      postingTitle = internship.title;

      // Duplicate check
      const existing = await prisma.application.findFirst({
        where: { candidateId: req.user!.id, internshipId }
      });
      if (existing) {
        return res.status(400).json({ error: 'You have already applied for this internship.' });
      }
    }

    // Determine candidate resume if not explicitly passed
    let resolvedResumeId = resumeId;
    if (!resolvedResumeId) {
      const latestResume = await prisma.resume.findFirst({
        where: { candidateId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        include: { analyses: { take: 1, orderBy: { createdAt: 'desc' } } }
      });
      if (latestResume) {
        resolvedResumeId = latestResume.id;
      }
    }

    // Default scores based on latest analysis if available
    let scoresObj: any = {
      atsScore: 75,
      interviewScore: 0,
      codingScore: 0,
      aptitudeScore: 0,
      overallScore: 75
    };

    if (resolvedResumeId) {
      const analysis = await prisma.resumeAnalysis.findFirst({
        where: { resumeId: resolvedResumeId },
        orderBy: { createdAt: 'desc' }
      });
      if (analysis) {
        scoresObj.atsScore = analysis.atsScore;
        scoresObj.overallScore = analysis.atsScore;
      }
    }

    const application = await prisma.application.create({
      data: {
        candidateId: req.user!.id,
        recruiterId,
        companyId,
        jobId: jobId || null,
        internshipId: internshipId || null,
        applicationType,
        status: ApplicationStatus.APPLIED,
        resumeId: resolvedResumeId || null,
        scores: scoresObj,
        notes: notes ? String(notes).trim() : null
      },
      include: {
        job: { select: { title: true, location: true } },
        internship: { select: { title: true, location: true } },
        company: { select: { name: true, logo: true } }
      }
    });

    // Notify Recruiter
    await prisma.notification.create({
      data: {
        userId: recruiterId,
        title: `New Applicant: ${req.user!.name}`,
        message: `${req.user!.name} applied for "${postingTitle}".`,
        type: 'info'
      }
    });

    // Notify Candidate
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Application Submitted!',
        message: `Your application for "${postingTitle}" has been sent. Status: APPLIED.`,
        type: 'success'
      }
    });

    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (err: any) {
    console.error('Application submission error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit application.' });
  }
});

/* ---------------- CANDIDATE: GET MY APPLICATIONS ---------------- */
router.get('/my-applications', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      where: { candidateId: req.user!.id },
      include: {
        job: { select: { id: true, title: true, department: true, location: true, employmentType: true } },
        internship: { select: { id: true, title: true, department: true, location: true, duration: true } },
        company: { select: { id: true, name: true, logo: true, website: true } },
        resume: { select: { id: true, fileName: true, storagePath: true } },
        interviews: true
      },
      orderBy: { appliedAt: 'desc' }
    });

    // Internal recruiter notes are not part of the candidate-visible application payload.
    res.json(applications.map(({ notes: _internalNotes, ...application }) => application));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch candidate applications.' });
  }
});

/* Candidate feedback chat is scoped to the authenticated candidate's application. */
router.post('/:id/feedback-chat', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question || question.length > 1000) return res.status(400).json({ error: 'Enter a question up to 1000 characters.' });
    const application = await prisma.application.findFirst({
      where: { id: req.params.id, candidateId: req.user!.id },
      include: { job: true, internship: true, resume: { select: { extractedText: true } }, candidate: { select: { skills: true, education: true, experience: true } }, interviews: true }
    });
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    const posting = application.job || application.internship;
    const facts = {
      status: application.status,
      jobDescription: posting?.description || '',
      requirements: application.job?.requirements || application.job?.requiredSkills || application.internship?.skills || [],
      sharedFeedback: application.shareableFeedback || null,
      sharedCategories: application.feedbackCategories,
      assessmentResults: application.interviews.map((item: any) => ({ status: item.status, score: item.overallScore, feedback: item.summaryFeedback })),
      candidateEvidence: { skills: application.candidate.skills, education: application.candidate.education, experience: application.candidate.experience, resumeText: application.resume?.extractedText?.slice(0, 8000) || null }
    };
    if (!process.env.GEMINI_API_KEY) return res.json({ answer: application.shareableFeedback ? `Recorded facts: ${application.shareableFeedback}${application.feedbackCategories.length ? ` Categories: ${application.feedbackCategories.join(', ')}.` : ''}\n\nI can’t provide an AI-generated assessment right now because the assistant is not configured.` : 'No specific rejection reason has been provided by the recruiter. The stored application has no candidate-visible explanation. I can’t provide an AI-generated assessment right now because the assistant is not configured.', recordedFeedback: facts.sharedFeedback, suggestions: [] });
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Answer the candidate question using only the JSON evidence below. Clearly separate recorded facts from suggestions. Never infer or claim the rejection reason unless sharedFeedback explicitly records it. If absent, say no specific reason was provided. Suggestions must be labeled AI-generated and cannot be described as actual decision factors. Do not disclose private recruiter notes. If evidence is absent say so.\nEvidence: ${JSON.stringify(facts)}\nQuestion: ${question}`
    });
    res.json({ answer: result.text || 'I could not generate an answer from the available application evidence.', recordedFeedback: facts.sharedFeedback, suggestions: [] });
  } catch (err: any) {
    console.error('Candidate feedback chat failed:', err?.message || 'unknown error');
    res.status(500).json({ error: 'Unable to answer from your application right now.' });
  }
});

/* ---------------- RECRUITER: GET ALL APPLICANTS ---------------- */
router.get('/recruiter', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { jobId, internshipId, status, applicationType } = req.query;

    const where: any = { recruiterId: req.user!.id };

    if (jobId && typeof jobId === 'string') {
      where.jobId = jobId;
    }
    if (internshipId && typeof internshipId === 'string') {
      where.internshipId = internshipId;
    }
    if (status && typeof status === 'string' && status !== 'All') {
      where.status = status as ApplicationStatus;
    }
    if (applicationType && typeof applicationType === 'string' && applicationType !== 'All') {
      where.applicationType = applicationType as ApplicationType;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            title: true,
            location: true,
            skills: true,
            experience: true,
            education: true,
            matchScore: true
          }
        },
        job: { select: { id: true, title: true, department: true } },
        internship: { select: { id: true, title: true, department: true } },
        company: { select: { name: true } },
        resume: {
          select: {
            id: true,
            fileName: true,
            storagePath: true,
            extractedText: true,
            analyses: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        interviews: true
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.json(applications);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch recruiter applications.' });
  }
});

/* ---------------- RECRUITER: UPDATE APPLICATION STATUS ---------------- */
router.patch('/:id/status', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, shareableFeedback, feedbackCategories } = req.body;

    if (!status || !Object.values(ApplicationStatus).includes(status)) {
      return res.status(400).json({ error: 'Valid application status is required.' });
    }
    if (status === ApplicationStatus.REJECTED && (!String(shareableFeedback || '').trim() || String(shareableFeedback).trim().length > 2000)) {
      return res.status(400).json({ error: 'A candidate-visible, factual rejection explanation (1–2000 characters) is required.' });
    }
    if (feedbackCategories !== undefined && (!Array.isArray(feedbackCategories) || feedbackCategories.some((item: unknown) => typeof item !== 'string' || item.length > 80))) {
      return res.status(400).json({ error: 'Feedback categories must be a list of short text values.' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: { select: { title: true } },
        internship: { select: { title: true } }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.recruiterId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to manage this applicant.' });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: status as ApplicationStatus,
        statusChangedAt: new Date(),
        ...(status === ApplicationStatus.REJECTED && { shareableFeedback: String(shareableFeedback).trim(), feedbackCategories: feedbackCategories || [] }),
        ...(notes !== undefined && { notes: String(notes) }),
        updatedAt: new Date()
      }
    });

    const postingTitle = application.job?.title || application.internship?.title || 'your application';

    // Notify Candidate of status change
    await prisma.notification.create({
      data: {
        userId: application.candidateId,
        title: `Application Status Updated: ${status}`,
        message: `Your status for "${postingTitle}" has been updated to "${status}".`,
        type: status === ApplicationStatus.REJECTED ? 'alert' : 'info'
      }
    });

    res.json({ message: `Application status updated to ${status}.`, application: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update application status.' });
  }
});

export default router;
