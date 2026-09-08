import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testVedantAdminFlow() {
  console.log('--- TESTING VEDANT ADMIN PROVISIONING & LOGIN FLOW ---');

  const name = 'Vedant Ramdas Aher';
  const email = 'vedantaher2003@gmail.com';
  const password = 'VedantAdminPassword2026!';
  const setupKey = 'HMAdmin-2026-Setup';

  // 1. Provision Admin Account
  console.log('\n[1] Submitting Admin Provisioning for:', email);
  const provRes = await fetch(`${API_BASE}/auth/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password,
      adminSetupKey: setupKey
    })
  });

  const provData = await provRes.json();
  console.log('Provisioning HTTP Status:', provRes.status);
  console.log('Provisioning Response:', provData);

  if (provRes.status !== 201) {
    throw new Error(`Provisioning failed with status ${provRes.status}: ${JSON.stringify(provData)}`);
  }

  if (provData.user?.role !== 'ADMIN') {
    throw new Error(`Expected role ADMIN, got: ${provData.user?.role}`);
  }
  console.log('✅ Admin account provisioned with role = ADMIN');

  // 2. Normal Admin Login (Email + Password only)
  console.log('\n[2] Logging in as Admin with Email + Password only...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      expectedRole: 'admin'
    })
  });

  const loginData = await loginRes.json();
  console.log('Login HTTP Status:', loginRes.status);
  console.log('Login Response User Role:', loginData.user?.role);

  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
  }

  if (loginData.user?.role !== 'ADMIN') {
    throw new Error(`Expected logged-in role ADMIN, got: ${loginData.user?.role}`);
  }
  console.log('✅ Admin login succeeded, token issued.');

  // 3. Verify Session Restoration (/me)
  console.log('\n[3] Verifying session restoration via /api/auth/me...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  const meData = await meRes.json();
  console.log('Me endpoint Role:', meData.role);
  if (meData.role !== 'ADMIN') {
    throw new Error(`Session role mismatch: ${meData.role}`);
  }
  console.log('✅ Session profile verified with authoritative role = ADMIN.');

  console.log('\n🎉 ALL VEDANT ADMIN CHECKS PASSED!');
}

testVedantAdminFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
