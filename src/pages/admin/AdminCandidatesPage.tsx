import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { api } from '../../lib/api';

interface AdminCandidatesPageProps {
  onNavigate?: (page: string) => void;
}

export const AdminCandidatesPage: React.FC<AdminCandidatesPageProps> = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const data = await api.admin.candidates({
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setCandidates(data || []);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Candidate Directory & Intelligence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor registered talent, resume ATS readiness, and application activity across the platform.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              Total Candidates: {candidates.length}
            </span>
            <button
              onClick={fetchCandidates}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, skills, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Availability:</span>
            <div className="flex gap-1">
              {['ALL', 'Available', 'Open to Work', 'Not Available'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading candidate records from database…</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white py-16 px-4 rounded-2xl border border-slate-200 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Candidates Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No candidates matched your search criteria or availability filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((cand) => {
              const resume = cand.resumes?.[0];
              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar + Basic Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-xs">
                        {cand.avatar ? (
                          <img src={cand.avatar} alt={cand.name} className="w-full h-full object-cover" />
                        ) : (
                          cand.name?.slice(0, 2).toUpperCase() || 'CA'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{cand.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cand.availabilityStatus === 'Available'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cand.availabilityStatus || 'Available'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{cand.title || 'Candidate'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{cand.location || 'Location not specified'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Contact Snippets */}
                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cand.email}</span>
                      </div>
                      {cand.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cand.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills Badge List */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Top Skills:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(cand.skills) && cand.skills.length > 0 ? (
                          cand.skills.slice(0, 4).map((sk: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-md"
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No skills listed yet</span>
                        )}
                        {cand.skills?.length > 4 && (
                          <span className="text-[10px] font-semibold text-slate-400 self-center">
                            +{cand.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats & Resume Info */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-900 block">
                          {cand._count?.applications || 0}
                        </span>
                        <span className="text-[10px] text-slate-500">Apps</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-900 block">
                          {cand._count?.testAttempts || 0}
                        </span>
                        <span className="text-[10px] text-slate-500">Tests</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-xs font-bold text-indigo-600 block">
                          {resume?.atsScore ? `${resume.atsScore}%` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-500">ATS Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {resume ? (
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Resume</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No resume</span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(cand)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Candidate Detail Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {selectedCandidate.name?.slice(0, 2).toUpperCase() || 'CA'}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h2>
                    <p className="text-xs text-slate-500">{selectedCandidate.email} • {selectedCandidate.location || 'Remote'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedCandidate.bio && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">About</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                    {selectedCandidate.bio}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Platform Metrics</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-base font-extrabold text-slate-900 block">
                      {selectedCandidate._count?.applications || 0}
                    </span>
                    <span className="text-[10px] text-slate-500">Applications</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-base font-extrabold text-slate-900 block">
                      {selectedCandidate._count?.testAttempts || 0}
                    </span>
                    <span className="text-[10px] text-slate-500">Assessments</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <span className="text-base font-extrabold text-slate-900 block">
                      {selectedCandidate._count?.candidateInterviews || 0}
                    </span>
                    <span className="text-[10px] text-slate-500">Interviews</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl text-center">
                    <span className="text-base font-extrabold text-indigo-700 block">
                      {selectedCandidate.resumes?.[0]?.atsScore ? `${selectedCandidate.resumes[0].atsScore}%` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-indigo-600">ATS Readiness</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Verified Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills?.map((sk: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {sk}
                    </span>
                  )) || <span className="text-xs text-slate-400">No skills recorded</span>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
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
