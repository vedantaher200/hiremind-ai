import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Role, CompanyVerificationStatus, PostingStatus } from '@prisma/client';

const router = Router();

// Protect all admin routes: require authentication and ADMIN role
router.use(requireAuth, requireRole(Role.ADMIN));

/* ---------------- ADMIN PLATFORM STATS ---------------- */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalCandidates,
      totalRecruiters,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      activeJobs,
      activeInternships,
      totalApplications,
      totalInterviews
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.CANDIDATE } }),
      prisma.user.count({ where: { role: Role.RECRUITER } }),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.PENDING } }),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.APPROVED } }),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.REJECTED } }),
      prisma.job.count({ where: { status: PostingStatus.ACTIVE } }),
      prisma.internship.count({ where: { status: PostingStatus.ACTIVE } }),
      prisma.application.count(),
      prisma.scheduledInterview.count()
    ]);

    res.json({
      totalCandidates,
      totalRecruiters,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      activeJobs,
      activeInternships,
      totalApplications,
      totalInterviews
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats.' });
  }
});

/* ---------------- LIST COMPANIES FOR VERIFICATION ---------------- */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.verificationStatus = status as CompanyVerificationStatus;
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            jobs: true,
            internships: true,
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(companies);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch companies.' });
  }
});

/* ---------------- APPROVE COMPANY ---------------- */
router.post('/companies/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: { recruiter: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        verificationStatus: CompanyVerificationStatus.APPROVED,
        rejectionReason: null,
        verifiedBy: req.user!.id,
        verifiedAt: new Date()
      }
    });

    // Create Notification for Recruiter
    await prisma.notification.create({
      data: {
        userId: company.recruiterId,
        title: 'Company Verification Approved!',
        message: `Congratulations! Your company "${company.name}" has been approved. You can now publish jobs and internships.`,
        type: 'success'
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'COMPANY_APPROVED',
        entityType: 'Company',
        entityId: id,
        details: {
          companyName: company.name,
          recruiterEmail: company.recruiter.email,
          approvedBy: req.user!.name
        }
      }
    });

    res.json({ message: `Company "${company.name}" has been approved.`, company: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to approve company.' });
  }
});

/* ---------------- REJECT COMPANY WITH REASON ---------------- */
router.post('/companies/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({
        error: 'A specific rejection reason (at least 5 characters) is required.'
      });
    }

    const company = await prisma.company.findUnique({
      where: { id },
      include: { recruiter: true }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        verificationStatus: CompanyVerificationStatus.REJECTED,
        rejectionReason: String(reason).trim(),
        verifiedBy: req.user!.id,
        verifiedAt: new Date()
      }
    });

    // Notification for Recruiter
    await prisma.notification.create({
      data: {
        userId: company.recruiterId,
        title: 'Company Verification Update',
        message: `Your company verification was not approved. Reason: ${reason}`,
        type: 'alert'
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'COMPANY_REJECTED',
        entityType: 'Company',
        entityId: id,
        details: {
          companyName: company.name,
          recruiterEmail: company.recruiter.email,
          reason,
          rejectedBy: req.user!.name
        }
      }
    });

    res.json({ message: `Company "${company.name}" has been rejected.`, company: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject company.' });
  }
});

/* ---------------- AUDIT LOGS ---------------- */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs.' });
  }
});

/* ---------------- LIST ALL CANDIDATES (Admin Monitoring) ---------------- */
router.get('/candidates', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const where: any = { role: Role.CANDIDATE };

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.availabilityStatus = status;
    }

    const candidates = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        location: true,
        title: true,
        bio: true,
        skills: true,
        experience: true,
        education: true,
        matchScore: true,
        profileCompletion: true,
        availabilityStatus: true,
        yearsOfExperience: true,
        createdAt: true,
        resumes: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            storagePath: true,
            createdAt: true,
            analyses: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { atsScore: true }
            }
          }
        },
        _count: {
          select: {
            applications: true,
            testAttempts: true,
            candidateInterviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = candidates.map(c => ({
      ...c,
      resumes: c.resumes.map(r => ({
        id: r.id,
        fileName: r.fileName,
        fileUrl: r.storagePath.startsWith('http') ? r.storagePath : `/uploads/${r.storagePath}`,
        atsScore: r.analyses?.[0]?.atsScore || 0,
        createdAt: r.createdAt
      }))
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch candidates.' });
  }
});

/* ---------------- LIST ALL PLATFORM JOBS (Admin Monitoring) ---------------- */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status as PostingStatus;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } }
      ];
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
            verificationStatus: true,
            recruiter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = jobs.map(j => ({
      ...j,
      recruiter: j.company?.recruiter || null
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch platform jobs.' });
  }
});

/* ---------------- UPDATE PLATFORM JOB STATUS (Admin Moderation) ---------------- */
router.put('/jobs/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.job.update({
      where: { id },
      data: { status: status as PostingStatus }
    });

    res.json({ message: 'Job status updated successfully.', job: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update job status.' });
  }
});

/* ---------------- LIST ALL PLATFORM INTERNSHIPS (Admin Monitoring) ---------------- */
router.get('/internships', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status as PostingStatus;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } }
      ];
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
            verificationStatus: true,
            recruiter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = internships.map(i => ({
      ...i,
      recruiter: i.company?.recruiter || null
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch platform internships.' });
  }
});

/* ---------------- UPDATE PLATFORM INTERNSHIP STATUS (Admin Moderation) ---------------- */
router.put('/internships/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.internship.update({
      where: { id },
      data: { status: status as PostingStatus }
    });

    res.json({ message: 'Internship status updated successfully.', internship: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update internship status.' });
  }
});

/* ---------------- COMPREHENSIVE PLATFORM ANALYTICS ---------------- */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const [
      totalCandidates,
      totalRecruiters,
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      activeJobs,
      closedJobs,
      activeInternships,
      closedInternships,
      totalApplications,
      totalInterviews,
      applicationsByStatus,
      recentRegistrations
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.CANDIDATE } }),
      prisma.user.count({ where: { role: Role.RECRUITER } }),
      prisma.company.count(),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.PENDING } }),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.APPROVED } }),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.REJECTED } }),
      prisma.job.count({ where: { status: PostingStatus.ACTIVE } }),
      prisma.job.count({ where: { status: PostingStatus.CLOSED } }),
      prisma.internship.count({ where: { status: PostingStatus.ACTIVE } }),
      prisma.internship.count({ where: { status: PostingStatus.CLOSED } }),
      prisma.application.count(),
      prisma.scheduledInterview.count(),
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      })
    ]);

    const appStatusMap: Record<string, number> = {};
    applicationsByStatus.forEach(g => {
      appStatusMap[g.status] = g._count.status;
    });

    res.json({
      kpis: {
        totalCandidates,
        totalRecruiters,
        totalCompanies,
        activeJobs,
        closedJobs,
        activeInternships,
        closedInternships,
        totalApplications,
        totalInterviews,
        pendingApprovals: pendingCompanies,
        approvedCompanies,
        rejectedCompanies
      },
      companyBreakdown: {
        pending: pendingCompanies,
        approved: approvedCompanies,
        rejected: rejectedCompanies,
        total: totalCompanies
      },
      postingsDistribution: {
        activeJobs,
        closedJobs,
        activeInternships,
        closedInternships,
        totalPostings: activeJobs + closedJobs + activeInternships + closedInternships
      },
      applicationPipeline: appStatusMap,
      recentRegistrations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch platform analytics.' });
  }
});

export default router;
