import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Job,
  Internship,
  Application,
  ResumeAnalysis,
  RankingWeights,
  AssessmentTest,
  TestAttempt,
  InterviewSession,
  ScheduledInterview,
  UserProfile,
  NotificationItem,
  ApplicationStatus
} from '../types';
import { 
  DEFAULT_WEIGHTS, 
  SEED_JOBS, 
  SEED_INTERNSHIPS, 
  SEED_CANDIDATES_LIST
} from '../data/seedData';
import { api, getToken } from '../lib/api';
import { useAuth } from './AuthContext';
import { createClientId } from '../lib/id';

const mapBackendAppToFrontend = (app: any, currentUser?: UserProfile | null): Application => {
  const isJob = app.applicationType === 'JOB' || Boolean(app.jobId);
  const title = app.job?.title || app.internship?.title || 'Position';
  const cName = app.candidate?.name || (app.candidateId === currentUser?.id ? currentUser.name : 'Candidate');
  const cEmail = app.candidate?.email || (app.candidateId === currentUser?.id ? currentUser.email : '');
  const cAvatar = app.candidate?.avatar || (app.candidateId === currentUser?.id ? currentUser.avatar : undefined);
  const cLoc = app.candidate?.location || (app.candidateId === currentUser?.id ? currentUser.location : undefined);

  let status: ApplicationStatus = 'Applied';
  switch (app.status) {
    case 'APPLIED':
      status = 'Applied';
      break;
    case 'UNDER_REVIEW':
      status = 'Screening';
      break;
    case 'SHORTLISTED':
      status = 'Technical';
      break;
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_COMPLETED':
      status = 'Interviewed';
      break;
    case 'SELECTED':
      status = 'Offer';
      break;
    case 'HIRED':
      status = 'Hired';
      break;
    case 'REJECTED':
      status = 'Rejected';
      break;
    default:
      status = 'Applied';
  }

  const rawScores = typeof app.scores === 'string' ? JSON.parse(app.scores) : app.scores || {};

  return {
    id: app.id,
    candidateId: app.candidateId,
    candidateName: cName,
    candidateEmail: cEmail,
    candidateAvatar: cAvatar,
    candidateLocation: cLoc,
    jobId: app.jobId || app.internshipId || '',
    jobTitle: title,
    appliedDate: app.appliedAt || app.createdAt || new Date().toISOString(),
    status,
    scores: {
      atsScore: Number(rawScores.atsScore) || 0,
      interviewScore: Number(rawScores.interviewScore) || 0,
      codingScore: Number(rawScores.codingScore) || 0,
      aptitudeScore: Number(rawScores.aptitudeScore) || 0,
      communicationScore: Number(rawScores.communicationScore) || 0,
      behavioralScore: Number(rawScores.behavioralScore) || 0,
      overallScore: Number(rawScores.overallScore) || 0
    },
    resumeUrl: app.resume?.id ? `/api/resumes/${app.resume.id}/file` : undefined,
    notes: app.notes || undefined,
    shareableFeedback: app.shareableFeedback || undefined,
    feedbackCategories: app.feedbackCategories || []
  };
};

const mapFrontendStatusToBackend = (status: ApplicationStatus): string => {
  switch (status) {
    case 'Applied':
    case 'Sourced':
      return 'APPLIED';
    case 'Screening':
      return 'UNDER_REVIEW';
    case 'Technical':
      return 'SHORTLISTED';
    case 'Interviewed':
      return 'INTERVIEW_SCHEDULED';
    case 'Offer':
      return 'SELECTED';
    case 'Hired':
      return 'HIRED';
    case 'Rejected':
      return 'REJECTED';
    default:
      return 'APPLIED';
  }
};

/* =========================================================
   DATA CONTEXT INTERFACE
========================================================= */

export interface DataContextType {
  jobs: Job[];
  internships: Internship[];
  applications: Application[];
  candidates: UserProfile[];
  resumeAnalyses: ResumeAnalysis[];
  latestResume: ResumeAnalysis | null;
  resumeLoadError: string | null;
  candidateDataLoadError: string | null;
  tests: AssessmentTest[];
  testAttempts: TestAttempt[];
  interviewSession: InterviewSession | null;
  scheduledInterviews: ScheduledInterview[];
  rankingWeights: RankingWeights;
  notifications: NotificationItem[];

