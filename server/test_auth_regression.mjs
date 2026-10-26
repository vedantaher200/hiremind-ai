import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('./.env', import.meta.url) });
const prisma = new PrismaClient();
const baseUrl = process.env.AUTH_TEST_BASE_URL || 'http://localhost:5000/api';
const email = `auth-regression-${randomUUID()}@example.invalid`;
const password = `${randomUUID()}A9!`;
let passed = 0;

async function check(label, operation) {
  await operation();
  passed += 1;
  console.log(`PASS ${label}`);
}

async function json(response) {
  return response.json().catch(() => ({}));
}

try {
  let token = '';
  await check('candidate registration persists account and returns session', async () => {
    const response = await fetch(`${baseUrl}/auth/register-candidate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Synthetic Auth Test', email, password })
    });
    const body = await json(response);
    if (response.status !== 201 || !body.token || body.user?.role !== 'CANDIDATE') throw new Error(`unexpected status ${response.status}`);
    token = body.token;
  });

  await check('duplicate registration returns conflict without replacing the account', async () => {
    const response = await fetch(`${baseUrl}/auth/register-candidate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Synthetic Auth Test', email, password })
    });
    if (response.status !== 400) throw new Error(`unexpected status ${response.status}`);
  });

  await check('invalid password is rejected', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: `${password}-wrong`, expectedRole: 'candidate' })
    });
    if (response.status !== 401) throw new Error(`unexpected status ${response.status}`);
  });

  await check('valid login returns persisted JWT session', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, expectedRole: 'candidate' })
    });
    const body = await json(response);
    if (response.status !== 200 || !body.token || body.user?.role !== 'CANDIDATE') throw new Error(`unexpected status ${response.status}`);
    token = body.token;
  });

  await check('role mismatch is rejected by the server', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, expectedRole: 'recruiter' })
    });
    const body = await json(response);
    if (response.status !== 403 || body.code !== 'ROLE_MISMATCH') throw new Error(`unexpected status ${response.status}`);
  });

  await check('JWT restores identity after a fresh request', async () => {
    const response = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await json(response);
    if (response.status !== 200 || body.role !== 'CANDIDATE') throw new Error(`unexpected status ${response.status}`);
  });

  await check('missing token is rejected after client logout', async () => {
    const response = await fetch(`${baseUrl}/auth/me`);
    if (response.status !== 401) throw new Error(`unexpected status ${response.status}`);
  });

  await check('invalid Google credential is rejected or reports missing configuration', async () => {
    const response = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'synthetic-invalid-credential', role: 'candidate' })
    });
    if (![401, 503].includes(response.status)) throw new Error(`unexpected status ${response.status}`);
  });

  console.log(`Authentication API regression checks passed: ${passed}/8`);
} finally {
  await prisma.user.deleteMany({ where: { email } }).catch(() => undefined);
  await prisma.$disconnect();
}
