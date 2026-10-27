import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '.env') });
const prisma = new PrismaClient();
const baseUrl = process.env.AUTH_TEST_BASE_URL || 'http://localhost:5000/api';
const email = `synthetic-resume-${randomUUID()}@example.invalid`;
const password = `${randomUUID()}A9!`;
const resumeText = `Skills\nPython, TypeScript, PostgreSQL, Docker\nExperience\nSoftware Engineer, Example Co, 2021 - 2024\nImproved throughput by 35% and served 20,000 users.\nEducation\nBachelor of Science in Computer Science`;
let token = '';
let userId = '';
let resumeId = '';
let passed = 0;

async function check(label, operation) {
  await operation();
  passed++;
  console.log(`PASS ${label}`);
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

try {
  await check('synthetic candidate registration and login establish persisted identity', async () => {
    let response = await fetch(`${baseUrl}/auth/register-candidate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Synthetic Resume Test', email, password })
    });
    let body = await readJson(response);
    if (response.status !== 201 || !body.token) throw new Error(`registration status ${response.status}`);
    userId = body.user.id;
    response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, expectedRole: 'candidate' })
    });
    body = await readJson(response);
    if (response.status !== 200 || body.user?.id !== userId) throw new Error(`login status ${response.status}`);
    token = body.token;
  });

  await check('internships and authenticated applications endpoints query the migrated schema', async () => {
    const [internships, applications] = await Promise.all([
      fetch(`${baseUrl}/internships`),
      fetch(`${baseUrl}/applications/my-applications`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    if (internships.status !== 200) throw new Error(`internship status ${internships.status}`);
    if (applications.status !== 200) throw new Error(`application status ${applications.status}`);
    const result = await readJson(applications);
    if (!Array.isArray(result)) throw new Error('application response is not a list');
  });

  await check('resume upload extracts and persists supplied synthetic text', async () => {
    const form = new FormData();
    form.append('resume', new Blob([resumeText], { type: 'text/plain' }), 'synthetic-resume.txt');
    const response = await fetch(`${baseUrl}/resumes/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
    });
    const body = await readJson(response);
    if (response.status !== 201 || !body.resumeId) throw new Error(`upload status ${response.status}`);
    resumeId = body.resumeId;
    if (body.extractedText !== resumeText) throw new Error('extracted text differs from synthetic input');
    const fileResponse = await fetch(`${baseUrl}/resumes/${resumeId}/file`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (fileResponse.status !== 200 || await fileResponse.text() !== resumeText) throw new Error('owner could not retrieve the private resume file');
  });

  await check('resume scoring persists deterministic component scores and evidence', async () => {
    const response = await fetch(`${baseUrl}/resumes/analyze`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId })
    });
    const body = await readJson(response);
    if (response.status !== 200 || body.analysis?.scoringVersion !== 'deterministic-v1') throw new Error(`analysis status ${response.status}`);
    if (body.analysis.atsScore !== 75 || !body.analysis.skillEvidence.some(item => item.skill === 'Python')) throw new Error('unexpected score or missing evidence');
  });

  await check('saved resume evidence survives a fresh authorized read', async () => {
    const response = await fetch(`${baseUrl}/resumes/latest`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await readJson(response);
    if (response.status !== 200 || body.resume?.id !== resumeId || body.analysis?.scoringVersion !== 'deterministic-v1') throw new Error(`latest status ${response.status}`);
  });

  await check('analysis does not allow a client to analyze another candidate resume', async () => {
    const outsiderEmail = `synthetic-outsider-${randomUUID()}@example.invalid`;
    const registration = await fetch(`${baseUrl}/auth/register-candidate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Synthetic Outsider', email: outsiderEmail, password })
    });
    const outsider = await readJson(registration);
    if (registration.status !== 201 || !outsider.token) throw new Error(`outsider registration status ${registration.status}`);
    const response = await fetch(`${baseUrl}/resumes/analyze`, {
      method: 'POST', headers: { Authorization: `Bearer ${outsider.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId })
    });
    const fileResponse = await fetch(`${baseUrl}/resumes/${resumeId}/file`, {
      headers: { Authorization: `Bearer ${outsider.token}` }
    });
    await prisma.user.deleteMany({ where: { id: outsider.user.id } });
    if (response.status !== 404) throw new Error(`cross-account analysis status ${response.status}`);
    if (fileResponse.status !== 404) throw new Error(`cross-account resume download status ${fileResponse.status}`);
  });

  await check('unreadable resume analysis is rejected without a successful score', async () => {
    const form = new FormData();
    form.append('resume', new Blob(['too short'], { type: 'text/plain' }), 'unreadable.txt');
    const response = await fetch(`${baseUrl}/resumes/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
    });
    if (response.status !== 422) throw new Error(`invalid resume status ${response.status}`);
  });

  console.log(`Resume analysis API checks passed: ${passed}/7`);
} finally {
  const resumes = userId ? await prisma.resume.findMany({ where: { candidateId: userId }, select: { storagePath: true } }).catch(() => []) : [];
  for (const resume of resumes) {
    const filePath = path.resolve(here, process.env.UPLOAD_DIR || './uploads', 'resumes', path.basename(resume.storagePath));
    if (filePath.startsWith(path.resolve(here, 'uploads') + path.sep)) fs.rmSync(filePath, { force: true });
  }
  if (userId) await prisma.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
  await prisma.$disconnect();
}
