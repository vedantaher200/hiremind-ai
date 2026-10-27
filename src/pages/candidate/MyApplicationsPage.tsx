import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';

type ScheduledInterview = { id: string; date: string; time: string; timeZone?: string | null; interviewType: string; status: string };
type ApplicationRecord = {
  id: string;
  status: string;
  appliedAt: string;
  shareableFeedback?: string | null;
  shareableFeedbackUpdatedAt?: string | null;
  job?: { title: string } | null;
  internship?: { title: string } | null;
  interviews?: ScheduledInterview[];
};
type AssessmentRecord = {
  id: string;
  testTitle: string;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  status: string;
  categoryScores: Record<string, number>;
  strengths: string[];
  improvementAreas: string[];
  improvementSuggestions: string[];
  questionResults: Array<{ questionId: string; question: string; category: string; correct: boolean }>;
};
type FeedbackReply = {
  recordedFacts: {
    applicationStatus: string;
    rejectionReason: string | null;
    rejectionReasonUpdatedAt: string | null;
    assessmentScope: string;
    assessments: AssessmentRecord[];
  };
  recommendations: string[];
  recommendationSource: 'gemini' | 'deterministic';
  fallbackNotice?: string;
};

const validAssessment = (attempt: AssessmentRecord) => Number.isFinite(attempt.percentage)
  && attempt.percentage >= 0 && attempt.percentage <= 100
  && Number.isFinite(attempt.maxScore) && attempt.maxScore > 0;

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [question, setQuestion] = useState('');
  const [replies, setReplies] = useState<Record<string, FeedbackReply>>({});
  const [loadError, setLoadError] = useState('');
  const [chatError, setChatError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.applications.myApplications(), api.assessments.myAttempts()])
      .then(([apps, attempts]) => {
        if (cancelled) return;
        setApplications(apps);
        setAssessments(attempts.map((attempt: any) => ({
          id: attempt.id,
          testTitle: attempt.test?.title || 'Assessment',
          category: attempt.test?.category || 'Assessment',
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: attempt.percentage,
          completedAt: attempt.completedAt,
          status: attempt.passed ? 'Passed' : 'Not passed',
          categoryScores: attempt.categoryScores || {},
          strengths: attempt.strengths || [],
          improvementAreas: attempt.improvementAreas || [],
          improvementSuggestions: attempt.improvementSuggestions || [],
          questionResults: attempt.questionResults || []
        })).filter(validAssessment));
      })
      .catch((error) => { if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Unable to load your saved feedback and results.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => assessments.map((attempt) => ({
    assessment: attempt.testTitle.length > 24 ? `${attempt.testTitle.slice(0, 21)}…` : attempt.testTitle,
    score: attempt.percentage,
    fullTitle: attempt.testTitle
  })), [assessments]);

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !question.trim()) return;
    setBusy(true);
    setChatError('');
    try {
      const reply = await api.applications.askFeedback(selectedId, question.trim());
      setReplies((previous) => ({ ...previous, [selectedId]: reply }));
      setQuestion('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to answer from your saved records.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="mx-auto max-w-5xl space-y-6">
    <header>
      <h1 className="text-2xl font-extrabold text-[#191C1D]">My Applications & Feedback</h1>
      <p className="mt-1 text-sm text-[#737380]">Application updates and assessment results loaded from your saved account records.</p>
    </header>

    {loadError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>}
    {loading && <p role="status" className="rounded-xl bg-white p-5 text-sm text-[#737380]">Loading your saved results…</p>}

    {!loading && assessments.length > 0 && <section className="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="assessment-chart-title">
      <h2 id="assessment-chart-title" className="text-base font-bold">Assessment scores</h2>
      <p className="mb-4 text-xs text-gray-500">Each bar is one saved assessment result. Scores are not combined across tests or assigned to a specific application.</p>
      <div className="h-64 w-full" role="img" aria-label="Saved assessment scores by test">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 20, bottom: 12, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="assessment" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Saved score']} labelFormatter={(_label, items) => items?.[0]?.payload?.fullTitle || ''} />
            <Bar dataKey="score" name="Saved score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>}

    {!loading && assessments.length === 0 && <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-5">
      <h2 className="font-bold">No saved assessment results yet</h2>
      <p className="mt-1 text-sm text-gray-600">Completed assessments will appear here after the server saves the evaluation.</p>
    </section>}

    {assessments.map((attempt) => <article key={attempt.id} className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-bold">{attempt.testTitle}</h2><p className="text-xs text-gray-500">{attempt.category} · {new Date(attempt.completedAt).toLocaleString()}</p></div>
        <p className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-black text-indigo-800">{attempt.percentage}% · {attempt.score}/{attempt.maxScore}</p>
      </div>
      {Object.keys(attempt.categoryScores).length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(attempt.categoryScores).map(([category, score]) => <div key={category} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"><span>{category}</span><strong>{score}%</strong></div>)}</div>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
        <div><h3 className="font-semibold">Demonstrated strengths</h3>{attempt.strengths.length ? <ul className="mt-1 list-disc pl-5 text-gray-700">{attempt.strengths.map(item => <li key={item}>{item}</li>)}</ul> : <p className="mt-1 text-gray-500">No category met the documented strength threshold for this attempt.</p>}</div>
        <div><h3 className="font-semibold">Practice areas</h3>{attempt.improvementAreas.length ? <ul className="mt-1 list-disc pl-5 text-gray-700">{attempt.improvementAreas.map(item => <li key={item}>{item}</li>)}</ul> : <p className="mt-1 text-gray-500">No category fell below the documented practice threshold.</p>}</div>
      </div>
      {attempt.improvementSuggestions.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">{attempt.improvementSuggestions.map(item => <li key={item}>{item}</li>)}</ul>}
    </article>)}

    {!loading && applications.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-gray-600">No applications found.</p>}
    {applications.map((app) => {
      const posting = app.job || app.internship;
      const reply = replies[app.id];
      return <article key={app.id} className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{posting?.title || 'Position'}</h2><p className="text-xs text-gray-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{app.status.replaceAll('_', ' ')}</span></div>
        {app.interviews && app.interviews.length > 0 && <div className="mt-3 rounded-xl bg-slate-50 p-3"><h3 className="text-sm font-semibold">Scheduled interviews</h3>{app.interviews.map(interview => <p key={interview.id} className="mt-1 text-xs text-gray-600">{interview.interviewType} · {interview.status} · {interview.date} {interview.time} {interview.timeZone || ''}</p>)}<p className="mt-1 text-xs text-gray-500">No persisted interview evaluation is available unless a saved assessment result is listed above.</p></div>}
        {app.status === 'REJECTED' && <div className="mt-4 rounded-xl bg-slate-50 p-4"><h3 className="text-sm font-bold">Official recruiter feedback</h3>{app.shareableFeedback ? <><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{app.shareableFeedback}</p>{app.shareableFeedbackUpdatedAt && <p className="mt-2 text-xs text-gray-500">Shared {new Date(app.shareableFeedbackUpdatedAt).toLocaleString()}</p>}</> : <p className="mt-2 text-sm text-slate-600">The recruiter has not provided a specific reason approved for sharing.</p>}</div>}
        <button type="button" onClick={() => { setSelectedId(selectedId === app.id ? '' : app.id); setChatError(''); }} className="mt-3 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white">{selectedId === app.id ? 'Close feedback assistant' : 'Ask about my results'}</button>
        {selectedId === app.id && <form onSubmit={ask} className="mt-4 space-y-2">
          <label className="block text-xs font-semibold" htmlFor={`question-${app.id}`}>Feedback & improvement assistant</label>
          <textarea id={`question-${app.id}`} value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} rows={3} placeholder="माझ्या assessment मध्ये काय improve करावे? मला पुढे काय practice करावे?" className="w-full rounded-lg border border-gray-300 p-3 text-sm" />
          <button disabled={busy || !question.trim()} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Preparing suggestions…' : 'Ask'}</button>
          {chatError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{chatError}</p>}
          {reply && <div className="space-y-3 rounded-xl bg-indigo-50 p-4">
            <section><h3 className="text-xs font-bold uppercase tracking-wide">Recorded facts</h3><p className="mt-1 text-sm">Application status: {reply.recordedFacts.applicationStatus.replaceAll('_', ' ')}.</p>{reply.recordedFacts.rejectionReason ? <p className="mt-1 whitespace-pre-wrap text-sm">Approved rejection feedback: {reply.recordedFacts.rejectionReason}</p> : app.status === 'REJECTED' ? <p className="mt-1 text-sm">The recruiter has not provided a specific reason approved for sharing.</p> : null}<p className="mt-2 text-xs text-gray-600">Assessment records are candidate-wide and are not linked to a specific application.</p>{reply.recordedFacts.assessments.length === 0 ? <p className="mt-1 text-sm">There are no saved assessment evaluations available for personalized assessment advice.</p> : reply.recordedFacts.assessments.map(result => <p key={result.id} className="mt-1 text-sm">{result.testTitle}: {result.score}/{result.maxScore} ({result.percentage}%) · {new Date(result.completedAt).toLocaleDateString()}</p>)}</section>
            <section><h3 className="text-xs font-bold uppercase tracking-wide">{reply.recommendationSource === 'gemini' ? 'AI coaching suggestions' : 'Rule-based coaching suggestions'}</h3>{reply.fallbackNotice && <p className="mt-1 text-xs text-gray-600">{reply.fallbackNotice}</p>}<ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{reply.recommendations.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
          </div>}
        </form>}
      </article>;
    })}
  </section>;
};
