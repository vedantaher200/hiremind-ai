import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Users,
  Briefcase,
  GraduationCap,
  FileCheck2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminStats, Company } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingCompany, setRejectingCompany] = useState<Company | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, companiesData] = await Promise.all([
        api.admin.stats().catch(() => null),
        api.admin.companies(statusFilter === 'ALL' ? undefined : statusFilter).catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      setCompanies(companiesData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleApprove = async (company: Company) => {
    if (!confirm(`Are you sure you want to approve "${company.name}"?`)) return;
    setActionLoading(company.id);
    try {
      await api.admin.approveCompany(company.id);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to approve company.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCompany) return;
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setModalError('Please specify a rejection reason (at least 5 characters).');
      return;
    }

    setActionLoading(rejectingCompany.id);
    setModalError(null);
    try {
      await api.admin.rejectCompany(rejectingCompany.id, rejectionReason.trim());
      setRejectingCompany(null);
      setRejectionReason('');
      await fetchData();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to reject company.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                HireMind AI — Platform Administration
              </h1>
              <p className="text-xs text-slate-500">
                Manage company verification requests, monitor recruiters, and track platform metrics.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Platform Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-amber-600">{stats.pendingCompanies}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Approved Companies</span>
                <Building className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600">{stats.approvedCompanies}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Candidates</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-indigo-600">{stats.totalCandidates}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Jobs</span>
                <Briefcase className="w-4 h-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-blue-600">{stats.activeJobs}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Internships</span>
                <GraduationCap className="w-4 h-4 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-black text-purple-600">{stats.activeInternships}</p>
            </div>
          </div>
        )}

        {/* Company Verification Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Company Verification Queue</h2>
              <p className="text-xs text-slate-500">
                Review recruiter credentials and verify legitimacy before granting publishing access.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'PENDING' && 'Pending Review'}
                  {tab === 'APPROVED' && 'Approved'}
                  {tab === 'REJECTED' && 'Rejected'}
                  {tab === 'ALL' && 'All Records'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              <span>Loading verification requests...</span>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>No companies found in this filter category.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Recruiter</th>
                    <th className="px-5 py-3">Website</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Registration Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((comp: any) => (
                    <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{comp.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {comp.industry || 'Technology'} • {comp.location || 'Remote'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{comp.recruiter?.name || 'Recruiter'}</div>
                        <div className="text-[11px] text-slate-500">{comp.recruiter?.email}</div>
                      </td>

                      <td className="px-5 py-4">
                        <a
                          href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>{comp.website}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            comp.verificationStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : comp.verificationStatus === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {comp.verificationStatus === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                          {comp.verificationStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {comp.verificationStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                          <span>{comp.verificationStatus}</span>
                        </span>
                        {comp.rejectionReason && (
                          <div className="mt-1 text-[10px] text-rose-600 max-w-xs truncate">
                            Reason: {comp.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(comp.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {comp.verificationStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleApprove(comp)}
                              disabled={actionLoading === comp.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {comp.verificationStatus !== 'REJECTED' && (
                            <button
                              onClick={() => {
                                setRejectingCompany(comp);
                                setRejectionReason('');
                                setModalError(null);
                              }}
                              disabled={actionLoading === comp.id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingCompany && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Reject Company Verification</h3>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Specify the reason for rejecting <strong>"{rejectingCompany.name}"</strong>. This message will be shown to the recruiter when they attempt to log in.
            </p>

            {modalError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid organization website domain or incomplete verification credentials."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingCompany(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectingCompany.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {actionLoading === rejectingCompany.id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
