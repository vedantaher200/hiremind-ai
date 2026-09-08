import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, PostingStatus, CompanyVerificationStatus } from '@prisma/client';

const router = Router();

/* ---------------- LIST ACTIVE INTERNSHIPS (Public / Candidate) ---------------- */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, location, mode, duration } = req.query;

    const where: any = {
      status: PostingStatus.ACTIVE,
      company: {
        verificationStatus: CompanyVerificationStatus.APPROVED
      }
    };

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (location && typeof location === 'string' && location !== 'All') {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (mode && typeof mode === 'string' && mode !== 'All') {
      where.mode = mode;
    }

    if (duration && typeof duration === 'string' && duration !== 'All') {
      where.duration = { contains: duration, mode: 'insensitive' };
    }

    const internships = await prisma.internship.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            location: true
          }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = internships.map((item) => ({
      ...item,
      applicantCount: item._count.applications
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch internships.' });
  }
});

/* ---------------- GET RECRUITER'S INTERNSHIPS ---------------- */
router.get('/my-internships', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const internships = await prisma.internship.findMany({
      where: { recruiterId: req.user!.id },
      include: {
        company: {
          select: { name: true, logo: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = internships.map((item) => ({
      ...item,
      applicantCount: item._count.applications
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch recruiter internships.' });
  }
});

/* ---------------- GET SINGLE INTERNSHIP DETAIL ---------------- */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship posting not found.' });
    }

    res.json({
      ...internship,
      applicantCount: internship._count.applications
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch internship details.' });
  }
});

/* ---------------- CREATE INTERNSHIP (Recruiter Only) ---------------- */
router.post('/', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const userCompany = await prisma.company.findUnique({
      where: { recruiterId: req.user!.id }
    });

    if (!userCompany || userCompany.verificationStatus !== CompanyVerificationStatus.APPROVED) {
      return res.status(403).json({
        error: 'Only approved company recruiters can post internships. Verification is required.'
      });
    }

    const {
      title,
      department,
      description,
      skills,
      eligibility,
      location,
      mode,
      duration,
      stipend,
      startDate,
      openings,
      deadline
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Internship title and description are required.' });
    }

    const internship = await prisma.internship.create({
      data: {
        recruiterId: req.user!.id,
        companyId: userCompany.id,
        title: String(title).trim(),
        department: department || 'Engineering',
        description: String(description).trim(),
        skills: Array.isArray(skills) ? skills : [],
        eligibility: eligibility || 'Students or Fresh Graduates',
        location: location || 'Remote',
        mode: mode || 'Remote',
        duration: duration || '3 Months',
        stipend: stipend || 'Stipend provided',
        startDate: startDate ? new Date(startDate) : undefined,
        openings: Number(openings) || 1,
        deadline: deadline ? new Date(deadline) : undefined,
        status: PostingStatus.ACTIVE
      },
      include: { company: true }
    });

    res.status(201).json({ message: 'Internship posted successfully!', internship });
  } catch (err: any) {
    console.error('Internship creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to create internship.' });
  }
});

/* ---------------- UPDATE INTERNSHIP (Recruiter Ownership) ---------------- */
router.put('/:id', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.internship.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    if (existing.recruiterId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to edit this internship.' });
    }

    const updated = await prisma.internship.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Internship updated successfully.', internship: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update internship.' });
  }
});

/* ---------------- CLOSE INTERNSHIP ---------------- */
router.delete('/:id', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.internship.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    if (existing.recruiterId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to close this internship.' });
    }

    const closed = await prisma.internship.update({
      where: { id },
      data: { status: PostingStatus.CLOSED }
    });

    res.json({ message: 'Internship closed successfully.', internship: closed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to close internship.' });
  }
});

export default router;
