import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { Role, CompanyVerificationStatus } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hiremind_jwt_secret_dev_key_2026_super_safe';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const generateToken = (user: { id: string; email: string; role: Role }) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/* ---------------- CANDIDATE REGISTRATION ---------------- */
router.post('/register-candidate', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = Math.random().toString(36).substring(2, 15);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: String(name).trim(),
        passwordHash,
        role: Role.CANDIDATE,
        isEmailVerified: true, // Auto-verified for local/testing convenience while supporting token
        emailVerifyToken: verifyToken,
        skills: [],
        experience: [],
        education: []
      }
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Candidate registration successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        skills: user.skills
      }
    });
  } catch (err: any) {
    console.error('Candidate registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

/* ---------------- RECRUITER REGISTRATION (Admin Verification Required) ---------------- */
router.post('/register-recruiter', async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName } = req.body;
    const companyWebsite = req.body.companyWebsite || req.body.website;
    const verificationDocuments = req.body.verificationDocuments;
    if (!name || !email || !password || !companyName || !companyWebsite) {
      return res.status(400).json({
        error: 'Name, email, password, company name, and company website are required.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = Math.random().toString(36).substring(2, 15);

    // Create recruiter with PENDING company
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: String(name).trim(),
        passwordHash,
        role: Role.RECRUITER,
        isEmailVerified: true,
        emailVerifyToken: verifyToken,
        company: {
          create: {
            name: String(companyName).trim(),
            website: String(companyWebsite).trim(),
            verificationStatus: CompanyVerificationStatus.PENDING,
            verificationDocuments: verificationDocuments || []
          }
        }
      },
      include: { company: true }
    });

    // Record audit log for Admin review
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'RECRUITER_REGISTRATION_SUBMITTED',
        entityType: 'Company',
        entityId: user.company?.id,
        details: {
          companyName: user.company?.name,
          recruiterEmail: user.email,
          website: user.company?.website
        }
      }
    });

    res.status(201).json({
      message:
        'Recruiter account created! Your company registration is pending Admin verification. You will be able to log in once approved.',
      status: 'PENDING_APPROVAL',
      companyId: user.company?.id
    });
  } catch (err: any) {
    console.error('Recruiter registration error:', err);
    res.status(500).json({ error: err.message || 'Recruiter registration failed.' });
  }
});

/* ---------------- CONTROLLED ADMIN REGISTRATION / PROVISIONING ---------------- */
router.post('/register-admin', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const setupKey = req.body.setupKey || req.body.adminSetupKey || req.body.admin_setup_key;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (!expectedKey) {
      return res.status(500).json({
        error: 'Admin setup is not configured on the server. Please contact the system administrator.'
      });
    }

    if (!setupKey || setupKey !== expectedKey) {
      return res.status(403).json({
        error: 'Invalid admin setup key.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      if (existing.role === Role.ADMIN) {
        return res.status(400).json({ error: 'An account with this email is already an Admin. Please sign in.' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: String(name).trim(),
          passwordHash,
          role: Role.ADMIN,
          isEmailVerified: true,
          title: 'Platform Administrator',
          location: 'Global Center'
        }
      });
      return res.status(201).json({
        message: 'Admin account provisioned successfully. You can now log in.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: String(name).trim(),
        passwordHash,
        role: Role.ADMIN,
        isEmailVerified: true,
        title: 'Platform Administrator',
        location: 'Global Center'
      }
    });

    res.status(201).json({
      message: 'Admin account created successfully. You can now log in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: err.message || 'Admin registration failed.' });
  }
});

/* ---------------- UNIFIED LOGIN ---------------- */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, expectedRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { company: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role check if specific role was requested (case-insensitive)
    if (expectedRole && user.role.toUpperCase() !== String(expectedRole).toUpperCase()) {
      return res.status(403).json({
        error: `This account is registered as a ${user.role.toLowerCase()}, not ${String(expectedRole).toLowerCase()}. Please switch to the ${user.role.toLowerCase()} tab.`,
        code: 'ROLE_MISMATCH',
        actualRole: user.role
      });
    }

    // Recruiter approval guard
    if (user.role === Role.RECRUITER) {
      if (!user.company || user.company.verificationStatus === CompanyVerificationStatus.PENDING) {
        return res.status(403).json({
          error:
            'Your company profile is currently pending verification by our platform administrator. Please wait for approval.',
          code: 'COMPANY_PENDING',
          companyStatus: user.company?.verificationStatus || 'PENDING'
        });
      }
      if (user.company.verificationStatus === CompanyVerificationStatus.REJECTED) {
        return res.status(403).json({
          error: `Your company verification was rejected. Reason: ${user.company.rejectionReason || 'Eligibility criteria not met.'}`,
          code: 'COMPANY_REJECTED',
          rejectionReason: user.company.rejectionReason
        });
      }
      if (user.company.verificationStatus === CompanyVerificationStatus.SUSPENDED) {
        return res.status(403).json({
          error: 'Your company account has been temporarily suspended. Contact support.',
          code: 'COMPANY_SUSPENDED'
        });
      }
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        title: user.title,
        location: user.location,
        company: user.company
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

/* ---------------- FORGOT / RESET PASSWORD ---------------- */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    console.log(`[AUTH] Password reset requested for ${cleanEmail} (found: ${Boolean(user)})`);
    res.json({
      message: 'If an account exists with this email, password reset instructions have been dispatched.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process password reset.' });
  }
});

