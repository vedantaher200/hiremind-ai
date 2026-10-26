import multer from 'multer';
import path from 'path';
import fs from 'fs';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = process.env.UPLOAD_DIR || (isServerless ? path.join('/tmp', 'uploads') : './uploads');

// Ensure upload subdirectories exist
const resumeDir = path.join(uploadDir, 'resumes');
const documentDir = path.join(uploadDir, 'documents');
const avatarDir = path.join(uploadDir, 'avatars');

const ensureDir = (dir: string) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // In serverless environments, log but don't crash module initialization
    console.warn(`[UPLOAD] Notice: Directory could not be created during startup: ${dir}`, err);
  }
};

[uploadDir, resumeDir, documentDir, avatarDir].forEach(ensureDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir = avatarDir;
    if (file.fieldname === 'resume') {
      targetDir = resumeDir;
    } else if (file.fieldname === 'document' || file.fieldname === 'verificationDocuments') {
      targetDir = documentDir;
    }
    ensureDir(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Unsupported file type. Resume parsing supports PDF and plain text; profile images support PNG, JPG, or WebP.') as Error & { status?: number };
    error.status = 415;
    cb(error);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB maximum
  }
});
