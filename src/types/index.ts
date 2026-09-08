export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;

  avatar?: string;
  phone?: string;
  location?: string;
  title?: string;
  bio?: string;

  // Professional links
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  organizationWebsite?: string;
  company?: Company;

  // Profile insights
  matchScore?: number;
  profileCompletion?: number;
  availabilityStatus?: 'Available' | 'Open to Work' | 'Not Available';
  yearsOfExperience?: number;

  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];

  createdAt: string;
  updatedAt?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
  isCurrent?: boolean;

  location?: string;
  skills?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  year: string;

  grade?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;

  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote' | 'Hybrid';

  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';

  description: string;
  requirements: string[];
  requiredSkills: string[];

  preferredSkills?: string[];
  salaryRange?: string;

  applicantCount: number;

  status: 'Active' | 'Closed' | 'Draft';

  createdAt: string;
  updatedAt?: string;
  recruiterId?: string;
  applicationDeadline?: string;
}

export type ApplicationStatus =
  | 'Sourced'
  | 'Applied'
  | 'Screening'
  | 'Interviewed'
  | 'Technical'
  | 'Offer'
  | 'Rejected'
  | 'Hired';

export interface Application {
  id: string;

  candidateId: string;
  candidateName: string;
  candidateEmail: string;

  candidateAvatar?: string;
  candidateLocation?: string;

  jobId: string;
  jobTitle: string;

  appliedDate: string;
  status: ApplicationStatus;

  scores: CandidateScores;

  resumeUrl?: string;
  notes?: string;

  // AI Hiring Intelligence
  aiRecommendation?: AIHiringRecommendation;
  aiConfidenceScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];

  // Application tracking
  lastUpdatedAt?: string;
  timeline?: ApplicationTimelineItem[];
}

export interface ApplicationTimelineItem {
  id: string;
  status: ApplicationStatus;
  message: string;
  createdAt: string;
  createdBy?: string;
}

export type JobPosting = Job;

export interface CandidateScores {
  atsScore: number;
  interviewScore: number;
  codingScore: number;
  aptitudeScore: number;
  communicationScore: number;
  behavioralScore: number;

  overallScore: number;

  // Optional AI scoring metadata
  confidenceScore?: number;
  lastCalculatedAt?: string;
}

export interface RankingWeights {
  atsWeight: number;
  interviewWeight: number;
  codingWeight: number;
  communicationWeight: number;
  behavioralWeight: number;
}

export interface ResumeAnalysis {
  id: string;
  candidateId: string;

  fileName: string;
  uploadedAt: string;
  fileSize: string;

  atsCompatibilityScore: number;

  extractedSkills: string[];
  strengths: string[];
  missingSkills: string[];

  experienceSummary: string;
  educationSummary: string;

  improvementSuggestions: string[];

  targetRole?: string;
  rawText?: string;
  jobId?: string;

  source?: 'rules' | 'ai';

  // Advanced AI analysis
  keywordMatchPercentage?: number;
  experienceMatchPercentage?: number;
  skillsMatchPercentage?: number;

  aiSummary?: string;
  analysisConfidence?: number;
}

export interface InterviewQuestion {
  id: string;

  category:
    | 'Introduction'
    | 'Core Concepts'
    | 'Advanced Questions'
    | 'System Design'
    | 'Behavioral';

  question: string;
  supportingInstruction: string;
  expectedKeyPoints: string[];

  idealDurationSeconds: number;

  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface InterviewResponse {
  questionId: string;
  questionText: string;

  answerText: string;
  timeSpentSeconds: number;

  clarityMetric: 'Excellent' | 'Good' | 'Fair' | 'Needs Work';

  toneMetric:
    | 'Professional'
    | 'Confident'
    | 'Casual'
    | 'Hesitant';

  score: number;
  aiFeedback: string;

  // Advanced AI metrics
  relevanceScore?: number;
  technicalAccuracyScore?: number;
  communicationScore?: number;
  confidenceScore?: number;

  strengths?: string[];
  improvements?: string[];
}

export interface InterviewSession {
  id: string;

