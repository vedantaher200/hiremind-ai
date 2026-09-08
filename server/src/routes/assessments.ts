import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

/* ---------------- LIST ALL ASSESSMENT TESTS ---------------- */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tests = await prisma.assessmentTest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tests);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assessments.' });
  }
});

/* ---------------- GET SINGLE ASSESSMENT TEST ---------------- */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const test = await prisma.assessmentTest.findUnique({ where: { id } });
    if (!test) {
      return res.status(404).json({ error: 'Assessment test not found.' });
    }
    res.json(test);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assessment.' });
  }
});

/* ---------------- CANDIDATE: SUBMIT TEST ATTEMPT ---------------- */
router.post('/:id/submit', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, timeSpentSeconds } = req.body;

    const test = await prisma.assessmentTest.findUnique({ where: { id } });
    if (!test) {
      return res.status(404).json({ error: 'Assessment test not found.' });
    }

    const questions = test.questions as any[];
    let earnedPoints = 0;
    let totalPoints = 0;

    questions.forEach((q: any) => {
      const qPoints = q.points || 5;
      totalPoints += qPoints;
      if (answers && answers[q.id] !== undefined) {
        if (answers[q.id] === q.correctOptionIndex) {
          earnedPoints += qPoints;
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= test.passingScore;

    const attempt = await prisma.testAttempt.create({
      data: {
        testId: id,
        candidateId: req.user!.id,
        score: earnedPoints,
        maxScore: totalPoints,
        percentage,
        passed,
        timeSpentSeconds: Number(timeSpentSeconds) || 0
      },
      include: { test: { select: { title: true, category: true } } }
    });

    // Update candidate score in related applications
    await prisma.application.updateMany({
      where: { candidateId: req.user!.id },
      data: {
        scores: {
          atsScore: 75,
          interviewScore: 0,
          codingScore: percentage,
          aptitudeScore: percentage,
          overallScore: Math.round((75 + percentage) / 2)
        }
      }
    });

    res.status(201).json({
      message: passed ? 'Assessment Passed!' : 'Assessment Completed.',
      attempt
    });
  } catch (err: any) {
    console.error('Test submission error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit test attempt.' });
  }
});

/* ---------------- GET CANDIDATE'S TEST ATTEMPTS ---------------- */
router.get('/my-attempts', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { candidateId: req.user!.id },
      include: { test: true },
      orderBy: { completedAt: 'desc' }
    });
    res.json(attempts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch test attempts.' });
  }
});

export default router;