/* ---------------- RESEND VERIFICATION EMAIL ---------------- */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    console.log(`[AUTH] Resend verification for ${cleanEmail} (found: ${Boolean(user)})`);
    res.json({
      message: 'If an account exists with this email, verification instructions have been resent.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to resend verification.' });
  }
});

/* ---------------- GOOGLE SIGN-IN ---------------- */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, role: requestedRole = 'CANDIDATE' } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    let googlePayload: { email: string; name: string; sub: string; picture?: string };

    // If GOOGLE_CLIENT_ID is configured, verify with Google
    if (googleClient && GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'Invalid Google authentication token.' });
      }
      googlePayload = {
        email: payload.email,
        name: payload.name || 'Google User',
        sub: payload.sub,
        picture: payload.picture
      };
    } else {
      // Decode JWT payload directly (for dev testing without Google Client ID)
      try {
        const decoded = jwt.decode(credential) as any;
        if (decoded && decoded.email) {
          googlePayload = {
            email: decoded.email,
            name: decoded.name || 'Google User',
            sub: decoded.sub || 'google-' + Date.now(),
            picture: decoded.picture
          };
        } else {
          googlePayload = {
            email: 'google.candidate@example.com',
            name: 'Google Candidate',
            sub: 'google-dev-12345'
          };
        }
      } catch {
        googlePayload = {
          email: 'google.candidate@example.com',
          name: 'Google Candidate',
          sub: 'google-dev-12345'
        };
      }
    }

    const cleanEmail = googlePayload.email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { company: true }
    });

    if (!user) {
      const roleToAssign = requestedRole === 'RECRUITER' ? Role.RECRUITER : Role.CANDIDATE;
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: googlePayload.name,
          googleId: googlePayload.sub,
          avatar: googlePayload.picture,
          role: roleToAssign,
          isEmailVerified: true
        },
        include: { company: true }
      });
    }

    // Recruiter approval guard
    if (user.role === Role.RECRUITER && user.company) {
      const status = user.company.verificationStatus;
      if (status === CompanyVerificationStatus.PENDING) {
        return res.status(403).json({
          error: 'Your company verification is pending review by our platform administrator.',
          code: 'COMPANY_PENDING'
        });
      }
      if (status === CompanyVerificationStatus.REJECTED) {
        return res.status(403).json({
          error: `Company verification rejected: ${user.company.rejectionReason || 'Criteria not met.'}`,
          code: 'COMPANY_REJECTED'
        });
      }
    }

    const token = generateToken(user);
    res.json({
      message: 'Google Sign-In successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        company: user.company
      }
    });
  } catch (err: any) {
    console.error('Google Sign-In error:', err);
    res.status(500).json({ error: err.message || 'Google authentication failed.' });
  }
});

/* ---------------- GET CURRENT AUTHENTICATED USER ---------------- */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      title: user.title,
      bio: user.bio,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      portfolioUrl: user.portfolioUrl,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      company: user.company
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
  }
});

/* ---------------- UPDATE PROFILE ---------------- */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      location,
      title,
      bio,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      skills,
      experience,
      education,
      avatar
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(title !== undefined && { title }),
        ...(bio !== undefined && { bio }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(portfolioUrl !== undefined && { portfolioUrl }),
        ...(skills && { skills: Array.isArray(skills) ? skills : [] }),
        ...(experience !== undefined && { experience }),
        ...(education !== undefined && { education }),
        ...(avatar !== undefined && { avatar })
      },
      include: { company: true }
    });

    res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile.' });
  }
});

/* ---------------- UPLOAD AVATAR ---------------- */
router.post('/avatar', requireAuth, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: avatarUrl },
      include: { company: true }
    });

    res.json({ message: 'Avatar updated successfully.', avatar: avatarUrl, user: updated });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload avatar.' });
  }
});

export default router;
