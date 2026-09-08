import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, PostingStatus, CompanyVerificationStatus } from '@prisma/client';

const router = Router();

/* ---------------- LIST ACTIVE JOBS (Public / Candidate) ---------------- */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, department, location, type, experienceLevel } = req.query;

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

    if (department && typeof department === 'string' && department !== 'All') {
      where.department = department;
    }

    if (location && typeof location === 'string' && location !== 'All') {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (type && typeof type === 'string' && type !== 'All') {
      where.employmentType = type;
    }

    if (experienceLevel && typeof experienceLevel === 'string' && experienceLevel !== 'All') {
      where.experienceLevel = experienceLevel;
    }

    const jobs = await prisma.job.findMany({
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

    const formatted = jobs.map((j) => ({
      ...j,
      applicantCount: j._count.applications
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch jobs.' });
  }
});

/* ---------------- GET RECRUITER'S POSTED JOBS ---------------- */
router.get('/my-jobs', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
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

    const formatted = jobs.map((j) => ({
      ...j,
      applicantCount: j._count.applications
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch recruiter jobs.' });
  }
});

/* ---------------- GET SINGLE JOB DETAILS ---------------- */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job posting not found.' });
    }

    res.json({
      ...job,
      applicantCount: job._count.applications
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch job details.' });
  }
});

/* ---------------- CREATE JOB (Recruiter Only) ---------------- */
router.post('/', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const userCompany = await prisma.company.findUnique({
      where: { recruiterId: req.user!.id }
    });

    if (!userCompany || userCompany.verificationStatus !== CompanyVerificationStatus.APPROVED) {
      return res.status(403).json({
        error: 'Only approved company recruiters can post jobs. Verification is required.'
      });
    }

    const {
      title,
      department,
      description,
      requirements,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      location,
      workMode,
      employmentType,
      salaryRange,
      openings,
      deadline
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Job title and description are required.' });
    }

    const job = await prisma.job.create({
      data: {
        recruiterId: req.user!.id,
        companyId: userCompany.id,
        title: String(title).trim(),
        department: department || 'Engineering',
        description: String(description).trim(),
        requirements: Array.isArray(requirements) ? requirements : [],
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
        preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
        experienceLevel: experienceLevel || 'Mid',
        location: location || 'Remote',
        workMode: workMode || 'Remote',
        employmentType: employmentType || 'Full-time',
        salaryRange: salaryRange || undefined,
        openings: Number(openings) || 1,
        deadline: deadline ? new Date(deadline) : undefined,
        status: PostingStatus.ACTIVE
      },
      include: { company: true }
    });

    res.status(201).json({ message: 'Job posted successfully!', job });
  } catch (err: any) {
    console.error('Job creation error:', err);
    res.status(500).json({ error: err.message || 'Failed to create job.' });
  }
});

/* ---------------- UPDATE JOB (Recruiter Ownership) ---------------- */
router.put('/:id', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    if (existing.recruiterId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to edit this job.' });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Job updated successfully.', job: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update job.' });
  }
});

/* ---------------- DELETE / CLOSE JOB ---------------- */
router.delete('/:id', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    if (existing.recruiterId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to close this job.' });
    }

    // Soft close the job
    const closed = await prisma.job.update({
      where: { id },
      data: { status: PostingStatus.CLOSED }
    });

    res.json({ message: 'Job closed successfully.', job: closed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to close job.' });
  }
});

export default router;