  candidateId: string;

  jobId: string;
  jobTitle: string;

  companyName: string;

  scheduledTime: string;
  durationMinutes: number;

  status:
    | 'Scheduled'
    | 'In Progress'
    | 'Completed'
    | 'Incomplete'
    | 'Cancelled';

  questions: InterviewQuestion[];
  responses: InterviewResponse[];

  overallScore?: number;

  recommendation?: string;
  summaryFeedback?: string;

  completedAt?: string;

  // AI interview intelligence
  technicalScore?: number;
  behavioralScore?: number;
  communicationScore?: number;

  riskFlags?: string[];
  aiConfidence?: number;
}

export interface ScheduledInterview {
  id: string;
  applicationId: string;
  candidateId: string;
  recruiterId: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'HR Interview' | 'Technical Interview' | 'AI Assessment' | 'Final Interview';
  mode: 'Online' | 'Offline';
  meetingLink?: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  question: string;

  type: 'mcq' | 'coding';

  options?: string[];
  correctOptionIndex?: number;

  starterCode?: string;
  sampleInput?: string;
  sampleOutput?: string;

  explanation?: string;

  points: number;

  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
}

export interface AssessmentTest {
  id: string;

  title: string;

  category:
    | 'Aptitude Test'
    | 'Coding Test'
    | 'Technical MCQs';

  description: string;

  totalQuestions: number;
  durationMinutes: number;
  totalPoints: number;

  passingScore: number;

  questions: TestQuestion[];

  createdAt?: string;
  createdBy?: string;
}

export interface TestAttempt {
  id: string;

  testId: string;
  testTitle: string;

  category: string;

  candidateId: string;

  completedAt: string;

  score: number;
  totalPoints: number;
  percentage: number;

  status: 'Passed' | 'Failed';

  timeSpentMinutes: number;

  answers: Record<string, any>;

  // Assessment insights
  correctAnswers?: number;
  incorrectAnswers?: number;

  tabSwitchCount?: number;
  suspiciousActivity?: boolean;
}

export interface AIHiringRecommendation {
  recommendationLevel:
    | 'Strongly Recommended'
    | 'Recommended'
    | 'Conditional'
    | 'Not Recommended';

  overallMatchPercentage: number;

  executiveSummary: string;

  pros: string[];
  cons: string[];

  cultureFitNotes: string;

  suggestedNextSteps: string;

  confidenceScore?: number;
  generatedAt?: string;
}

export interface NotificationItem {
  id: string;

  title: string;
  message: string;

  timestamp: string;

  read: boolean;

  type: 'info' | 'success' | 'alert';

  actionUrl?: string;
  actionLabel?: string;
}

export interface Company {
  id: string;
  recruiterId: string;
  name: string;
  website: string;
  logo?: string;
  industry?: string;
  description?: string;
  address?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  companySize?: string;
  foundedYear?: number;
  linkedinUrl?: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  verificationDocuments?: any;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Internship {
  id: string;
  recruiterId: string;
  companyId: string;
  company?: {
    id?: string;
    name: string;
    logo?: string;
    website?: string;
    location?: string;
  };
  title: string;
  department: string;
  description: string;
  skills: string[];
  eligibility?: string;
  location: string;
  mode: string;
  duration: string;
  stipend?: string;
  startDate?: string;
  openings: number;
  deadline?: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  applicantCount: number;
  createdAt: string;
  updatedAt?: string;
}

export type ApplicationType = 'JOB' | 'INTERNSHIP';

export interface AdminStats {
  totalCandidates: number;
  totalRecruiters: number;
  pendingCompanies: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  activeJobs: number;
  activeInternships: number;
  totalApplications: number;
  totalInterviews: number;
}

export interface JobMatchItem {
  id: string;
  title: string;
  type: 'JOB' | 'INTERNSHIP';
  company: string;
  location: string;
  department: string;
  requiredSkills: string[];
  matchScore: number;
}