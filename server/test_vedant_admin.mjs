import fetch from 'node-fetch';

const API_BASE = process.env.ADMIN_TEST_BASE_URL || 'http://localhost:5000/api';
const email = process.env.ADMIN_TEST_EMAIL;
const password = process.env.ADMIN_TEST_PASSWORD;

if (!email || !password) {
  throw new Error('Set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD for an authorized non-production admin account.');
}

async function testAdminSession() {
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, expectedRole: 'admin' })
  });
  const loginData = await loginResponse.json().catch(() => ({}));
  if (loginResponse.status !== 200 || !loginData.token || loginData.user?.role !== 'ADMIN') {
    throw new Error(`Admin login check failed with HTTP ${loginResponse.status}.`);
  }

  const sessionResponse = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const sessionData = await sessionResponse.json().catch(() => ({}));
  if (sessionResponse.status !== 200 || sessionData.role !== 'ADMIN') {
    throw new Error(`Admin session check failed with HTTP ${sessionResponse.status}.`);
  }

  console.log('PASS authorized admin login and session restoration.');
}

testAdminSession().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Admin session check failed.');
  process.exitCode = 1;
});
