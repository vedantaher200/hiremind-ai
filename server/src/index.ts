import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import companyRoutes from './routes/companies.js';
import jobRoutes from './routes/jobs.js';
import internshipRoutes from './routes/internships.js';
import applicationRoutes from './routes/applications.js';
import resumeRoutes from './routes/resumes.js';
import assessmentRoutes from './routes/assessments.js';
import interviewRoutes from './routes/interviews.js';
import notificationRoutes from './routes/notifications.js';
import feedbackRoutes from './routes/feedback.js';
import aiRecruitmentRoutes from './routes/ai-recruitment.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'https://hiremind-ai-pearl.vercel.app',
  process.env.CLIENT_URL || ''
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients and same-origin requests. In production,
      // browser clients must use an explicitly configured origin.
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Origin is not allowed by CORS.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Profile avatars are intentionally visible within the product. Keep resumes
// and verification documents out of static hosting; they use authorized routes.
const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join('/tmp', 'uploads') : './uploads');
app.use('/uploads/avatars', express.static(path.resolve(uploadDir, 'avatars')));

// Router with all API endpoints
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', async (req, res) => {
  let dbStatus = 'unverified';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (dbErr: any) {
    dbStatus = 'disconnected';
    console.warn('[HEALTH] Database check notice:', dbErr?.message || dbErr);
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HireMind AI Backend API',
    database: dbStatus,
    runtime: process.env.VERCEL ? 'vercel-serverless' : 'standalone'
  });
});

// Mount Routes on router
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/companies', companyRoutes);
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/internships', internshipRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/resumes', resumeRoutes);
apiRouter.use('/assessments', assessmentRoutes);
apiRouter.use('/interviews', interviewRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/feedback', feedbackRoutes);
apiRouter.use('/ai', aiRecruitmentRoutes);

// Dual mount under both /api and root / for seamless Vercel serverless + standalone support
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API ERROR]', err);
  const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  const safeMessage = statusCode === 500 
    ? (process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred. Please try again.')
    : (err.message || 'Request failed.');
  res.status(statusCode).json({
    error: safeMessage
  });
});

// Start listener only when not running inside Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` HireMind AI Backend API running on :${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`========================================`);
  });
}

export default app;
