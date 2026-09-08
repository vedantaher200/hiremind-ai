import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function verifyAllAdminModules() {
  console.log('--- VERIFYING ALL ADMIN MODULES & ENDPOINTS ---');

  // 1. Admin Login
  console.log('\n[1] Admin Login...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'vedantaher2003@gmail.com',
      password: 'VedantAdminPassword2026!',
      expectedRole: 'admin'
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.token) {
    throw new Error(`Admin login failed: ${loginRes.status} ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log('✅ Admin login succeeded. Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Candidates Directory
  console.log('\n[2] Testing /api/admin/candidates...');
  const candRes = await fetch(`${API_BASE}/admin/candidates`, { headers });
  const candData = await candRes.json();
  if (candRes.status !== 200 || !Array.isArray(candData)) {
    throw new Error(`Candidates fetch failed: ${candRes.status}`);
  }
  console.log(`✅ Loaded ${candData.length} candidates from database.`);

  // 3. Platform Jobs
  console.log('\n[3] Testing /api/admin/jobs...');
  const jobsRes = await fetch(`${API_BASE}/admin/jobs`, { headers });
  const jobsData = await jobsRes.json();
  if (jobsRes.status !== 200 || !Array.isArray(jobsData)) {
    throw new Error(`Jobs fetch failed: ${jobsRes.status}`);
  }
  console.log(`✅ Loaded ${jobsData.length} platform jobs with company & recruiter details.`);

  // Moderation test on first job if exists
  if (jobsData.length > 0) {
    const testJob = jobsData[0];
    const newStatus = testJob.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    const updateJobRes = await fetch(`${API_BASE}/admin/jobs/${testJob.id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: newStatus })
    });
    if (updateJobRes.status === 200) {
      console.log(`✅ Moderated job "${testJob.title}" status to ${newStatus}.`);
      // Restore
      await fetch(`${API_BASE}/admin/jobs/${testJob.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: testJob.status })
      });
    }
  }

  // 4. Platform Internships
  console.log('\n[4] Testing /api/admin/internships...');
  const internRes = await fetch(`${API_BASE}/admin/internships`, { headers });
  const internData = await internRes.json();
  if (internRes.status !== 200 || !Array.isArray(internData)) {
    throw new Error(`Internships fetch failed: ${internRes.status}`);
  }
  console.log(`✅ Loaded ${internData.length} platform internships.`);

  // 5. Platform Analytics
  console.log('\n[5] Testing /api/admin/analytics...');
  const analyticsRes = await fetch(`${API_BASE}/admin/analytics`, { headers });
  const analyticsData = await analyticsRes.json();
  if (analyticsRes.status !== 200 || !analyticsData.kpis) {
    throw new Error(`Analytics fetch failed: ${analyticsRes.status}`);
  }
  console.log('✅ Aggregated Analytics loaded:');
  console.log('   Total Candidates:', analyticsData.kpis.totalCandidates);
  console.log('   Total Recruiters:', analyticsData.kpis.totalRecruiters);
  console.log('   Total Postings:', analyticsData.postingsDistribution?.totalPostings);
  console.log('   Total Applications:', analyticsData.kpis.totalApplications);

  // 6. Recruiter Companies for Verification
  console.log('\n[6] Testing /api/admin/companies...');
  const compRes = await fetch(`${API_BASE}/admin/companies`, { headers });
  const compData = await compRes.json();
  if (compRes.status !== 200 || !Array.isArray(compData)) {
    throw new Error(`Companies fetch failed: ${compRes.status}`);
  }
  console.log(`✅ Loaded ${compData.length} recruiter companies for verification.`);

  // 7. Admin Profile (/api/auth/me)
  console.log('\n[7] Testing Admin Profile Persistence (/api/auth/me)...');
  const meRes = await fetch(`${API_BASE}/auth/me`, { headers });
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.role !== 'ADMIN') {
    throw new Error(`Admin profile fetch failed: ${meRes.status}`);
  }
  console.log(`✅ Admin profile verified: ${meData.name} (${meData.email}), Role: ${meData.role}`);

  console.log('\n======================================================');
  console.log('🎉 ALL ADMIN MODULE BACKEND ENDPOINTS ARE FULLY OPERATIONAL!');
  console.log('======================================================');
}

verifyAllAdminModules().catch((err) => {
  console.error('❌ Admin verification failed:', err);
  process.exit(1);
});
