import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ---------------- SUBMIT RECRUITER / CANDIDATE FEEDBACK ---------------- */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyId, jobId, internshipId, applicationId, rating, feedback } = req.body;

    if (!companyId || !rating || !feedback) {
      return res.status(400).json({ error: 'Company ID, rating, and feedback text are required.' });
    }

    const created = await prisma.feedback.create({
      data: {
        candidateId: req.user!.id,
        companyId,
        jobId: jobId || null,
        internshipId: internshipId || null,
        applicationId: applicationId || null,
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        feedback: String(feedback).trim()
      }
    });

    res.status(201).json({ message: 'Feedback submitted successfully.', feedback: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit feedback.' });
  }
});

/* ---------------- GET FEEDBACK FOR A COMPANY ---------------- */
router.get('/company/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const feedbacks = await prisma.feedback.findMany({
      where: { companyId },
      include: {
        candidate: { select: { name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(feedbacks);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch feedback.' });
  }
});

export default router;