  addJob: (job: Omit<Job, 'id' | 'applicantCount' | 'createdAt'>) => Promise<void>;
  applyForJob: (jobId: string, candidate: UserProfile) => Promise<void>;
  updateApplicationStatus: (appId: string, status: ApplicationStatus, rejectionReason?: string, shareRejectionReason?: boolean) => Promise<void>;
  saveResumeAnalysis: (analysis: ResumeAnalysis) => Promise<void>;
  recordTestAttempt: (input: { testId: string; answers: Record<string, number>; timeSpentSeconds: number }) => Promise<TestAttempt>;
  updateInterviewResponse: (session: InterviewSession) => Promise<void>;
  scheduleInterview: (
    input: Omit<ScheduledInterview, 'id' | 'createdAt' | 'jobTitle' | 'candidateName' | 'recruiterId'>
  ) => Promise<void>;
  setRankingWeights: React.Dispatch<React.SetStateAction<RankingWeights>>;
  calculateOverallScore: (scores: Application['scores'], weights?: RankingWeights) => number;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'alert') => void;
  markNotificationAsRead: (id: string) => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* =========================================================
   DATA PROVIDER IMPLEMENTATION
========================================================= */

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [internships, setInternships] = useState<Internship[]>(SEED_INTERNSHIPS);
  const [candidates, setCandidates] = useState<UserProfile[]>(SEED_CANDIDATES_LIST);
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumeAnalyses, setResumeAnalyses] = useState<ResumeAnalysis[]>([]);
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [resumeLoadError, setResumeLoadError] = useState<string | null>(null);
  const [candidateDataLoadError, setCandidateDataLoadError] = useState<string | null>(null);
  const [rankingWeights, setRankingWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);

  /* =========================================================
     LOAD DATA FROM PERSISTENT API
  ========================================================= */

  const refreshData = useCallback(async () => {
    const candidateLoadErrors: string[] = [];
    try {
      // 1. Fetch public / active jobs
      const fetchedJobs = await api.jobs.list().catch(() => []);
      if (Array.isArray(fetchedJobs) && fetchedJobs.length > 0) {
        setJobs(
          fetchedJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || 'Engineering',
            location: j.location || 'Remote',
            type: j.employmentType || 'Full-time',
            experienceLevel: j.experienceLevel || 'Mid',
            description: j.description || '',
            requirements: j.requirements || [],
            requiredSkills: j.requiredSkills || [],
            preferredSkills: j.preferredSkills || [],
            salaryRange: j.salaryRange || undefined,
            applicantCount: j.applicantCount || 0,
            status: j.status === 'ACTIVE' ? 'Active' : j.status === 'CLOSED' ? 'Closed' : 'Draft',
            createdAt: j.createdAt || new Date().toISOString()
          }))
        );
      }

      // 2. Fetch active internships
      const fetchedInternships = await api.internships.list().catch(() => []);
      if (Array.isArray(fetchedInternships) && fetchedInternships.length > 0) {
        setInternships(fetchedInternships);
      }

      if (!user || !getToken()) return;

      // 3. User-specific notifications
      const notifs = await api.notifications.list().catch(() => []);
      if (Array.isArray(notifs)) {
        setNotifications(
          notifs.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now',
            read: Boolean(n.isRead),
            type: n.type === 'success' ? 'success' : n.type === 'alert' ? 'alert' : 'info'
          }))
        );
      }

      // 4. User-specific interviews
      const interviews = await api.interviews.list().catch(() => {
        if (user.role === 'candidate') candidateLoadErrors.push('interviews');
        return [];
      });
      if (Array.isArray(interviews)) {
        setScheduledInterviews(
          interviews.map((item: any) => ({
            id: item.id,
            applicationId: item.applicationId || '',
            candidateId: item.candidateId,
            recruiterId: item.recruiterId,
            jobId: item.jobId || item.internshipId || '',
            jobTitle: item.job?.title || item.internship?.title || 'Position',
            candidateName: item.candidate?.name || 'Candidate',
            interviewDate: item.date,
            interviewTime: item.time,
            interviewType: (item.interviewType as any) || 'Technical Interview',
            mode: item.mode?.toLowerCase().includes('in-person') ? 'Offline' : 'Online',
            meetingLink: item.meetingLink || undefined,
            notes: item.notes || undefined,
            status: (item.status as any) || 'Scheduled',
            createdAt: item.createdAt || new Date().toISOString()
          }))
        );
      }

      // 5. Role-specific data
      if (user.role === 'recruiter') {
        // Recruiter's applicants across all their jobs/internships
        const applicantsData = await api.applications.recruiterApplicants().catch(() => []);
        if (Array.isArray(applicantsData)) {
          const mappedApps = applicantsData.map((app: any) => mapBackendAppToFrontend(app, user));
          setApplications(mappedApps);

          // Build unique candidates list from applicants
          const candidateMap = new Map<string, UserProfile>();
          applicantsData.forEach((app: any) => {
            if (app.candidate && !candidateMap.has(app.candidate.id)) {
              candidateMap.set(app.candidate.id, {
                id: app.candidate.id,
                name: app.candidate.name,
                email: app.candidate.email,
                role: 'candidate',
                avatar: app.candidate.avatar || undefined,
                phone: app.candidate.phone || undefined,
                location: app.candidate.location || undefined,
                title: app.candidate.title || undefined,
                skills: app.candidate.skills || [],
                experience: app.candidate.experience || [],
                education: app.candidate.education || [],
                matchScore: app.candidate.matchScore || undefined,
                createdAt: app.appliedAt || new Date().toISOString()
              });
            }
          });
          setCandidates(Array.from(candidateMap.values()));
        }

        // Recruiter's own jobs (to include drafts or closed)
        const myJobsData = await api.jobs.myJobs().catch(() => []);
        if (Array.isArray(myJobsData) && myJobsData.length > 0) {
          const mappedMyJobs = myJobsData.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || 'Engineering',
            location: j.location || 'Remote',
            type: j.employmentType || 'Full-time',
            experienceLevel: j.experienceLevel || 'Mid',
            description: j.description || '',
            requirements: j.requirements || [],
            requiredSkills: j.requiredSkills || [],
            preferredSkills: j.preferredSkills || [],
            salaryRange: j.salaryRange || undefined,
            applicantCount: j.applicantCount || 0,
            status: j.status === 'ACTIVE' ? 'Active' : j.status === 'CLOSED' ? 'Closed' : 'Draft',
            createdAt: j.createdAt || new Date().toISOString()
          }));
          setJobs(prev => {
            const map = new Map(prev.map(j => [j.id, j]));
            mappedMyJobs.forEach(j => map.set(j.id, j));
            return Array.from(map.values());
          });
        }
      } else if (user.role === 'candidate') {
        // Candidate's own applications
        const myApps = await api.applications.myApplications().catch(() => {
          candidateLoadErrors.push('applications');
          return [];
        });
        if (Array.isArray(myApps)) {
          setApplications(myApps.map((app: any) => mapBackendAppToFrontend(app, user)));
        }

        // Candidate's latest resume and analysis
        let resumeRes: { resume: any; analysis: any };
        try {
          resumeRes = await api.resumes.latest();
          setResumeLoadError(null);
        } catch (error) {
          resumeRes = { resume: null, analysis: null };
          setResumeLoadError(error instanceof Error ? error.message : 'Unable to load your resume analysis.');
        }
        if (resumeRes?.analysis) {
          const a = resumeRes.analysis;
          const formattedAnalysis: ResumeAnalysis = {
            id: a.id,
            candidateId: a.candidateId,
            resumeId: resumeRes.resume?.id,
            fileName: resumeRes.resume?.fileName || 'Resume.pdf',
            uploadedAt: a.createdAt || new Date().toISOString(),
            fileSize: `${((resumeRes.resume?.fileSize || 0) / 1024).toFixed(1)} KB`,
            atsCompatibilityScore: Math.round(Number(a.atsScore)),
            extractedSkills: a.extractedSkills || [],
            skillEvidence: Array.isArray(a.skillEvidence) ? a.skillEvidence : [],
            scoringVersion: a.scoringVersion || undefined,
            rawText: resumeRes.resume?.extractedText || '',
            skillsMatchPercentage: Number(a.skillMatch ?? 0),
            experienceMatchPercentage: Number(a.experienceMatch ?? 0),
            educationMatchPercentage: Number(a.educationMatch ?? 0),
            strengths: a.strengths || [],
            missingSkills: a.missingSkills || [],
            experienceSummary: a.experienceSummary || '',
            educationSummary: a.educationSummary || '',
            improvementSuggestions: a.improvementSuggestions || [],
            source: a.scoringVersion === 'deterministic-v1' ? 'rules' : 'legacy'
          };
          setResumeAnalyses([formattedAnalysis]);
        } else {
          setResumeAnalyses([]);
        }

        // Assessment content and attempts are loaded only from the persistent API.
        const availableTests = await api.assessments.list().catch(() => {
          candidateLoadErrors.push('assessment tests');
          return [];
        });
        if (Array.isArray(availableTests)) {
          setTests(availableTests
            .filter((test: any) => Array.isArray(test.questions) && test.questions.length > 0 && test.questions.every((question: any) => question.type === 'mcq'))
            .map((test: any) => ({ ...test, questions: test.questions.map((question: any) => ({ ...question, correctOptionIndex: undefined })) })));
        }

        // Candidate's persisted test attempts
        const attempts = await api.assessments.myAttempts().catch(() => {
          candidateLoadErrors.push('assessments');
          return [];
        });
        if (Array.isArray(attempts)) {
          setTestAttempts(
            attempts.map((att: any) => ({
              id: att.id,
              testId: att.testId,
              testTitle: att.test?.title || 'Skill Assessment',
              category: att.test?.category || 'General',
              candidateId: att.candidateId,
              completedAt: att.completedAt || new Date().toISOString(),
              score: att.score,
              totalPoints: att.maxScore,
              percentage: att.percentage,
              status: att.passed ? 'Passed' : 'Failed',
              timeSpentMinutes: Math.round((att.timeSpentSeconds || 0) / 60),
              answers: {},
              categoryScores: att.categoryScores || {},
              questionResults: att.questionResults || [],
              strengths: att.strengths || [],
              improvementAreas: att.improvementAreas || [],
              improvementSuggestions: att.improvementSuggestions || []
            }))
          );
        }

        setCandidateDataLoadError(candidateLoadErrors.length
          ? `Some candidate records could not be loaded (${candidateLoadErrors.join(', ')}). Dashboard counts may be incomplete; refresh or try again.`
          : null);

        setCandidates([user]);
      }
    } catch (err) {
      console.warn('Data sync warning:', err);
    }
  }, [user]);

  useEffect(() => {
    setApplications([]);
    setResumeAnalyses([]);
    setTests([]);
    setTestAttempts([]);
    setScheduledInterviews([]);
    setInterviewSession(null);
    setResumeLoadError(null);
    setCandidateDataLoadError(null);
    void refreshData();
  }, [refreshData]);

  /* =========================================================
     LATEST RESUME
  ========================================================= */

  const latestResume = resumeAnalyses.length > 0 ? resumeAnalyses[0] : null;

  /* =========================================================
     SCORE CALCULATION
  ========================================================= */

  const calculateOverallScore = (
    scores: Application['scores'],
    weights: RankingWeights = rankingWeights
  ): number => {
    const totalWeight =
      weights.atsWeight +
      weights.interviewWeight +
      weights.codingWeight +
      weights.communicationWeight +
      weights.behavioralWeight;

    if (totalWeight <= 0) return 0;

    const weightedSum =
      scores.atsScore * weights.atsWeight +
      scores.interviewScore * weights.interviewWeight +
      scores.codingScore * weights.codingWeight +
      scores.communicationScore * weights.communicationWeight +
      scores.behavioralScore * weights.behavioralWeight;

    return Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'alert' = 'info'
  ) => {
    const newNotif: NotificationItem = {
      id: createClientId('notif'),
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 30));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    api.notifications.markAsRead(id).catch(() => {});
  };

  /* =========================================================
     ADD JOB (POST to API)
  ========================================================= */

  const addJob = async (newJobData: Omit<Job, 'id' | 'applicantCount' | 'createdAt'>) => {
    if (!user) throw new Error('Please sign in to create a job posting.');

    const res = await api.jobs.create({
      title: newJobData.title,
      department: newJobData.department,
      location: newJobData.location,
      employmentType: newJobData.type,
      experienceLevel: newJobData.experienceLevel,
      description: newJobData.description,
      requirements: newJobData.requirements || [],
      requiredSkills: newJobData.requiredSkills || [],
      preferredSkills: newJobData.preferredSkills || [],
      salaryRange: newJobData.salaryRange
    });

    const created = res.job;
    const formatted: Job = {
      ...newJobData,
      id: created.id,
      applicantCount: 0,
      status: 'Active',
      createdAt: created.createdAt || new Date().toISOString()
    };

    setJobs(prev => [formatted, ...prev]);
    addNotification('New Job Posted', `Role "${formatted.title}" has been published.`, 'success');
  };

  /* =========================================================
     APPLY FOR JOB
  ========================================================= */

  const applyForJob = async (jobId: string, candidate: UserProfile) => {
    const targetJob = jobs.find(job => job.id === jobId);
    if (!targetJob) throw new Error('Selected job was not found.');

    const alreadyApplied = applications.some(
      app => app.jobId === jobId && app.candidateId === candidate.id
    );
    if (alreadyApplied) throw new Error('You have already applied for this job.');

    const res = await api.applications.apply({ jobId });

    const newApp = mapBackendAppToFrontend(res.application, candidate);
    setApplications(prev => [newApp, ...prev]);
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, applicantCount: j.applicantCount + 1 } : j))
    );

    addNotification(
      'Application Submitted',
      `You successfully applied for "${targetJob.title}".`,
      'success'
    );
  };

  /* =========================================================
     UPDATE APPLICATION STATUS
  ========================================================= */

  const updateApplicationStatus = async (appId: string, status: ApplicationStatus, rejectionReason?: string, shareRejectionReason = false) => {
    const backendStatus = mapFrontendStatusToBackend(status);

    const result = await api.applications.updateStatus(appId, backendStatus, undefined, rejectionReason, shareRejectionReason);

    setApplications(prev =>
      prev.map(app => (app.id === appId ? {
        ...app,
        status,
        shareableFeedback: result.application.shareableFeedback || undefined,
        feedbackCategories: result.application.feedbackCategories || []
      } : app))
    );

    addNotification(
      'Candidate Status Updated',
      `Application updated to ${status}.`,
      status === 'Rejected' ? 'alert' : 'info'
    );
  };

  /* =========================================================
     SAVE RESUME ANALYSIS
  ========================================================= */

  const saveResumeAnalysis = async (analysis: ResumeAnalysis) => {
    setResumeAnalyses(prev => [analysis, ...prev.filter(i => i.id !== analysis.id)]);

    setApplications(prev =>
      prev.map(app => {
        if (app.candidateId !== analysis.candidateId) return app;
        const updatedScores = { ...app.scores, atsScore: analysis.atsCompatibilityScore };
        return {
          ...app,
          scores: {
            ...updatedScores,
            overallScore: calculateOverallScore(updatedScores)
          }
        };
      })
    );

    addNotification(
      'Resume Evaluated',
      `ATS Score: ${analysis.atsCompatibilityScore}% compatibility.`,
      'success'
    );
  };

  /* =========================================================
     RECORD TEST ATTEMPT
  ========================================================= */

  const recordTestAttempt = async (input: { testId: string; answers: Record<string, number>; timeSpentSeconds: number }): Promise<TestAttempt> => {
    const response = await api.assessments.submit(input.testId, input.answers, input.timeSpentSeconds);
    const saved = response.attempt;
    const attempt: TestAttempt = {
      id: saved.id,
      testId: saved.testId,
      testTitle: saved.test?.title || 'Assessment',
      category: saved.test?.category || 'Assessment',
      candidateId: saved.candidateId,
      completedAt: saved.completedAt,
      score: saved.score,
      totalPoints: saved.maxScore,
      percentage: saved.percentage,
      status: saved.passed ? 'Passed' : 'Failed',
      timeSpentMinutes: Math.ceil((saved.timeSpentSeconds || 0) / 60),
      answers: input.answers,
      categoryScores: saved.categoryScores || {},
      questionResults: saved.questionResults || [],
      strengths: saved.strengths || [],
      improvementAreas: saved.improvementAreas || [],
      improvementSuggestions: saved.improvementSuggestions || []
    };
    setTestAttempts(prev => [attempt, ...prev]);
    addNotification(
      'Test Completed',
      `Scored ${attempt.percentage}% on ${attempt.testTitle}.`,
      attempt.status === 'Passed' ? 'success' : 'alert'
    );
    return attempt;
  };

  /* =========================================================
     UPDATE INTERVIEW RESPONSE
  ========================================================= */

  const updateInterviewResponse = async (session: InterviewSession) => {
    setInterviewSession(session);

    if (session.status !== 'Completed' || session.overallScore === undefined) return;

    setApplications(prev =>
      prev.map(app => {
        if (app.candidateId !== session.candidateId) return app;
        const updatedScores = { ...app.scores, interviewScore: session.overallScore ?? 0 };
        return {
          ...app,
          status: app.status === 'Applied' ? 'Interviewed' : app.status,
          scores: {
            ...updatedScores,
            overallScore: calculateOverallScore(updatedScores)
          }
        };
      })
    );

    addNotification(
      'AI Interview Completed',
      `Overall AI assessment score: ${session.overallScore}%.`,
      'success'
    );
  };

  /* =========================================================
     SCHEDULE INTERVIEW
  ========================================================= */

  const scheduleInterview = async (
    input: Omit<ScheduledInterview, 'id' | 'createdAt' | 'jobTitle' | 'candidateName' | 'recruiterId'>
  ) => {
    if (!user || user.role !== 'recruiter') {
      throw new Error('Only recruiters can schedule interviews.');
    }

    const job = jobs.find(item => item.id === input.jobId);
    const candidate = candidates.find(item => item.id === input.candidateId);

    const res = await api.interviews.schedule({
      candidateId: input.candidateId,
      applicationId: input.applicationId,
      jobId: input.jobId,
      date: input.interviewDate,
      time: input.interviewTime,
      durationMinutes: 45,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      interviewType: input.interviewType,
      mode: input.mode,
      meetingLink: input.meetingLink,
      notes: input.notes
    });

    const newInterview: ScheduledInterview = {
      ...input,
      id: res.interview?.id || createClientId('interview'),
      recruiterId: user.id,
      jobTitle: job?.title || 'Opportunity',
      candidateName: candidate?.name || 'Candidate',
      createdAt: new Date().toISOString()
    };

    setScheduledInterviews(prev => [newInterview, ...prev]);

    if (input.applicationId) {
      await updateApplicationStatus(input.applicationId, 'Interviewed');
    }
  };

  return (
    <DataContext.Provider
      value={{
        jobs,
        internships,
        applications,
        candidates,
        resumeAnalyses,
        latestResume,
        resumeLoadError,
        candidateDataLoadError,
        tests,
        testAttempts,
        interviewSession,
        scheduledInterviews,
        rankingWeights,
        notifications,
        addJob,
        applyForJob,
        updateApplicationStatus,
        saveResumeAnalysis,
        recordTestAttempt,
        updateInterviewResponse,
        scheduleInterview,
        setRankingWeights,
        calculateOverallScore,
        addNotification,
        markNotificationAsRead,
        refreshData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
