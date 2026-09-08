import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ---------------- GET CURRENT USER NOTIFICATIONS ---------------- */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications.' });
  }
});

/* ---------------- MARK NOTIFICATION AS READ ---------------- */
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notification.' });
  }
});

/* ---------------- MARK ALL AS READ ---------------- */
router.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark all as read.' });
  }
});

export default router;
