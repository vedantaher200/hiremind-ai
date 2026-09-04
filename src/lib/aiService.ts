import { ResumeAnalysis, AIHiringRecommendation } from '../types';
import { supabase } from './supabase';

type ResumePayload = Pick<ResumeAnalysis, 'atsCompatibilityScore' | 'extractedSkills' | 'strengths' | 'missingSkills' | 'experienceSummary' | 'educationSummary' | 'improvementSuggestions'>;

const aiRequest = async <T,>(action: string, payload: Record<string, unknown>): Promise<T> => {
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
  const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, ...payload }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'AI service is unavailable.');
  return body as T;
};

const ruleBasedAnalysis = (resumeText: string, requiredSkills: string[]): ResumePayload => {
  const knownSkills = ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Go', 'Java', 'C++', 'React', 'Next.js', 'FastAPI', 'Node.js', 'Express', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Git'];
  const detected = knownSkills.filter(skill => resumeText.toLowerCase().includes(skill.toLowerCase()));
  const matches = detected.filter(skill => requiredSkills.some(required => required.toLowerCase() === skill.toLowerCase()));
  const missing = requiredSkills.filter(skill => !detected.some(found => found.toLowerCase() === skill.toLowerCase()));
  return { atsCompatibilityScore: requiredSkills.length ? Math.round((matches.length / requiredSkills.length) * 100) : 0, extractedSkills: detected, strengths: matches.length ? [`Matches role requirements: ${matches.join(', ')}`] : ['Resume text was parsed successfully.'], missingSkills: missing, experienceSummary: 'Review the source resume for role tenure and impact details.', educationSummary: 'Review the source resume for education details.', improvementSuggestions: missing.length ? [`Add evidence of: ${missing.join(', ')}`] : ['Tailor accomplishments to the selected role.'] };
};

export async function analyzeResumeContent(resumeText: string, fileName: string, targetJobRole: string, requiredSkills: string[] = [], candidateId: string): Promise<ResumeAnalysis> {
  if (resumeText.trim().length < 50) throw new Error('The uploaded file does not contain enough readable text to analyze.');
  let result: ResumePayload;
  let source: 'rules' | 'ai' = 'rules';
  try { result = await aiRequest<ResumePayload>('analyze-resume', { resumeText: resumeText.slice(0, 12000), targetJobRole, requiredSkills }); source = 'ai'; }
  catch (error) { console.warn('Using rule-based resume analysis:', error); result = ruleBasedAnalysis(resumeText, requiredSkills); }
  return { id: `res-${Date.now()}`, candidateId, fileName: fileName || 'Uploaded_Resume', uploadedAt: new Date().toISOString(), fileSize: 'Unknown', targetRole: targetJobRole, rawText: resumeText, source, ...result };
}

export function analyzeInterviewResponse(_questionText: string, answerText: string, _durationSeconds: number) {
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
  const score = wordCount >= 60 ? 90 : wordCount >= 30 ? 80 : wordCount >= 12 ? 70 : 55;
  return { clarity: score >= 85 ? 'Excellent' as const : score >= 75 ? 'Good' as const : score >= 65 ? 'Fair' as const : 'Needs Work' as const, tone: score >= 85 ? 'Confident' as const : score >= 70 ? 'Professional' as const : 'Hesitant' as const, score, aiFeedback: wordCount >= 30 ? 'Your answer has useful detail. Add a concrete outcome or metric to make it stronger.' : 'Expand your response with context, actions, and measurable outcomes.' };
}

export function generateCandidateRecommendation(name: string, role: string, atsScore: number, interviewScore: number, codingScore: number, communicationScore: number): AIHiringRecommendation {
  const avg = Math.round((atsScore + interviewScore + codingScore + communicationScore) / 4);
  const recommendationLevel = avg >= 88 ? 'Strongly Recommended' : avg >= 78 ? 'Recommended' : avg >= 65 ? 'Conditional' : 'Not Recommended';
  return { recommendationLevel, overallMatchPercentage: avg, executiveSummary: `${name}'s available resume, interview, coding, and communication signals were evaluated for the ${role} role.`, pros: ['Scores are calculated from completed candidate activity'], cons: ['Review the original resume and interview responses before making a decision'], cultureFitNotes: 'Requires a recruiter-led conversation for a reliable culture-fit assessment.', suggestedNextSteps: avg >= 78 ? 'Schedule a recruiter review.' : 'Review gaps and consider a follow-up assessment.' };
}
