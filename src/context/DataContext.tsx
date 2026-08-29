import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Job,
  Application,
  ResumeAnalysis,
  RankingWeights,
  AssessmentTest,
  TestAttempt,
  InterviewSession,
  UserProfile,
  NotificationItem
} from '../types';
import { DEFAULT_WEIGHTS } from '../data/seedData';
import {
  STORAGE_KEYS,
  getStoredItem,
  setStoredItem,
  supabase
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { createClientId } from '../lib/id';

interface DataContextType {
  jobs: Job[];
  applications: Application[];
  candidates: UserProfile[];
  resumeAnalyses: ResumeAnalysis[];
  latestResume: ResumeAnalysis | null;
  tests: AssessmentTest[];
  testAttempts: TestAttempt[];
  interviewSession: InterviewSession | null;
  rankingWeights: RankingWeights;
  notifications: NotificationItem[];

  addJob: (
    job: Omit<Job, 'id' | 'applicantCount' | 'createdAt'>
  ) => Promise<void>;

  applyForJob: (
    jobId: string,
    candidate: UserProfile
  ) => Promise<void>;

  updateApplicationStatus: (
    appId: string,
    status: Application['status']
  ) => Promise<void>;

  saveResumeAnalysis: (analysis: ResumeAnalysis) => void;

  recordTestAttempt: (
    attempt: Omit<TestAttempt, 'id' | 'completedAt'>
  ) => void;

  updateInterviewResponse: (
    session: InterviewSession
  ) => void;

  setRankingWeights: React.Dispatch<
    React.SetStateAction<RankingWeights>
  >;

  calculateOverallScore: (
    scores: Application['scores'],
    weights?: RankingWeights
  ) => number;

  addNotification: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'alert'
  ) => void;

  markNotificationAsRead: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(
  undefined
);

/* =========================================================
   DEFAULT ASSESSMENT TESTS
========================================================= */

const DEFAULT_TESTS: AssessmentTest[] = [
  {
    id: 'aptitude-test-001',
    title: 'General Aptitude Assessment',
    description:
      'Test your logical reasoning, quantitative aptitude, and problem-solving skills.',
    category: 'Aptitude Test',
    durationMinutes: 20,
    totalQuestions: 5,
    totalPoints: 20,
    passingScore: 50,
    questions: [
      {
        id: 'apt-1',
        type: 'mcq',
        question:
          'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
        options: ['36', '40', '42', '44'],
        correctOptionIndex: 2,
        points: 4
      },
      {
        id: 'apt-2',
        type: 'mcq',
        question:
          'If 5 workers complete a task in 12 days, how many days will 10 workers take at the same rate?',
        options: ['3 days', '6 days', '12 days', '24 days'],
        correctOptionIndex: 1,
        points: 4
      },
      {
        id: 'apt-3',
        type: 'mcq',
        question:
          'A product costs ₹800 and is sold at a 25% profit. What is the selling price?',
        options: ['₹900', '₹950', '₹1000', '₹1200'],
        correctOptionIndex: 2,
        points: 4
      },
      {
        id: 'apt-4',
        type: 'mcq',
        question: 'Which number is the odd one out?',
        options: ['16', '25', '36', '45'],
        correctOptionIndex: 3,
        points: 4
      },
      {
        id: 'apt-5',
        type: 'mcq',
        question:
          'If today is Monday, what day will it be after 100 days?',
        options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        correctOptionIndex: 1,
        points: 4
      }
    ]
  },

  {
    id: 'coding-test-001',
    title: 'JavaScript & TypeScript Coding Challenge',
    description:
      'Demonstrate your programming, problem-solving, and algorithmic thinking skills.',
    category: 'Coding Test',
    durationMinutes: 30,
    totalQuestions: 3,
    totalPoints: 30,
    passingScore: 50,
    questions: [
      {
        id: 'code-1',
        type: 'coding',
        question:
          'Write a function that returns the sum of all numbers in an array.',
        points: 10,
        starterCode: `function sumArray(numbers: number[]): number {
  // Write your solution here

}`,
        sampleInput: '[1, 2, 3, 4]',
        sampleOutput: '10'
      },
      {
        id: 'code-2',
        type: 'coding',
        question:
          'Write a function that checks whether a string is a palindrome.',
        points: 10,
        starterCode: `function isPalindrome(text: string): boolean {
  // Write your solution here

}`,
        sampleInput: '"madam"',
        sampleOutput: 'true'
      },
      {
        id: 'code-3',
        type: 'coding',
        question:
          'Write a function that finds the largest number in an array.',
        points: 10,
        starterCode: `function findLargest(numbers: number[]): number {
  // Write your solution here

}`,
        sampleInput: '[10, 25, 8, 42, 15]',
        sampleOutput: '42'
      }
    ]
  },

  {
    id: 'technical-mcq-001',
    title: 'Full-Stack Technical Knowledge',
    description:
      'Evaluate your knowledge of React, JavaScript, APIs, databases, and modern software development.',
    category: 'Technical MCQs',
    durationMinutes: 25,
    totalQuestions: 5,
    totalPoints: 25,
    passingScore: 50,
    questions: [
      {
        id: 'tech-1',
        type: 'mcq',
        question:
          'Which React Hook is primarily used to manage component state?',
        options: ['useEffect', 'useState', 'useContext', 'useRef'],
        correctOptionIndex: 1,
        points: 5
      },
      {
        id: 'tech-2',
        type: 'mcq',
        question: 'What does API stand for?',
        options: [
          'Application Programming Interface',
          'Automated Program Integration',
          'Application Process Interface',
          'Advanced Programming Internet'
        ],
        correctOptionIndex: 0,
        points: 5
      },
      {
        id: 'tech-3',
        type: 'mcq',
        question:
          'Which HTTP status code means "Not Found"?',
        options: ['200', '201', '404', '500'],
        correctOptionIndex: 2,
        points: 5
      },
      {
        id: 'tech-4',
        type: 'mcq',
        question:
          'Which database is a relational database?',
        options: ['MongoDB', 'Redis', 'PostgreSQL', 'Firebase'],
        correctOptionIndex: 2,
        points: 5
      },
      {
        id: 'tech-5',
        type: 'mcq',
        question: 'What is TypeScript primarily?',
        options: [
          'A database',
          'A superset of JavaScript',
          'A CSS framework',
          'An operating system'
        ],
        correctOptionIndex: 1,
        points: 5
      }
    ]
  }
];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const createEmptyScores = () => ({
  atsScore: 0,
  interviewScore: 0,
  codingScore: 0,
  aptitudeScore: 0,
  communicationScore: 0,
  behavioralScore: 0,
  overallScore: 0
});

const mapApplicationStage = (
  stage: string | null | undefined
): Application['status'] => {
  switch (stage) {
    case 'sourced':
      return 'Sourced';

    case 'screening':
      return 'Screening';

    case 'interview':
      return 'Interviewed';

    case 'technical':
      return 'Technical';

    case 'offer':
      return 'Offer';

    case 'rejected':
      return 'Rejected';

    case 'hired':
      return 'Hired';

    default:
      return 'Applied';
  }
};

const mapStatusToStage = (
  status: Application['status']
): string => {
  switch (status) {
    case 'Sourced':
      return 'sourced';

    case 'Screening':
      return 'screening';

    case 'Interviewed':
      return 'interview';

    case 'Technical':
      return 'technical';

    case 'Offer':
      return 'offer';

    case 'Rejected':
      return 'rejected';

    case 'Hired':
      return 'hired';

    default:
      return 'applied';
  }
};

/* =========================================================
   DATA PROVIDER
========================================================= */

export const DataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>(() =>
    getStoredItem(STORAGE_KEYS.JOBS, [])
  );

  const [candidates, setCandidates] = useState<UserProfile[]>(() =>
    getStoredItem(STORAGE_KEYS.CANDIDATES, [])
  );

  const [applications, setApplications] = useState<Application[]>(() =>
    getStoredItem(STORAGE_KEYS.APPLICATIONS, [])
  );

  const [resumeAnalyses, setResumeAnalyses] = useState<
    ResumeAnalysis[]
  >(() =>
    getStoredItem(STORAGE_KEYS.RESUME_ANALYSES, [])
  );

  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>(
    () => getStoredItem(STORAGE_KEYS.TEST_ATTEMPTS, [])
  );

  const [rankingWeights, setRankingWeights] =
    useState<RankingWeights>(() =>
      getStoredItem(
        STORAGE_KEYS.RANKING_WEIGHTS,
        DEFAULT_WEIGHTS
      )
    );

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >(() =>
    getStoredItem(STORAGE_KEYS.NOTIFICATIONS, [])
  );

  const [interviewSession, setInterviewSession] =
    useState<InterviewSession | null>(() =>
      getStoredItem(STORAGE_KEYS.INTERVIEWS, null)
    );

  /* =========================================================
     LOCAL STORAGE SYNC
  ========================================================= */

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.JOBS, jobs);
  }, [jobs]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.CANDIDATES, candidates);
  }, [candidates]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.APPLICATIONS, applications);
  }, [applications]);

  useEffect(() => {
    setStoredItem(
      STORAGE_KEYS.RESUME_ANALYSES,
      resumeAnalyses
    );
  }, [resumeAnalyses]);

  useEffect(() => {
    setStoredItem(
      STORAGE_KEYS.TEST_ATTEMPTS,
      testAttempts
    );
  }, [testAttempts]);

  useEffect(() => {
    setStoredItem(
      STORAGE_KEYS.RANKING_WEIGHTS,
      rankingWeights
    );
  }, [rankingWeights]);

  useEffect(() => {
    setStoredItem(
      STORAGE_KEYS.NOTIFICATIONS,
      notifications
    );
  }, [notifications]);

  useEffect(() => {
    setStoredItem(
      STORAGE_KEYS.INTERVIEWS,
      interviewSession
    );
  }, [interviewSession]);

  /* =========================================================
     LOAD DATA FROM SUPABASE
  ========================================================= */

  useEffect(() => {
    if (!supabase || !user) return;

    const load = async () => {
      try {
        /* ---------------- JOBS ---------------- */

        const {
          data: jobRows,
          error: jobsError
        } = await supabase
          .from('jobs')
          .select('*')
          .order('created_at', {
            ascending: false
          });

        if (!jobsError && jobRows) {
          const {
            data: applicationCountRows
          } = await supabase
            .from('applications')
            .select('job_id');

          const applicationCounts =
            applicationCountRows?.reduce(
              (
                counts: Record<string, number>,
                row: any
              ) => {
                counts[row.job_id] =
                  (counts[row.job_id] || 0) + 1;

                return counts;
              },
              {}
            ) || {};

          setJobs(
            jobRows.map((row: any) => ({
              id: row.id,
              title: row.title,
              department:
                row.department || 'General',
              location:
                row.location || 'Not specified',
              type:
                row.employment_type || 'Full-time',
              experienceLevel:
                row.experience_level || 'Entry',
              description: row.description || '',
              requirements:
                row.requirements || [],
              requiredSkills:
                row.required_skills || [],
              salaryRange:
                row.salary_range || undefined,
              applicantCount:
                applicationCounts[row.id] || 0,
              status:
                row.status === 'published'
                  ? 'Active'
                  : row.status === 'closed'
                  ? 'Closed'
                  : 'Draft',
              createdAt:
                row.created_at ||
                new Date().toISOString()
            }))
          );
        }

        /* ---------------- CANDIDATES ---------------- */

        const {
          data: profileRows,
          error: profilesError
        } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', {
            ascending: false
          });

        if (!profilesError && profileRows) {
          const loadedCandidates: UserProfile[] =
            profileRows
              .filter(
                (row: any) =>
                  row.role === 'candidate'
              )
              .map((row: any) => ({
                id: row.id,
                name:
                  row.name ||
                  row.full_name ||
                  'Candidate',
                email: row.email || '',
                role: 'candidate',
                avatar:
                  row.avatar_url || undefined,
                phone:
                  row.phone || undefined,
                location:
                  row.location || undefined,
                title:
                  row.title || undefined,
                bio: row.bio || undefined,
                matchScore:
                  row.match_score || undefined,
                skills: row.skills || [],
                experience:
                  row.experience || [],
                education:
                  row.education || [],
                createdAt:
                  row.created_at ||
                  new Date().toISOString()
              }));

          setCandidates(loadedCandidates);
        }

        /* ---------------- APPLICATIONS ---------------- */

        const {
          data: appRows,
          error: appsError
        } = await supabase
          .from('applications')
          .select('*, jobs(title)')
          .order('applied_at', {
            ascending: false
          });

        if (!appsError && appRows) {
          const loadedApplications: Application[] =
            appRows.map((row: any) => {
              const candidate =
                candidates.find(
                  c => c.id === row.candidate_id
                );

              return {
                id: row.id,
                candidateId: row.candidate_id,
                candidateName:
                  row.candidate_name ||
                  candidate?.name ||
                  (row.candidate_id === user.id
                    ? user.name
                    : 'Candidate'),
                candidateEmail:
                  row.candidate_email ||
                  candidate?.email ||
                  (row.candidate_id === user.id
                    ? user.email
                    : ''),
                candidateAvatar:
                  candidate?.avatar,
                candidateLocation:
                  candidate?.location,
                jobId: row.job_id,
                jobTitle:
                  row.jobs?.title || 'Job',
                appliedDate:
                  row.applied_at ||
                  new Date().toISOString(),
                status:
                  mapApplicationStage(row.stage),
                scores: {
                  atsScore:
                    Number(row.ats_score) || 0,
                  interviewScore:
                    Number(
                      row.interview_score
                    ) || 0,
                  codingScore:
                    Number(
                      row.coding_score
                    ) || 0,
                  aptitudeScore:
                    Number(
                      row.aptitude_score
                    ) || 0,
                  communicationScore:
                    Number(
                      row.communication_score
                    ) || 0,
                  behavioralScore:
                    Number(
                      row.behavioral_score
                    ) || 0,
                  overallScore:
                    Number(
                      row.overall_score
                    ) || 0
                },
                resumeUrl:
                  row.resume_url || undefined,
                notes:
                  row.notes || undefined
              };
            });

          setApplications(loadedApplications);
        }

        /* ---------------- NOTIFICATIONS ---------------- */

        const {
          data: notificationRows
        } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', {
            ascending: false
          })
          .limit(20);

        if (notificationRows) {
          setNotifications(
            notificationRows.map(
              (row: any) => ({
                id: row.id,
                title: row.title,
                message: row.message,
                timestamp:
                  row.created_at
                    ? new Date(
                        row.created_at
                      ).toLocaleString()
                    : 'Just now',
                read: Boolean(row.read_at),
                type:
                  row.type === 'success'
                    ? 'success'
                    : row.type === 'alert'
                    ? 'alert'
                    : 'info'
              })
            )
          );
        }
      } catch (error) {
        console.error(
          'Error loading application data:',
          error
        );
      }
    };

    void load();
  }, [user?.id]);

  /* =========================================================
     LATEST RESUME
  ========================================================= */

  const latestResume =
    resumeAnalyses.length > 0
      ? resumeAnalyses[0]
      : null;

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
      scores.interviewScore *
        weights.interviewWeight +
      scores.codingScore *
        weights.codingWeight +
      scores.communicationScore *
        weights.communicationWeight +
      scores.behavioralScore *
        weights.behavioralWeight;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(weightedSum / totalWeight)
      )
    );
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

    setNotifications(prev =>
      [newNotif, ...prev].slice(0, 20)
    );

    if (supabase && user) {
      void supabase
        .from('notifications')
        .insert({
          id: newNotif.id,
          user_id: user.id,
          title,
          message,
          type
        });
    }
  };

  /* =========================================================
     ADD JOB
  ========================================================= */

  const addJob = async (
    newJobData: Omit<
      Job,
      'id' | 'applicantCount' | 'createdAt'
    >
  ) => {
    if (!user) {
      throw new Error(
        'Sign in to create a job.'
      );
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          recruiter_id: user.id,
          title: newJobData.title,
          department: newJobData.department,
          description: newJobData.description,
          requirements:
            newJobData.requirements || [],
          required_skills:
            newJobData.requiredSkills || [],
          location: newJobData.location,
          employment_type:
            newJobData.type,
          experience_level:
            newJobData.experienceLevel,
          salary_range:
            newJobData.salaryRange || null,
          status:
            newJobData.status === 'Active'
              ? 'published'
              : newJobData.status === 'Closed'
              ? 'closed'
              : 'draft'
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message ||
            'Unable to create job.'
        );
      }

      const createdJob: Job = {
        ...newJobData,
        id: data.id,
        applicantCount: 0,
        createdAt: data.created_at
      };

      setJobs(prev => [
        createdJob,
        ...prev
      ]);

      addNotification(
        'New Job Posted',
        `Role "${createdJob.title}" has been created successfully.`,
        'success'
      );

      return;
    }

    /* LOCAL FALLBACK */

    const job: Job = {
      ...newJobData,
      id: createClientId('job'),
      applicantCount: 0,
      createdAt:
        new Date().toISOString()
    };

    setJobs(prev => [
      job,
      ...prev
    ]);

    addNotification(
      'New Job Posted',
      `Role "${job.title}" has been published to candidates.`,
      'success'
    );
  };

  /* =========================================================
     APPLY FOR JOB
  ========================================================= */

  const applyForJob = async (
    jobId: string,
    candidate: UserProfile
  ) => {
    const targetJob = jobs.find(
      job => job.id === jobId
    );

    if (!targetJob) {
      throw new Error(
        'Selected job was not found.'
      );
    }

    const alreadyApplied =
      applications.some(
        application =>
          application.jobId === jobId &&
          application.candidateId ===
            candidate.id
      );

    if (alreadyApplied) {
      throw new Error(
        'You have already applied for this job.'
      );
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidate.id,
          job_id: jobId,
          stage: 'applied'
        })
        .select('*, jobs(title)')
        .single();

      if (error || !data) {
        throw new Error(
          error?.code === '23505'
            ? 'You have already applied for this job.'
            : error?.message ||
              'Unable to submit application.'
        );
      }

      const newApplication: Application = {
        id: data.id,
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        candidateAvatar: candidate.avatar,
        candidateLocation:
          candidate.location,
        jobId,
        jobTitle:
          data.jobs?.title ||
          targetJob.title,
        appliedDate:
          data.applied_at ||
          new Date().toISOString(),
        status: 'Applied',
        scores: createEmptyScores()
      };

      setApplications(prev => [
        newApplication,
        ...prev
      ]);

      setJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? {
                ...job,
                applicantCount:
                  job.applicantCount + 1
              }
            : job
        )
      );

      addNotification(
        'Application Submitted',
        `You successfully applied for ${targetJob.title}.`,
        'success'
      );

      return;
    }

    /* LOCAL FALLBACK */

    const newApp: Application = {
      id: createClientId('app'),
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateAvatar: candidate.avatar,
      candidateLocation:
        candidate.location,
      jobId: targetJob.id,
      jobTitle: targetJob.title,
      appliedDate:
        new Date().toISOString(),
      status: 'Applied',
      scores: createEmptyScores()
    };

    setApplications(prev => [
      newApp,
      ...prev
    ]);

    setJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              applicantCount:
                job.applicantCount + 1
            }
          : job
      )
    );

    addNotification(
      'Application Submitted',
      `You successfully applied for ${targetJob.title}.`,
      'success'
    );
  };

  /* =========================================================
     UPDATE APPLICATION STATUS
  ========================================================= */

  const updateApplicationStatus = async (
    appId: string,
    status: Application['status']
  ) => {
    const stage =
      mapStatusToStage(status);

    if (supabase) {
      const { error } = await supabase
        .from('applications')
        .update({ stage })
        .eq('id', appId);

      if (error) {
        throw new Error(error.message);
      }
    }

    setApplications(prev =>
      prev.map(application =>
        application.id === appId
          ? {
              ...application,
              status
            }
          : application
      )
    );

    addNotification(
      'Candidate Status Updated',
      `Application moved to ${status}.`,
      status === 'Rejected'
        ? 'alert'
        : 'info'
    );
  };

  /* =========================================================
     SAVE RESUME ANALYSIS
  ========================================================= */

  const saveResumeAnalysis = (
    analysis: ResumeAnalysis
  ) => {
    setResumeAnalyses(prev => [
      analysis,
      ...prev.filter(
        item => item.id !== analysis.id
      )
    ]);

    setApplications(prev =>
      prev.map(application => {
        if (
          application.candidateId !==
          analysis.candidateId
        ) {
          return application;
        }

        const updatedScores = {
          ...application.scores,
          atsScore:
            analysis.atsCompatibilityScore
        };

        return {
          ...application,
          scores: {
            ...updatedScores,
            overallScore:
              calculateOverallScore(
                updatedScores
              )
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
     Automatically updates Coding / Aptitude Score
  ========================================================= */

  const recordTestAttempt = (
    attemptData: Omit<
      TestAttempt,
      'id' | 'completedAt'
    >
  ) => {
    const attempt: TestAttempt = {
      ...attemptData,
      id: createClientId('att'),
      completedAt:
        new Date().toISOString()
    };

    setTestAttempts(prev => [
      attempt,
      ...prev
    ]);

    setApplications(prev =>
      prev.map(application => {
        if (
          application.candidateId !==
          attempt.candidateId
        ) {
          return application;
        }

        let updatedScores = {
          ...application.scores
        };

        if (
          attempt.category ===
          'Coding Test'
        ) {
          updatedScores.codingScore =
            attempt.percentage;
        }

        if (
          attempt.category ===
          'Aptitude Test'
        ) {
          updatedScores.aptitudeScore =
            attempt.percentage;
        }

        if (
          attempt.category ===
          'Technical MCQs'
        ) {
          updatedScores.codingScore =
            Math.round(
              (updatedScores.codingScore +
                attempt.percentage) /
                2
            );
        }

        return {
          ...application,
          scores: {
            ...updatedScores,
            overallScore:
              calculateOverallScore(
                updatedScores
              )
          }
        };
      })
    );

    addNotification(
      'Test Completed',
      `Scored ${attempt.percentage}% on ${attempt.testTitle}.`,
      attempt.status === 'Passed'
        ? 'success'
        : 'alert'
    );
  };

  /* =========================================================
     UPDATE INTERVIEW RESPONSE
  ========================================================= */

  const updateInterviewResponse = (
    session: InterviewSession
  ) => {
    setInterviewSession(session);

    if (
      session.status !== 'Completed' ||
      session.overallScore === undefined
    ) {
      return;
    }

    setApplications(prev =>
      prev.map(application => {
        if (
          application.candidateId !==
          session.candidateId
        ) {
          return application;
        }

        const updatedScores = {
          ...application.scores,
          interviewScore:
            session.overallScore ?? 0
        };

        return {
          ...application,
          status:
            application.status === 'Applied'
              ? 'Interviewed'
              : application.status,
          scores: {
            ...updatedScores,
            overallScore:
              calculateOverallScore(
                updatedScores
              )
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
     MARK NOTIFICATION AS READ
  ========================================================= */

  const markNotificationAsRead = (
    id: string
  ) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? {
              ...notification,
              read: true
            }
          : notification
      )
    );

    if (supabase) {
      void supabase
        .from('notifications')
        .update({
          read_at:
            new Date().toISOString()
        })
        .eq('id', id);
    }
  };

  /* =========================================================
     CONTEXT PROVIDER
  ========================================================= */

  return (
    <DataContext.Provider
      value={{
        jobs,
        applications,
        candidates,
        resumeAnalyses,
        latestResume,
        tests: DEFAULT_TESTS,
        testAttempts,
        interviewSession,
        rankingWeights,
        notifications,
        addJob,
        applyForJob,
        updateApplicationStatus,
        saveResumeAnalysis,
        recordTestAttempt,
        updateInterviewResponse,
        setRankingWeights,
        calculateOverallScore,
        addNotification,
        markNotificationAsRead
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

/* =========================================================
   USE DATA HOOK
========================================================= */

export const useData = (): DataContextType => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error(
      'useData must be used within a DataProvider'
    );
  }

  return context;
};