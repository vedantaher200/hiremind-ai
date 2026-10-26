import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type ApplicationRecord = { id: string; status: string; appliedAt: string; shareableFeedback?: string | null; feedbackCategories?: string[]; job?: { title: string; description: string } | null; internship?: { title: string; description: string } | null };

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.applications.myApplications().then(setApplications).catch(() => setError('Unable to load your applications. Please retry after signing in.')); }, []);
  const ask = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selectedId || !question.trim()) return;
    setBusy(true); setError(''); setAnswer('');
    try { const result = await api.applications.askFeedback(selectedId, question.trim()); setAnswer(result.answer); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to answer from this application.'); }
    finally { setBusy(false); }
  };
  return <section className="mx-auto max-w-4xl space-y-5">
    <header><h1 className="text-2xl font-extrabold text-[#191C1D]">My Applications</h1><p className="mt-1 text-sm text-[#737380]">View persisted application status and recruiter shared feedback.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {applications.length === 0 && !error && <p className="rounded-xl bg-white p-5 text-sm text-[#737380]">No applications found.</p>}
    {applications.map(app => { const posting = app.job || app.internship; return <article key={app.id} className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{posting?.title || 'Position'}</h2><p className="text-xs text-gray-500">Applied {new Date(app.appliedAt).toLocaleDateString()}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{app.status.replaceAll('_', ' ')}</span></div>
      {app.status === 'REJECTED' && <div className="mt-4 rounded-xl bg-slate-50 p-4"><h3 className="text-sm font-bold">Recruiter shared feedback</h3>{app.shareableFeedback ? <><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{app.shareableFeedback}</p>{app.feedbackCategories?.length ? <p className="mt-2 text-xs text-slate-500">Categories: {app.feedbackCategories.join(', ')}</p> : null}</> : <p className="mt-2 text-sm text-slate-600">No specific reason has been provided.</p>}
        <button type="button" onClick={() => { setSelectedId(app.id); setAnswer(''); setError(''); }} className="mt-3 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white">Ask about this feedback</button>
        {selectedId === app.id && <form onSubmit={ask} className="mt-4 space-y-2"><label className="block text-xs font-semibold" htmlFor={`question-${app.id}`}>Candidate Feedback Chat</label><textarea id={`question-${app.id}`} value={question} onChange={e => setQuestion(e.target.value)} maxLength={1000} rows={2} placeholder="Which requirements did I not meet? What should I improve?" className="w-full rounded-lg border border-gray-300 p-3 text-sm"/><button disabled={busy || !question.trim()} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Thinking…' : 'Ask'}</button>{answer && <p className="whitespace-pre-wrap rounded-lg bg-indigo-50 p-3 text-sm">{answer}</p>}</form>}
      </div>}
    </article>; })}
  </section>;
};
