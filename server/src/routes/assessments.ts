import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

function redactAnswerKey<T extends { questions: unknown }>(test: T) {
  const questions = Array.isArray(test.questions) ? test.questions : [];
  return {
    ...test,
    questions: questions.map((value: any) => {
      if (!value || typeof value !== 'object') return value;
      const { correctOptionIndex: _answerKey, ...question } = value;
      return question;
    })
  };
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const tests = await prisma.assessmentTest.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(tests.map(redactAnswerKey));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assessments.' });
  }
});

/* Keep this named route above /:id so it cannot be consumed as a test ID. */
router.get('/my-attempts', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { candidateId: req.user!.id },
      include: { test: { select: { title: true, category: true } } },
      orderBy: { completedAt: 'desc' }
    });
    res.json(attempts.map(({ test, ...attempt }) => ({ ...attempt, test })));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assessment attempts.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const test = await prisma.assessmentTest.findUnique({ where: { id: req.params.id } });
    if (!test) return res.status(404).json({ error: 'Assessment test not found.' });
    res.json(redactAnswerKey(test));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assessment.' });
  }
});

router.post('/:id/submit', requireAuth, requireRole(Role.CANDIDATE), async (req: Request, res: Response) => {
  try {
    const { answers, timeSpentSeconds } = req.body || {};
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ error: 'Assessment answers must be an object keyed by question ID.' });
    }
    if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 || timeSpentSeconds > 86400) {
      return res.status(400).json({ error: 'Time spent must be a whole number of seconds from 0 to 86400.' });
    }

    const test = await prisma.assessmentTest.findUnique({ where: { id: req.params.id } });
    if (!test) return res.status(404).json({ error: 'Assessment test not found.' });
    const questions = Array.isArray(test.questions) ? test.questions as any[] : [];
    if (!questions.length || questions.some((question) => question?.type !== 'mcq' || !Array.isArray(question.options) || question.options.length < 2 || !Number.isInteger(question.correctOptionIndex) || question.correctOptionIndex < 0 || question.correctOptionIndex >= question.options.length)) {
      return res.status(422).json({ error: 'This assessment contains unsupported or incomplete questions and cannot be scored.' });
    }
    const questionIds = new Set(questions.map((question) => question.id));
    if (questions.some((question) => typeof question.id !== 'string') || Object.keys(answers).some((questionId) => !questionIds.has(questionId))) {
      return res.status(400).json({ error: 'Answers contain an unknown question ID.' });
    }

    const categoryTotals = new Map<string, { earned: number; possible: number }>();
    const questionResults = questions.map((question) => {
      const category = typeof question.category === 'string' && question.category.trim() ? question.category.trim() : test.category;
      const points = Number.isFinite(question.points) && question.points > 0 ? question.points : 1;
      const selected = answers[question.id];
      if (selected !== undefined && (!Number.isInteger(selected) || selected < 0 || selected >= question.options.length)) {
        throw new Error(`Invalid selected option for question ${question.id}.`);
      }
      const correct = selected !== undefined && selected === question.correctOptionIndex;
      const totals = categoryTotals.get(category) || { earned: 0, possible: 0 };
      totals.possible += points;
      if (correct) totals.earned += points;
      categoryTotals.set(category, totals);
      return {
        questionId: question.id,
        question: String(question.question || ''),
        category,
        selectedOptionIndex: selected === undefined ? null : selected,
        correct,
        earnedPoints: correct ? points : 0,
        maxPoints: points
      };
    });

    const maxScore = questionResults.reduce((sum, result) => sum + result.maxPoints, 0);
    if (maxScore <= 0) return res.status(422).json({ error: 'This assessment has no scoreable points.' });
    const score = questionResults.reduce((sum, result) => sum + result.earnedPoints, 0);
    const percentage = Math.round((score / maxScore) * 100);
    const categoryScores = Object.fromEntries([...categoryTotals.entries()].map(([category, totals]) => [
      category,
      Math.round((totals.earned / totals.possible) * 100)
    ]));
    // Evaluation labels are deterministic: >=80% indicates demonstrated strength; <70% indicates a practice area.
    const strengths = Object.entries(categoryScores).filter(([, value]) => value >= 80).map(([category]) => category);
    const improvementAreas = Object.entries(categoryScores).filter(([, value]) => value < 70).map(([category]) => category);
    const improvementSuggestions = improvementAreas.map((category) =>
      `Practice ${category} with short exercises, then review the reasoning for each missed question.`
    );

    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        candidateId: req.user!.id,
        score,
        maxScore,
        percentage,
        passed: percentage >= test.passingScore,
        timeSpentSeconds,
        categoryScores,
        questionResults,
        strengths,
        improvementAreas,
        improvementSuggestions
      },
      include: { test: { select: { title: true, category: true } } }
    });
    res.status(201).json({
      message: attempt.passed ? 'Assessment passed and saved.' : 'Assessment completed and saved.',
      attempt
    });
  } catch (err: any) {
    if (err?.message?.startsWith('Invalid selected option')) return res.status(400).json({ error: err.message });
    console.error('Assessment submission error:', err?.message || 'unknown error');
    res.status(500).json({ error: 'Failed to score and save assessment.' });
  }
});

export default router;
