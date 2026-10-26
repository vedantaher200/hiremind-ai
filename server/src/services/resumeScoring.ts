const SKILL_CATALOG = [
  'TypeScript', 'JavaScript', 'Node.js', 'React', 'Next.js', 'Vue.js', 'Angular',
  'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'SQL',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker',
  'Kubernetes', 'Terraform', 'Git', 'Linux', 'HTML', 'CSS', 'Tailwind CSS',
  'FastAPI', 'Django', 'Flask', 'Spring Boot', 'Express', 'GraphQL', 'REST API',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'scikit-learn',
  'Figma', 'Jest', 'Playwright', 'Cypress'
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasTerm = (text: string, term: string) => new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(term)}($|[^a-z0-9+#.])`, term === 'Go' ? '' : 'i').test(text);

function sectionExcerpt(text: string, heading: RegExp): string {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const start = lines.findIndex(line => heading.test(line));
  if (start < 0) return '';
  const sectionLines: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^(education|experience|employment|work history|skills|projects|certifications|summary|objective|references)\s*:??$/i.test(line)) break;
    sectionLines.push(line);
    if (sectionLines.join(' ').length >= 500) break;
  }
  return sectionLines.join(' ').slice(0, 500);
}

export interface ResumeScoreResult {
  scoringVersion: 'deterministic-v1';
  atsScore: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  extractedSkills: string[];
  skillEvidence: Array<{ skill: string; excerpt: string }>;
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  experienceSummary: string;
  educationSummary: string;
  recommendation: string;
  improvementSuggestions: string[];
}

/**
 * Resume evidence completeness score (not a job-match score or hiring probability):
 * 50% recognized skill terms (12.5 points each, capped at 8),
 * 30% experience evidence (section 50%, dates 25%, quantified outcome 25%),
 * 20% education evidence (section 50%, degree terms 50%).
 * All inputs are literal text evidence from the uploaded resume.
 */
export function scoreResumeText(input: string): ResumeScoreResult {
  const text = input.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/\s+/g, ' ').trim()).join('\n').trim();
  if (text.length < 30) throw new Error('Resume text is too short to analyze.');

  const extractedSkills = SKILL_CATALOG.filter(skill => hasTerm(text, skill));
  const skillEvidence = extractedSkills.map(skill => {
    const match = new RegExp(escapeRegExp(skill), 'i').exec(text);
    const start = Math.max(0, (match?.index || 0) - 90);
    const end = Math.min(text.length, (match?.index || 0) + skill.length + 90);
    return { skill, excerpt: text.slice(start, end).trim() };
  });
  const experience = sectionExcerpt(text, /^(professional )?(experience|employment|work history)(\s*:.*)?$/i);
  const education = sectionExcerpt(text, /^(education|academic background)(\s*:.*)?$/i);
  const dateSeparator = '[-\\u2012-\\u2015]';
  const hasDateRange = new RegExp(`\\b(?:19|20)\\d{2}\\s*${dateSeparator}\\s*(?:(?:19|20)\\d{2}|present|current)\\b`, 'i').test(text)
    || new RegExp(`\\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s+(?:19|20)\\d{2}\\s*${dateSeparator}`, 'i').test(text);
  const hasQuantifiedOutcome = /\b\d+(?:\.\d+)?\s*(?:%|percent|users|customers|requests|transactions|hours|days|weeks|months|x)\b/i.test(text);
  const degreeEvidence = /\b(?:bachelor'?s?|master'?s?|ph\.?d\.?|doctorate|associate'?s?|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|b\.?tech|m\.?tech|diploma)\b/i.test(text);

  const skillMatch = Math.min(100, extractedSkills.length * 12.5);
  const experienceMatch = (experience ? 50 : 0) + (hasDateRange ? 25 : 0) + (hasQuantifiedOutcome ? 25 : 0);
  const educationMatch = (education ? 50 : 0) + (degreeEvidence ? 50 : 0);
  const atsScore = Math.round(skillMatch * 0.5 + experienceMatch * 0.3 + educationMatch * 0.2);

  const strengths: string[] = [];
  if (extractedSkills.length) strengths.push(`${extractedSkills.length} recognized skill terms were found in the resume text.`);
  if (experience) strengths.push('An experience section was found in the resume text.');
  if (hasDateRange) strengths.push('A work or education date range was found in the resume text.');
  if (hasQuantifiedOutcome) strengths.push('A quantified result or scope value was found in the resume text.');
  if (education) strengths.push('An education section was found in the resume text.');

  const weaknesses: string[] = [];
  const improvementSuggestions: string[] = [];
  if (!extractedSkills.length) { weaknesses.push('No catalogued technical skills were detected in the parsed text.'); improvementSuggestions.push('Check that the resume text includes a readable skills section.'); }
  if (!experience) { weaknesses.push('No experience section was detected in the parsed text.'); improvementSuggestions.push('Use a clearly labeled experience section if the resume includes work or project experience.'); }
  if (!hasDateRange) { weaknesses.push('No date range was detected in the parsed text.'); improvementSuggestions.push('Include dates for roles or education where applicable.'); }
  if (!hasQuantifiedOutcome) { weaknesses.push('No quantified outcomes were detected in the parsed text.'); improvementSuggestions.push('Add measurable outcomes only where they accurately describe the work.'); }
  if (!education) { weaknesses.push('No education section was detected in the parsed text.'); improvementSuggestions.push('Include an education section if relevant to the role.'); }

  return {
    scoringVersion: 'deterministic-v1', atsScore, skillMatch, experienceMatch, educationMatch,
    extractedSkills, skillEvidence, missingSkills: [], strengths, weaknesses,
    experienceSummary: experience || 'No experience section was detected in parsed resume text.',
    educationSummary: education || 'No education section was detected in parsed resume text.',
    recommendation: 'This is a resume evidence completeness score only; it is not a job-match score or hiring recommendation.',
    improvementSuggestions
  };
}
