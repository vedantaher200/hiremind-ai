import React, { useMemo, useState } from 'react';
import { HelpCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const topics = [
  ['Getting started', 'Create your profile, then use the sidebar to access the features available to your role.'],
  ['Uploading a resume', 'Open Resume Intelligence and upload a readable TXT resume. PDF/DOC parsing requires a server-side parser.'],
  ['ATS matching', 'A score is calculated only from skills explicitly found in the uploaded resume and the selected job requirements.'],
  ['Applications', 'Candidates can apply only once to each active job. Your status is shown on your dashboard.'],
  ['Account access', 'Use the profile menu to sign out. If email confirmation is enabled, confirm your email before signing in.'],
];
export const HelpCenterPage: React.FC = () => {
  const { role } = useAuth(); const [query, setQuery] = useState('');
  const visible = useMemo(() => topics.filter(([title, body]) => `${title} ${body}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="space-y-6"><div><h1 className="text-2xl font-extrabold text-[#191C1D]">Help Center</h1><p className="mt-1 text-sm text-[#464555]">Guidance for your {role} workspace.</p></div><div className="relative max-w-xl"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737380]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search help topics" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]/20" /></div><div className="grid gap-4">{visible.length ? visible.map(([title, body]) => <article key={title} className="bg-white rounded-2xl border border-[#E5E7EB] p-5"><div className="flex gap-3"><HelpCircle className="w-5 h-5 text-[#3525CD] shrink-0" /><div><h2 className="font-bold text-[#191C1D]">{title}</h2><p className="mt-1 text-sm text-[#737380]">{body}</p></div></div></article>) : <p className="text-sm text-[#737380]">No help topics match your search.</p>}</div></div>;
};
