import assert from 'node:assert/strict';
import { scoreResumeText } from './src/services/resumeScoring.js';

const complete = scoreResumeText(`
Skills
Python, TypeScript, PostgreSQL, Docker
Experience
Software Engineer, Example Co, 2021 - 2024
Improved throughput by 35% and served 20,000 users.
Education
Bachelor of Science in Computer Science
`);
assert.equal(complete.scoringVersion, 'deterministic-v1');
assert.equal(complete.extractedSkills.includes('Python'), true);
assert.equal(complete.skillEvidence.some(item => item.skill === 'Python' && item.excerpt.includes('Python')), true);
assert.equal(complete.skillMatch, 50);
assert.equal(complete.experienceMatch, 100);
assert.equal(complete.educationMatch, 100);
assert.equal(complete.atsScore, 75);

const sparse = scoreResumeText('A short profile mentioning Python and a developer title.');
assert.equal(sparse.extractedSkills.includes('Python'), true);
assert.equal(sparse.extractedSkills.includes('JavaScript'), false);
assert.equal(sparse.atsScore, 6);
assert.equal(sparse.experienceSummary, 'No experience section was detected in parsed resume text.');
assert.equal(sparse.missingSkills.length, 0, 'No job criteria means no fabricated missing skills.');
assert.throws(() => scoreResumeText('unreadable'), /too short/);
console.log('PASS deterministic resume scoring synthetic checks (3 cases)');
