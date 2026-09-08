import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Building,
  Briefcase,
  GraduationCap,
  FileCheck2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  PieChart,
  ShieldAlert,
  Award
} from 'lucide-react';
import { api } from '../../lib/api';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.admin.analytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Aggregating platform intelligence across PostgreSQL database…</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const comp = data?.companyBreakdown || {};
  const postings = data?.postingsDistribution || {};
  const pipeline = data?.applicationPipeline || {};
  const totalApps = kpis.totalApplications || 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Platform Intelligence & Governance Analytics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time metrics, recruiter company verification status, and recruitment funnel insights.
              </p>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer self-start sm:self-auto"
            title="Refresh Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Top 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Candidates</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{kpis.totalCandidates ?? 0}</span>
              <span className="text-[11px] font-semibold text-emerald-600">Active Talent</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recruiters & Orgs</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{kpis.totalRecruiters ?? 0}</span>
              <span className="text-[11px] font-semibold text-slate-500">
                ({kpis.totalCompanies ?? 0} Companies)
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Postings</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {(kpis.activeJobs ?? 0) + (kpis.activeInternships ?? 0)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {kpis.activeJobs ?? 0} Jobs • {kpis.activeInternships ?? 0} Internships
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applications & Funnel</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{kpis.totalApplications ?? 0}</span>
              <span className="text-[11px] font-semibold text-slate-500">
                {kpis.totalInterviews ?? 0} Interviews
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Company Verification Breakdown & Postings Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Verification Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Company Verification Status</h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribution of platform recruiter organizations</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Total: {comp.total ?? 0}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Approved Companies
                  </span>
                  <span className="text-slate-800">{comp.approved ?? 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${comp.total ? ((comp.approved || 0) / comp.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-amber-700">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Pending Verification
                  </span>
                  <span className="text-slate-800">{comp.pending ?? 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${comp.total ? ((comp.pending || 0) / comp.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Rejected Companies
                  </span>
                  <span className="text-slate-800">{comp.rejected ?? 0}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${comp.total ? ((comp.rejected || 0) / comp.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Postings Distribution: Jobs vs Internships */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Opportunities Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Jobs vs Internships across the platform</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Total: {postings.totalPostings ?? 0}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                  <Briefcase className="w-4 h-4" />
                  <span>Job Postings</span>
                </div>
                <span className="text-2xl font-black text-slate-900 block">
                  {postings.activeJobs ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {postings.closedJobs ?? 0} Closed / Expired
                </span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                  <GraduationCap className="w-4 h-4" />
                  <span>Internships</span>
                </div>
                <span className="text-2xl font-black text-slate-900 block">
                  {postings.activeInternships ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {postings.closedInternships ?? 0} Closed / Expired
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Application Funnel Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Application Pipeline Funnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status breakdown of candidate applications through screening, interview, and offer
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
            {[
              { key: 'APPLIED', label: 'Applied', color: 'bg-slate-100 text-slate-700' },
              { key: 'UNDER_REVIEW', label: 'Reviewing', color: 'bg-amber-50 text-amber-700' },
              { key: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-indigo-50 text-indigo-700' },
              { key: 'INTERVIEW_SCHEDULED', label: 'Interviewing', color: 'bg-blue-50 text-blue-700' },
              { key: 'INTERVIEW_COMPLETED', label: 'Completed', color: 'bg-teal-50 text-teal-700' },
              { key: 'SELECTED', label: 'Selected', color: 'bg-purple-50 text-purple-700' },
              { key: 'HIRED', label: 'Hired', color: 'bg-emerald-50 text-emerald-700' },
              { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-50 text-rose-700' }
            ].map((stage) => {
              const count = pipeline[stage.key] || 0;
              return (
                <div key={stage.key} className={`p-3 rounded-xl ${stage.color} border border-black/5`}>
                  <span className="text-lg font-black block">{count}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5">
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Registrations Log */}
        {data?.recentRegistrations?.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Recent Platform Registrations</h3>
            <div className="divide-y divide-slate-100">
              {data.recentRegistrations.map((u: any) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {u.name?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                      <span className="text-slate-400 ml-2">({u.email})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700'
                          : u.role === 'RECRUITER'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
