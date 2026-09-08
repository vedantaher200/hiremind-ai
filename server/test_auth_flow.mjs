// End-to-end verification script for HireMind AI authentication & authorization
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING HIREMIND AI AUTHENTICATION VERIFICATION ---\n');
  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} ->`, err.message);
    }
  }

  const testCandidateEmail = `cand_test_${Date.now()}@example.com`;
  const testRecruiterEmail = `rec_test_${Date.now()}@example.com`;

  // 1. Candidate Registration
  await assertTest('Candidate registration succeeds and returns token & user', async () => {
    const res = await fetch(`${BASE_URL}/auth/register-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Candidate',
        email: testCandidateEmail,
        password: 'Password@123'
      })
    });
    const data = await res.json();
    if (res.status !== 201 || !data.token || data.user.role !== 'CANDIDATE') {
      throw new Error(`Expected 201 with token, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 2. Duplicate candidate registration
  await assertTest('Duplicate registration returns 400 error', async () => {
    const res = await fetch(`${BASE_URL}/auth/register-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Candidate 2',
        email: testCandidateEmail,
        password: 'Password@123'
      })
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
  });

  // 3. Candidate Login with lowercase expectedRole
  await assertTest('Candidate login succeeds with lowercase expectedRole', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: 'Password@123',
        expectedRole: 'candidate'
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 4. Role mismatch check (Candidate attempting to login under recruiter role)
  await assertTest('Candidate attempting login under recruiter role gets 403 ROLE_MISMATCH', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: 'Password@123',
        expectedRole: 'recruiter'
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.code !== 'ROLE_MISMATCH') {
      throw new Error(`Expected 403 ROLE_MISMATCH, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 5. Invalid password
  await assertTest('Invalid password returns 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCandidateEmail,
        password: 'WrongPassword123'
      })
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // 6. Recruiter Registration
  let newCompanyId = '';
  await assertTest('Recruiter registration creates pending company without login token', async () => {
    const res = await fetch(`${BASE_URL}/auth/register-recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Recruiter',
        email: testRecruiterEmail,
        password: 'Recruiter@123',
        companyName: 'Apex Innovations',
        companyWebsite: 'https://apex.example.com'
      })
    });
    const data = await res.json();
    if (res.status !== 201 || data.status !== 'PENDING_APPROVAL' || !data.companyId) {
      throw new Error(`Expected 201 PENDING_APPROVAL, got ${res.status}: ${JSON.stringify(data)}`);
    }
    newCompanyId = data.companyId;
  });

  // 7. Unapproved recruiter login blocked
  await assertTest('Unapproved recruiter login is blocked with 403 COMPANY_PENDING', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testRecruiterEmail,
        password: 'Recruiter@123',
        expectedRole: 'recruiter'
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.code !== 'COMPANY_PENDING') {
      throw new Error(`Expected 403 COMPANY_PENDING, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 8. Admin Login
  let adminToken = '';
  await assertTest('Admin login succeeds with admin credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hiremind.ai',
        password: 'AdminPassword123!',
        expectedRole: 'admin'
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.token || data.user.role !== 'ADMIN') {
      throw new Error(`Expected 200 ADMIN, got ${res.status}: ${JSON.stringify(data)}`);
    }
    adminToken = data.token;
  });

  // 9. Admin Approves Recruiter Company
  await assertTest('Admin approves pending recruiter company', async () => {
    const res = await fetch(`${BASE_URL}/admin/companies/${newCompanyId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    if (res.status !== 200 || data.company?.verificationStatus !== 'APPROVED') {
      throw new Error(`Expected 200 APPROVED, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 10. Approved recruiter can now log in
  await assertTest('Approved recruiter can now successfully log in and receive token', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testRecruiterEmail,
        password: 'Recruiter@123',
        expectedRole: 'recruiter'
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.token || data.user.role !== 'RECRUITER') {
      throw new Error(`Expected 200 RECRUITER, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 11. Admin registration with invalid setup key
  await assertTest('Admin registration with invalid setup key returns 403 Invalid admin setup key.', async () => {
    const res = await fetch(`${BASE_URL}/auth/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `hacker_${Date.now()}@example.com`,
        password: 'AdminPassword123!',
        setupKey: 'wrong-key-attempt'
      })
    });
    const data = await res.json();
    if (res.status !== 403 || data.error !== 'Invalid admin setup key.') {
      throw new Error(`Expected 403 Invalid admin setup key., got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 12. Admin registration with valid ADMIN_SETUP_KEY
  const newAdminEmail = `provisioned_admin_${Date.now()}@hiremind.ai`;
  await assertTest('Admin registration with valid setup key succeeds with 201', async () => {
    const validKey = process.env.ADMIN_SETUP_KEY || 'HMAdmin-2026-Setup';
    const res = await fetch(`${BASE_URL}/auth/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Authorized Executive Admin',
        email: newAdminEmail,
        password: 'ExecutivePassword123!',
        setupKey: validKey
      })
    });
    const data = await res.json();
    if (res.status !== 201 || data.message !== 'Admin account created successfully. You can now log in.' || data.user.role !== 'ADMIN') {
      throw new Error(`Expected 201 with created message, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 13. Login with newly provisioned admin
  await assertTest('Newly provisioned admin can successfully log in', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newAdminEmail,
        password: 'ExecutivePassword123!',
        expectedRole: 'admin'
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.token || data.user.role !== 'ADMIN') {
      throw new Error(`Expected 200 with ADMIN role, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  console.log(`\n--- RESULTS: ${passed}/${total} TESTS PASSED ---`);
}

runTests();
