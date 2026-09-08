import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

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
  process.env.CLIENT_URL || ''
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev mode for smooth testing
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
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Router with all API endpoints
const apiRouter = express.Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HireMind AI Backend API',
    database: 'PostgreSQL'
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
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
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
