import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

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
      // allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file serving for uploads (resumes, documents, avatars)
const uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? path.join('/tmp', 'uploads') : './uploads');
try {
  app.use('/uploads', express.static(path.resolve(uploadDir)));
} catch (e) {
  // Graceful fallback in read-only environment
}

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
