import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, ApplicationStatus } from '@prisma/client';
import { createGoogleMeetInterview } from '../services/googleCalendar.js';

const router = Router();

/* ---------------- GET USER'S SCHEDULED INTERVIEWS ---------------- */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const isCandidate = req.user!.role === Role.CANDIDATE;
    const where = isCandidate ? { candidateId: req.user!.id } : { recruiterId: req.user!.id };

    const interviews = await prisma.scheduledInterview.findMany({
      where,
      include: {
        candidate: { select: { id: true, name: true, email: true, avatar: true } },
        recruiter: { select: { id: true, name: true, email: true } },
        job: { select: { id: true, title: true, department: true } },
        internship: { select: { id: true, title: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(interviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scheduled interviews.' });
  }
});

/* ---------------- RECRUITER: SCHEDULE AN INTERVIEW ---------------- */
router.post('/', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const {
      candidateId,
      applicationId,
      jobId,
      internshipId,
      date,
      time,
      durationMinutes = 45,
      timeZone,
      interviewType = 'Technical',
      mode = 'Virtual (Google Meet)',
      meetingLink,
      notes
    } = req.body;

    if (!candidateId || !date || !time) {
      return res.status(400).json({ error: 'Candidate ID, date, and time are required.' });
    }

    const candidate = await prisma.user.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    if (applicationId) {
      const application = await prisma.application.findFirst({ where: { id: applicationId, candidateId, recruiterId: req.user!.id } });
      if (!application) return res.status(403).json({ error: 'This application is not managed by your account.' });
    }
    if (!Number.isInteger(Number(durationMinutes)) || Number(durationMinutes) < 15 || Number(durationMinutes) > 240) return res.status(400).json({ error: 'Duration must be between 15 and 240 minutes.' });
    let confirmedMeetingLink = meetingLink ? String(meetingLink) : null;
    let googleEventId: string | null = null;
    if (String(mode).toLowerCase().includes('virtual')) {
      if (meetingLink) return res.status(400).json({ error: 'Enter a date and time; meeting links are created by Google Calendar.' });
      if (typeof timeZone !== 'string' || !timeZone.trim()) return res.status(400).json({ error: 'A valid time zone is required for a virtual interview.' });
      try {
        const created = await createGoogleMeetInterview(req.user!.id, candidate.email, candidate.name, jobId ? (await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } }))?.title || 'Interview' : 'Interview', String(date), String(time), Number(durationMinutes), timeZone);
        if (!created.googleEventId || !created.meetingLink) throw new Error('Google Calendar did not return an event and meeting URL.');
        confirmedMeetingLink = created.meetingLink;
        googleEventId = created.googleEventId;
      } catch (error: any) {
        console.warn('Google Calendar interview creation failed:', error?.message || 'unknown error');
        return res.status(503).json({ error: error?.message?.includes('not configured') ? error.message : 'Google Calendar could not create the interview. No interview was saved.' });
      }
    }

    const interview = await prisma.scheduledInterview.create({
      data: {
        candidateId,
        recruiterId: req.user!.id,
        applicationId: applicationId || null,
        jobId: jobId || null,
        internshipId: internshipId || null,
        date: String(date),
        time: String(time),
        timeZone: timeZone ? String(timeZone) : null,
        durationMinutes: Number(durationMinutes) || 45,
        interviewType: String(interviewType),
        mode: String(mode),
        meetingLink: confirmedMeetingLink,
        googleEventId,
        notes: notes ? String(notes) : null,
        status: 'Scheduled'
      },
      include: {
        job: { select: { title: true } },
        internship: { select: { title: true } }
      }
    });

    // Update application status to INTERVIEW_SCHEDULED if applicationId provided
    if (applicationId) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.INTERVIEW_SCHEDULED }
      });
    }

    // Notify Candidate
    const postingName = interview.job?.title || interview.internship?.title || 'Opportunity';
    await prisma.notification.create({
      data: {
        userId: candidateId,
        title: `Interview Scheduled: ${interviewType}`,
        message: `An interview for "${postingName}" has been scheduled for ${date} at ${time}. Link: ${meetingLink}`,
        type: 'info'
      }
    });

    res.status(201).json({ message: 'Interview scheduled successfully!', interview });
  } catch (err: any) {
    console.error('Interview scheduling error:', err);
    res.status(500).json({ error: err.message || 'Failed to schedule interview.' });
  }
});

export default router;
