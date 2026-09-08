import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '../../lib/api';

export const AdminJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.admin.jobs({
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to load admin jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleStatusToggle = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change this job status to ${newStatus}?`)) return;

    setActionLoading(jobId);
    try {
      await api.admin.updateJobStatus(jobId, newStatus);
      await fetchJobs();
    } catch (err: any) {
      alert(err?.message || 'Failed to update job status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Platform Job Postings
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit, monitor, and moderate all recruiter job postings across HireMind AI.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
              Total Postings: {jobs.length}
            </span>
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
              title="Refresh Jobs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by job title, department, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <div className="flex gap-1">
              {['ALL', 'ACTIVE', 'CLOSED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs List / Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Loading platform jobs from database…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white py-16 px-4 rounded-2xl border border-slate-200 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Job Postings Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No jobs matched your filter criteria or search query.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Role & Company</th>
                    <th className="py-3.5 px-4">Department & Location</th>
                    <th className="py-3.5 px-4">Recruiter</th>
                    <th className="py-3.5 px-4 text-center">Applicants</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.company?.name || 'Company'}</span>
                          {job.company?.verificationStatus === 'APPROVED' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Company" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-700">{job.department}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location} • {job.employmentType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">{job.recruiter?.name}</div>
                        <div className="text-xs text-slate-400">{job.recruiter?.email}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                          <Users className="w-3 h-3 text-slate-500" />
                          {job._count?.applications ?? job.applicantCount ?? 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            job.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'CLOSED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === job.id}
                            onClick={() => handleStatusToggle(job.id, job.status)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              job.status === 'ACTIVE'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {actionLoading === job.id ? 'Updating...' : job.status === 'ACTIVE' ? 'Close Job' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedJob.title}</h2>
                  <p className="text-xs text-slate-500">
                    {selectedJob.company?.name} • {selectedJob.location} • {selectedJob.employmentType}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              {selectedJob.requiredSkills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requiredSkills.map((sk: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{selectedJob.salaryRange || 'Not disclosed'}</span>
                  <span className="text-[10px] text-slate-400">Compensation</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">{selectedJob.openings || 1}</span>
                  <span className="text-[10px] text-slate-400">Openings</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">{selectedJob._count?.applications ?? selectedJob.applicantCount ?? 0}</span>
                  <span className="text-[10px] text-slate-400">Applicants</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
