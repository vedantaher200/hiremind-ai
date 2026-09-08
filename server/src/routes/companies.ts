import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, PostingStatus } from '@prisma/client';

const router = Router();

/* ---------------- GET RECRUITER'S OWN COMPANY ---------------- */
router.get('/my-company', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { recruiterId: req.user!.id },
      include: {
        _count: {
          select: { jobs: true, internships: true, applications: true }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found for this recruiter.' });
    }

    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch company.' });
  }
});

/* ---------------- UPDATE RECRUITER'S OWN COMPANY ---------------- */
router.put('/my-company', requireAuth, requireRole(Role.RECRUITER), async (req: Request, res: Response) => {
  try {
    const {
      name,
      website,
      logo,
      industry,
      description,
      address,
      location,
      contactEmail,
      contactPhone,
      companySize,
      foundedYear,
      linkedinUrl
    } = req.body;

    const company = await prisma.company.findUnique({
      where: { recruiterId: req.user!.id }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found.' });
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(website && { website: String(website).trim() }),
        ...(logo !== undefined && { logo }),
        ...(industry !== undefined && { industry }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(location !== undefined && { location }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(companySize !== undefined && { companySize }),
        ...(foundedYear !== undefined && { foundedYear: Number(foundedYear) || undefined }),
        ...(linkedinUrl !== undefined && { linkedinUrl })
      }
    });

    res.json({ message: 'Company profile updated successfully.', company: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update company.' });
  }
});

/* ---------------- PUBLIC COMPANY DETAILS ---------------- */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          where: { status: PostingStatus.ACTIVE },
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
            employmentType: true,
            salaryRange: true,
            createdAt: true
          }
        },
        internships: {
          where: { status: PostingStatus.ACTIVE },
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
            duration: true,
            stipend: true,
            createdAt: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch company details.' });
  }
});

export default router;
