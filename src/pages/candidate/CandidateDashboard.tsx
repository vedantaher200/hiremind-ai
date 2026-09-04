import React, { useMemo } from 'react';
import {
  FileText,
  Video,
  CheckSquare,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  TrendingUp
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

import { StatCard } from '../../components/common/StatCard';
import { CircularScore } from '../../components/common/CircularScore';
import { ProgressBar } from '../../components/common/ProgressBar';

interface CandidateDashboardProps {
  onNavigate: (page: string) => void;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  iconClassName: string;
}

export const CandidateDashboard: React.FC<
  CandidateDashboardProps
> = ({ onNavigate }) => {
  const { user } = useAuth();

  const {
    applications,
    testAttempts,
    latestResume,
    interviewSession,
    scheduledInterviews
  } = useData();

  /* =========================================================
     CURRENT USER DATA
  ========================================================= */

  const myApplications = useMemo(() => {
    if (!user) return [];

    return applications.filter(
      application =>
        application.candidateId === user.id
    );
  }, [applications, user]);

  const myAttempts = useMemo(() => {
    if (!user) return [];

    return testAttempts.filter(
      attempt => attempt.candidateId === user.id
    );
  }, [testAttempts, user]);

  const myInterview =
    interviewSession &&
    interviewSession.candidateId === user?.id
      ? interviewSession
      : null;

  /* =========================================================
     APPLICATION STATS
  ========================================================= */

  const activeApplications = myApplications.filter(
    application =>
      !['Rejected', 'Hired'].includes(
        application.status
      )
  );

  const completedInterviews =
    myInterview?.status === 'Completed'
      ? 1
      : 0;

  const upcomingInterview =
    myInterview &&
    ['Scheduled', 'In Progress'].includes(
      myInterview.status
    )
      ? myInterview
      : null;

  const upcomingScheduledInterview = scheduledInterviews.find(interview =>
    interview.candidateId === user?.id && interview.status === 'Scheduled'
  );

  /* =========================================================
     TEST STATS
  ========================================================= */

  const passedTests = myAttempts.filter(
    attempt => attempt.status === 'Passed'
  );

  /* =========================================================
     SCORE CALCULATION
  ========================================================= */

  const applicationScores = myApplications
    .map(application => application.scores.overallScore)
    .filter(
      score =>
        typeof score === 'number' &&
        !Number.isNaN(score) &&
        score > 0
    );

  const testScores = myAttempts
    .map(attempt => attempt.percentage)
    .filter(
      score =>
        typeof score === 'number' &&
        !Number.isNaN(score)
    );

  const resumeScore =
    latestResume?.candidateId === user?.id
      ? latestResume.atsCompatibilityScore
      : null;

  const allScores = [
    ...applicationScores,
    ...testScores,
    ...(resumeScore !== null ? [resumeScore] : [])
  ];

  const averageScore =
    allScores.length > 0
      ? Math.round(
          allScores.reduce(
            (total, score) => total + score,
            0
          ) / allScores.length
        )
      : 0;

  /* =========================================================
     PROFILE COMPLETENESS
  ========================================================= */

  const profileCompleteness = useMemo(() => {
    if (!user) return 0;

    let completedFields = 0;
    const totalFields = 5;

    if (user.name) completedFields++;
    if (user.email) completedFields++;

    if (user.phone) completedFields++;
    if (user.location) completedFields++;
    if (user.title) completedFields++;

    return Math.round(
      (completedFields / totalFields) * 100
    );
  }, [user]);

  /* =========================================================
     RESUME PROGRESS
  ========================================================= */

  const resumeProgress =
    latestResume &&
    latestResume.candidateId === user?.id
      ? latestResume.atsCompatibilityScore
      : 0;

  /* =========================================================
     TEST PROGRESS
  ========================================================= */

  const totalAvailableTests = 3;

  const testProgress = Math.min(
    100,
    Math.round(
      (myAttempts.length / totalAvailableTests) * 100
    )
  );

  /* =========================================================
     RECENT ACTIVITY
  ========================================================= */

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    /* RESUME ACTIVITY */

    if (
      latestResume &&
      latestResume.candidateId === user?.id
    ) {
      items.push({
        id: `resume-${latestResume.id}`,
        title: 'Resume Uploaded & Analyzed',
        description: `ATS compatibility score: ${latestResume.atsCompatibilityScore}%.${
          latestResume.targetRole
            ? ` Target role: ${latestResume.targetRole}.`
            : ''
        }`,
        timestamp: latestResume.uploadedAt,
        icon: FileCheck,
        iconClassName:
          'bg-indigo-50 border-indigo-100 text-[#3525CD]'
      });
    }

    /* APPLICATION ACTIVITIES */

    myApplications.forEach(application => {
      items.push({
        id: `application-${application.id}`,
        title: `Application Submitted: ${application.jobTitle}`,
        description: `Current application status: ${application.status}.`,
        timestamp: application.appliedDate,
        icon: FileText,
        iconClassName:
          'bg-blue-50 border-blue-100 text-blue-600'
      });
    });

    /* TEST ACTIVITIES */

    myAttempts.forEach(attempt => {
      items.push({
        id: `test-${attempt.id}`,
        title: `Test Completed: ${attempt.testTitle}`,
        description: `Scored ${attempt.score}/${attempt.totalPoints} points (${attempt.percentage}%). Result: ${attempt.status}.`,
        timestamp: attempt.completedAt,
        icon: CheckSquare,
        iconClassName:
          attempt.status === 'Passed'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
            : 'bg-red-50 border-red-100 text-red-600'
      });
    });

    /* INTERVIEW ACTIVITY */

    if (
      myInterview &&
      myInterview.status === 'Completed'
    ) {
      items.push({
        id: `interview-${myInterview.id}`,
        title: 'AI Interview Session Completed',
        description:
          myInterview.summaryFeedback ||
          `Overall AI interview score: ${
            myInterview.overallScore ?? 0
          }%.`,
        timestamp:
          myInterview.completedAt ||
          myInterview.scheduledTime,
        icon: Video,
        iconClassName:
          'bg-purple-50 border-purple-100 text-[#712AE2]'
      });
    }

    return items
      .sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
        );
      })
      .slice(0, 5);
  }, [
    latestResume,
    myApplications,
    myAttempts,
    myInterview,
    user?.id
  ]);

  /* =========================================================
     DATE FORMATTER
  ========================================================= */

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  const formatActivityTime = (
    dateString?: string
  ) => {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const days = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    if (minutes < 1) return 'Just now';

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hour${
        hours === 1 ? '' : 's'
      } ago`;
    }

    if (days < 7) {
      return `${days} day${
        days === 1 ? '' : 's'
      } ago`;
    }

    return date.toLocaleDateString();
  };

  /* =========================================================
     EMPTY DASHBOARD
  ========================================================= */

  if (
    !latestResume &&
    myApplications.length === 0 &&
    myAttempts.length === 0 &&
    !myInterview
  ) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1D]">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#464555]">
            Your recruitment activity will appear
            here as you use HireMind.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-10 text-center">
          <FileText className="w-10 h-10 text-[#3525CD] mx-auto mb-3" />

          <h2 className="font-bold text-[#191C1D]">
            No activity yet
          </h2>

          <p className="text-sm text-[#737380] mt-1">
            Upload a resume, then apply to a
            published opportunity to begin.
          </p>

          <button
            onClick={() =>
              onNavigate('resume-intelligence')
            }
            className="mt-5 px-4 py-2 rounded-xl bg-[#3525CD] text-white text-xs font-bold hover:opacity-90 transition-all"
          >
            Upload Resume
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD UI
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#464555]">
            Welcome back, {user?.name || 'Candidate'}!
            Here's your progress overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              onNavigate('resume-intelligence')
            }
            className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 hover:bg-[#F8F9FA] transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-[#3525CD]" />

            <span>
              {latestResume
                ? 'Update Resume'
                : 'Upload Resume'}
            </span>
          </button>

          <button
            onClick={() =>
              onNavigate('ai-interview')
            }
            className="px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-sm hover:bg-[#115E59] active:bg-[#0B4F4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />

            <span>
              {upcomingInterview
                ? 'Join AI Interview'
                : 'Start AI Interview'}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Applications"
          value={String(myApplications.length)}
          icon={FileText}
          accentColor="indigo"
          subtext={`${activeApplications.length} active in pipeline`}
          trend={{
            value:
              myApplications.length > 0
                ? `${activeApplications.length} active`
                : 'No applications yet',
            isPositive:
              activeApplications.length > 0
          }}
        />

        <StatCard
          label="Interviews"
          value={String((upcomingScheduledInterview ? 1 : 0) + completedInterviews)}
          icon={Video}
          accentColor="purple"
          subtext={
            upcomingScheduledInterview || upcomingInterview
              ? 'Interview scheduled'
              : 'No upcoming interview'
          }
          trend={{
            value:
              myInterview?.overallScore !== undefined
                ? `${myInterview.overallScore}% AI Score`
                : upcomingInterview
                ? 'Upcoming session'
                : 'Not completed yet',
            isPositive:
              myInterview?.overallScore !== undefined
                ? myInterview.overallScore >= 50
                : Boolean(upcomingScheduledInterview || upcomingInterview)
          }}
        />

        <StatCard
          label="Tests"
          value={String(myAttempts.length)}
          icon={CheckSquare}
          accentColor="emerald"
          subtext={`${passedTests.length} passed`}
          trend={{
            value:
              myAttempts.length > 0
                ? `${passedTests.length}/${myAttempts.length} passed`
                : 'No tests completed',
            isPositive:
              passedTests.length > 0
          }}
        />

        <StatCard
          label="Average Score"
          value={`${averageScore}%`}
          icon={Award}
          accentColor="amber"
          subtext={
            allScores.length > 0
              ? 'Based on your evaluations'
              : 'Complete assessments'
          }
          trend={{
            value:
              averageScore >= 75
                ? 'Strong performance'
                : averageScore >= 50
                ? 'Good progress'
                : 'Keep improving',
            isPositive: averageScore >= 50
          }}
        />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="lg:col-span-8 space-y-6">
          {upcomingScheduledInterview && (
            <div className="rounded-2xl border border-[#B9DFD8] bg-[#E6F4F1] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">Scheduled Interview</p>
                  <h3 className="mt-1 text-base font-bold text-[#1D2927]">{upcomingScheduledInterview.jobTitle}</h3>
                  <p className="mt-1 text-sm text-[#53635F]">{upcomingScheduledInterview.interviewType} · {upcomingScheduledInterview.mode}</p>
                  <p className="mt-2 text-xs font-semibold text-[#1D2927]">
                    {new Date(`${upcomingScheduledInterview.interviewDate}T${upcomingScheduledInterview.interviewTime}`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="rounded-full border border-[#B9DFD8] bg-white px-2.5 py-1 text-xs font-bold text-[#0F766E]">{upcomingScheduledInterview.status}</span>
              </div>
              {upcomingScheduledInterview.meetingLink && <a href={upcomingScheduledInterview.meetingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-[#0F766E] underline">Open meeting link</a>}
            </div>
          )}
          {/* ===============================================
              INTERVIEW CARD
          =============================================== */}

          {upcomingInterview ? (
            <div className="bg-gradient-to-br from-white to-indigo-50/30 p-6 rounded-2xl border border-indigo-100 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.06)] relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-indigo-100/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#712AE2] animate-pulse" />

                  <span className="text-xs font-bold text-[#712AE2] uppercase tracking-wider">
                    Upcoming AI Interview
                  </span>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100/70 text-[#3525CD] rounded-full">
                  {upcomingInterview.status}
                </span>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#191C1D]">
                    {upcomingInterview.jobTitle}
                  </h3>

                  <p className="text-xs text-[#464555] mt-1">
                    {upcomingInterview.companyName}
                  </p>

                  <div className="text-xs text-[#464555] mt-2 flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#3525CD]" />

                      {new Date(
                        upcomingInterview.scheduledTime
                      ).toLocaleDateString()}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#712AE2]" />

                      {new Date(
                        upcomingInterview.scheduledTime
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}

                      {' • '}

                      {
                        upcomingInterview.durationMinutes
                      }{' '}
                      mins
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onNavigate('ai-interview')
                  }
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {upcomingInterview.status ===
                    'In Progress'
                      ? 'Continue Interview'
                      : 'Join Interview'}
                  </span>

                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#712AE2] shrink-0">
                    <Video className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#191C1D]">
                      No Upcoming AI Interview
                    </h3>

                    <p className="text-xs text-[#737380] mt-1">
                      Start an AI interview to
                      evaluate your communication
                      and technical skills.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onNavigate('ai-interview')
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#3525CD] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  Start Interview

                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ===============================================
              RECENT ACTIVITY
          =============================================== */}

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#191C1D]">
                Recent Activity
              </h3>

              <span className="text-xs font-semibold text-[#3525CD]">
                Latest Updates
              </span>
            </div>

            {activities.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {activities.map(activity => {
                  const Icon = activity.icon;

                  return (
                    <div
                      key={activity.id}
                      className="py-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${activity.iconClassName}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-[#191C1D]">
                            {activity.title}
                          </p>

                          <p className="text-xs text-[#737380] mt-0.5">
                            {activity.description}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-[#8E8EA0] shrink-0 font-medium">
                        {formatActivityTime(
                          activity.timestamp
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <TrendingUp className="w-8 h-8 text-[#3525CD] mx-auto mb-2" />

                <p className="text-sm font-bold text-[#191C1D]">
                  No recent activity
                </p>

                <p className="text-xs text-[#737380] mt-1">
                  Your applications, tests and
                  interviews will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#191C1D]">
                Overall Progress
              </h3>

              <span className="text-xs font-semibold text-[#712AE2] px-2 py-0.5 rounded-full bg-purple-50">
                Live Rating
              </span>
            </div>

            {/* =============================================
                CIRCULAR SCORE
            ============================================= */}

            <div className="py-2 flex flex-col items-center">
              <CircularScore
                score={averageScore}
                size={130}
                strokeWidth={11}
                label="Overall Score"
              />

              <p className="mt-3 text-center text-xs font-semibold text-[#191C1D]">
                {averageScore >= 80
                  ? 'Excellent progress across your evaluations.'
                  : averageScore >= 60
                  ? 'You are making strong progress.'
                  : averageScore >= 40
                  ? 'Keep completing assessments to improve.'
                  : 'Complete your evaluations to build your score.'}
              </p>

              <p className="text-center text-[11px] text-[#737380] mt-1 max-w-xs leading-relaxed">
                Your score is calculated using
                available application, resume,
                test and evaluation results.
              </p>
            </div>

            {/* =============================================
                COMPLETION STATUS
            ============================================= */}

            <div className="space-y-4 pt-3 border-t border-[#E5E7EB]">
              <h4 className="text-xs font-bold text-[#737380] uppercase tracking-wider">
                Completion Status
              </h4>

              <ProgressBar
                label="Profile Completeness"
                percentage={profileCompleteness}
                valueLabel={`${profileCompleteness}%`}
                color="gradient"
                height="md"
              />

              <ProgressBar
                label="Resume Screening"
                percentage={resumeProgress}
                valueLabel={`${resumeProgress}%`}
                color="gradient"
                height="md"
              />

              <ProgressBar
                label="Evaluation Tests"
                percentage={testProgress}
                valueLabel={`${testProgress}%`}
                color="gradient"
                height="md"
              />
            </div>

            {/* =============================================
                RESULTS CTA
            ============================================= */}

            <div className="pt-2">
              <button
                onClick={() =>
                  onNavigate('results')
                }
                className="w-full py-2.5 bg-[#F8F9FA] hover:bg-indigo-50/60 border border-[#E5E7EB] hover:border-indigo-200 text-[#3525CD] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span>
                  View Comprehensive Report
                </span>

                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* =================================================
              QUICK SUMMARY
          ================================================= */}

          {latestResume &&
            latestResume.candidateId === user?.id && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-5 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#3525CD]" />

                  <h3 className="text-sm font-bold text-[#191C1D]">
                    Resume Status
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#737380]">
                      ATS Score
                    </span>

                    <span className="font-bold text-[#191C1D]">
                      {
                        latestResume.atsCompatibilityScore
                      }%
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-[#737380]">
                      Skills Found
                    </span>

                    <span className="font-bold text-[#191C1D]">
                      {
                        latestResume.extractedSkills
                          .length
                      }
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-[#737380]">
                      Missing Skills
                    </span>

                    <span className="font-bold text-[#191C1D]">
                      {
                        latestResume.missingSkills
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};