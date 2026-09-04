import React, { useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, MapPin, Search, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const { jobs, applications, applyForJob } = useData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const activeJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter(job => {
      if (job.status !== 'Active') return false;
      if (!normalizedQuery) return true;
      return [
        job.title,
        job.department,
        job.location,
        job.description,
        ...job.requiredSkills
      ].some(value => value.toLowerCase().includes(normalizedQuery));
    });
  }, [jobs, query]);

  const appliedJobIds = new Set(
    applications
      .filter(application => application.candidateId === user?.id)
      .map(application => application.jobId)
  );

  const handleApply = async (jobId: string) => {
    if (!user) return;
    setApplyingJobId(jobId);
    setError(null);
    setStatus(null);
    try {
      await applyForJob(jobId, user);
      setStatus('Application submitted successfully.');
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'Unable to submit application.');
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#737380]">Opportunities</p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#191C1D]">Find your next role</h1>
        <p className="mt-1 text-sm text-[#737380]">Browse published roles and track every application from one place.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8EA0]" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by role, skill, department, or location"
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#3525CD] focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <span className="text-xs font-semibold text-[#737380]">{activeJobs.length} active roles</span>
      </div>

      {status && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{status}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {activeJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-[#8E8EA0]" />
          <h2 className="mt-3 text-base font-bold text-[#191C1D]">No published roles match your search</h2>
          <p className="mt-1 text-sm text-[#737380]">Try a different keyword or check back when recruiters publish new openings.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeJobs.map(job => {
            const hasApplied = appliedJobIds.has(job.id);
            return (
              <article key={job.id} className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#191C1D]">{job.title}</h2>
                      <p className="mt-1 text-xs font-semibold text-[#3525CD]">{job.department}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Active</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#737380]">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.type}</span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#464555]">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.requiredSkills.map(skill => <span key={skill} className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-[#3525CD]">{skill}</span>)}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#F0F1F3] pt-4">
                  <span className="text-xs text-[#737380]">{job.salaryRange || 'Compensation discussed during interview'}</span>
                  <button
                    type="button"
                    disabled={hasApplied || applyingJobId === job.id}
                    onClick={() => void handleApply(job.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3525CD] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#281BA8] disabled:cursor-not-allowed disabled:bg-emerald-600"
                  >
                    {hasApplied ? <><CheckCircle2 className="h-4 w-4" />Applied</> : applyingJobId === job.id ? 'Applying...' : 'Apply now'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
