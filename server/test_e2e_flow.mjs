// Comprehensive E2E Verification for HireMind AI Admin & Role Auth Flows
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function run() {
  console.log('--- RUNNING HIREMIND AI E2E VERIFICATION ---');

  const timestamp = Date.now();
  const testAdminEmail = `admin_e2e_${timestamp}@hiremind.ai`;
  const testAdminPass = 'SuperAdminSecret123!';
  const setupKey = 'HMAdmin-2026-Setup';

  // 1. Invalid Admin Provisioning (Wrong key)
  console.log('\n[1] Testing Admin Provisioning with INVALID key...');
  const badRes = await fetch(`${API_BASE}/auth/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Fake Admin',
      email: `fake_${timestamp}@hiremind.ai`,
      password: testAdminPass,
      adminSetupKey: 'Wrong-Key-999'
    })
  });
  const badData = await badRes.json();
  if (badRes.status === 403 && badData.error === 'Invalid admin setup key.') {
    console.log('✅ Correctly rejected invalid admin setup key (403)');
  } else {
    throw new Error(`Expected 403 Invalid admin setup key, got ${badRes.status}: ${JSON.stringify(badData)}`);
  }

  // 2. Valid Admin Provisioning
  console.log('\n[2] Testing Admin Provisioning with VALID key (HMAdmin-2026-Setup)...');
  const setupRes = await fetch(`${API_BASE}/auth/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Platform Admin',
      email: testAdminEmail,
      password: testAdminPass,
      adminSetupKey: setupKey
    })
  });
  const setupData = await setupRes.json();
  if (setupRes.status === 201 && setupData.user && setupData.user.role === 'ADMIN') {
    console.log('✅ Admin provisioned successfully (201):', setupData.user.email, 'Role:', setupData.user.role);
  } else {
    throw new Error(`Admin provisioning failed: ${setupRes.status} ${JSON.stringify(setupData)}`);
  }

  // 3. Admin Login with normal credentials (no setup key required)
  console.log('\n[3] Testing Admin Login (Email + Password only)...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testAdminEmail,
      password: testAdminPass,
      expectedRole: 'admin'
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status === 200 && loginData.token && loginData.user.role === 'ADMIN') {
    console.log('✅ Admin login succeeded, received JWT token and role:', loginData.user.role);
  } else {
    throw new Error(`Admin login failed: ${loginRes.status} ${JSON.stringify(loginData)}`);
  }

  const adminToken = loginData.token;

  // 4. Admin Session Restoration (/api/auth/me)
  console.log('\n[4] Testing Admin Session Restoration via /me with Bearer token...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const meData = await meRes.json();
  if (meRes.status === 200 && meData.role === 'ADMIN' && meData.email === testAdminEmail) {
    console.log('✅ Session restoration verified: Profile loaded with authoritative role =', meData.role);
  } else {
    throw new Error(`Session restoration failed: ${meRes.status} ${JSON.stringify(meData)}`);
  }

  // 5. Admin updating profile
  console.log('\n[5] Testing Admin Profile Update...');
  const updateRes = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'E2E Platform Admin Updated',
      title: 'Chief System Architect',
      location: 'Bangalore, India',
      bio: 'Leading HireMind AI platform governance.'
    })
  });
  const updateData = await updateRes.json();
  if (updateRes.status === 200 && updateData.user.title === 'Chief System Architect') {
    console.log('✅ Admin profile updated and persisted:', updateData.user.title);
  } else {
    throw new Error(`Admin profile update failed: ${updateRes.status} ${JSON.stringify(updateData)}`);
  }

  // 6. Cross-role Login Block: Candidate attempting to log in as Admin
  console.log('\n[6] Testing Candidate attempting to log in via Admin tab...');
  const candEmail = `cand_e2e_${timestamp}@hiremind.ai`;
  await fetch(`${API_BASE}/auth/register-candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Candidate',
      email: candEmail,
      password: 'CandPassword123!'
    })
  });

  const crossRoleRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: candEmail,
      password: 'CandPassword123!',
      expectedRole: 'admin' // Attempting to enter Admin portal
    })
  });
  const crossRoleData = await crossRoleRes.json();
  if (crossRoleRes.status === 403 && crossRoleData.code === 'ROLE_MISMATCH') {
    console.log('✅ Correctly blocked Candidate from logging in as Admin (403 ROLE_MISMATCH)');
  } else {
    throw new Error(`Expected ROLE_MISMATCH 403, got ${crossRoleRes.status}: ${JSON.stringify(crossRoleData)}`);
  }

  // 7. Recruiter Registration & Admin Verification Flow
  console.log('\n[7] Testing Recruiter Registration & Admin Company Approval...');
  const recEmail = `rec_e2e_${timestamp}@techcorp.com`;
  const recRegRes = await fetch(`${API_BASE}/auth/register-recruiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'TechCorp Recruiter',
      email: recEmail,
      password: 'RecPassword123!',
      companyName: `TechCorp_${timestamp}`,
      website: 'https://techcorp.example.com'
    })
  });
  const recRegData = await recRegRes.json();
  if (recRegRes.status === 201 && String(recRegData.status).toUpperCase() === 'PENDING_APPROVAL') {
    console.log('✅ Recruiter registered with PENDING status (no token issued)');
  } else {
    throw new Error(`Recruiter reg failed: ${recRegRes.status} ${JSON.stringify(recRegData)}`);
  }

  // Attempt login before approval
  const unapprovedLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: recEmail,
      password: 'RecPassword123!',
      expectedRole: 'recruiter'
    })
  });
  const unapprovedData = await unapprovedLogin.json();
  if (unapprovedLogin.status === 403 && unapprovedData.code === 'COMPANY_PENDING') {
    console.log('✅ Unapproved recruiter login blocked (403 COMPANY_PENDING)');
  } else {
    throw new Error(`Expected COMPANY_PENDING, got ${unapprovedLogin.status}: ${JSON.stringify(unapprovedData)}`);
  }

  // Admin approves recruiter's company
  const companyId = recRegData.companyId;
  const approveRes = await fetch(`${API_BASE}/admin/companies/${companyId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    }
  });
  if (approveRes.status === 200) {
    console.log('✅ Admin successfully approved company:', companyId);
  } else {
    throw new Error(`Admin approval failed: ${approveRes.status}`);
  }

  // Recruiter can now log in
  const approvedLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: recEmail,
      password: 'RecPassword123!',
      expectedRole: 'recruiter'
    })
  });
  const approvedData = await approvedLogin.json();
  if (approvedLogin.status === 200 && approvedData.user.role === 'RECRUITER') {
    console.log('✅ Approved recruiter successfully logged in with role:', approvedData.user.role);
  } else {
    throw new Error(`Approved recruiter login failed: ${approvedLogin.status}`);
  }

  console.log('\n===========================================');
  console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED!');
  console.log('===========================================');
}

run().catch((err) => {
  console.error('❌ Verification check failed:', err);
  process.exit(1);
});
