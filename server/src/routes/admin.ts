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

export default router;
