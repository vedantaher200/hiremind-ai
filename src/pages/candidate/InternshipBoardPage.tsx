import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { Internship } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const InternshipBoardPage: React.FC = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const [internshipsData, myAppsData] = await Promise.all([
        api.internships.list({
          search: search || undefined,
          mode: selectedMode === 'All' ? undefined : selectedMode
        }).catch(() => []),
        api.applications.myApplications().catch(() => [])
      ]);

      setInternships(internshipsData);
      const applied = myAppsData
        .filter((app: any) => app.internshipId)
        .map((app: any) => app.internshipId as string);
      setAppliedIds(applied);
    } catch (err) {
      console.error('Failed to load internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [selectedMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInternships();
  };

  const handleApply = async (internship: Internship) => {
    if (appliedIds.includes(internship.id)) return;
    setApplyingId(internship.id);
    setFeedbackMsg(null);

    try {
      await api.applications.apply({
        internshipId: internship.id
      });
      setAppliedIds((prev) => [...prev, internship.id]);
      setFeedbackMsg({
        text: `Successfully applied for "${internship.title}" at ${internship.company?.name || 'Company'}!`,
        type: 'success'
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.message || 'Failed to submit application.',
        type: 'error'
      });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-purple-700 via-indigo-700 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-purple-200 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>Dedicated Internship Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Launch Your Career With Industry Internships
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
            Browse verified corporate internships with clear stipends, mentorship, and full-time hiring pathways.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role, skill (e.g. React, Python), or company..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs outline-none shadow-xs placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold outline-none border border-white/20 cursor-pointer"
            >
              <option value="All" className="text-slate-900">All Modes</option>
              <option value="Remote" className="text-slate-900">Remote</option>
              <option value="Hybrid" className="text-slate-900">Hybrid</option>
              <option value="On-site" className="text-slate-900">On-site</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Notifications / Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Internship Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <GraduationCap className="w-8 h-8 animate-bounce mx-auto mb-2 text-purple-600" />
          <span>Fetching active internships from PostgreSQL database...</span>
        </div>
      ) : internships.length === 0 ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <h3 className="font-bold text-sm text-slate-800">No Internships Found</h3>
          <p className="mt-1 text-slate-500 max-w-sm mx-auto">
            No internships matched your search or filters. Try resetting the search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internships.map((item) => {
            const hasApplied = appliedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                        Internship
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 font-semibold">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.company?.name || 'Verified Company'}</span>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-100 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{item.stipend || 'Paid'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.duration || '3 Months'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{item.mode}</span>
                    </span>
                  </div>

                  {/* Skills */}
                  {item.skills && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Apply Button Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {item.applicantCount || 0} applicants
                  </span>

                  <button
                    onClick={() => handleApply(item)}
                    disabled={hasApplied || applyingId === item.id}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      hasApplied
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                        : 'bg-purple-700 hover:bg-purple-800 text-white shadow-xs'
                    }`}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : applyingId === item.id ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <span>Apply Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
