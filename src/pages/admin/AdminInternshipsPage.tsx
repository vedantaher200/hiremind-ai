import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  Eye,
  X
} from 'lucide-react';
import { api } from '../../lib/api';

export const AdminInternshipsPage: React.FC = () => {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInternship, setSelectedInternship] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const data = await api.admin.internships({
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter
      });
      setInternships(data || []);
    } catch (err) {
      console.error('Failed to load admin internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [statusFilter]);

  const handleStatusToggle = async (internshipId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to set this internship status to ${newStatus}?`)) return;

    setActionLoading(internshipId);
    try {
      await api.admin.updateInternshipStatus(internshipId, newStatus);
      await fetchInternships();
    } catch (err: any) {
      alert(err?.message || 'Failed to update internship status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInternships();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Platform Internship Opportunities
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Oversee internship postings, stipend transparency, and student applications platform-wide.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
              Total Internships: {internships.length}
            </span>
            <button
              onClick={fetchInternships}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-purple-600 transition-colors cursor-pointer"
              title="Refresh Internships"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by internship title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
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
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Internships List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-xs font-medium">Loading platform internships from database…</span>
          </div>
        ) : internships.length === 0 ? (
          <div className="bg-white py-16 px-4 rounded-2xl border border-slate-200 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Internships Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No internship postings matched your search criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Internship & Company</th>
                    <th className="py-3.5 px-4">Duration & Stipend</th>
                    <th className="py-3.5 px-4">Recruiter</th>
                    <th className="py-3.5 px-4 text-center">Applicants</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {internships.map((internship) => (
                    <tr key={internship.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{internship.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{internship.company?.name || 'Company'}</span>
                          {internship.company?.verificationStatus === 'APPROVED' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Verified Company" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-700">{internship.duration || '3 Months'}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{internship.location} • {internship.stipend || 'Unpaid'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">{internship.recruiter?.name}</div>
                        <div className="text-xs text-slate-400">{internship.recruiter?.email}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                          <Users className="w-3 h-3 text-slate-500" />
                          {internship._count?.applications ?? internship.applicantCount ?? 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            internship.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : internship.status === 'CLOSED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {internship.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInternship(internship)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === internship.id}
                            onClick={() => handleStatusToggle(internship.id, internship.status)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              internship.status === 'ACTIVE'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {actionLoading === internship.id ? 'Updating...' : internship.status === 'ACTIVE' ? 'Close' : 'Activate'}
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

        {/* Internship Detail Modal */}
        {selectedInternship && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedInternship.title}</h2>
                  <p className="text-xs text-slate-500">
                    {selectedInternship.company?.name} • {selectedInternship.location} • {selectedInternship.duration}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInternship(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl whitespace-pre-line">
                  {selectedInternship.description}
                </p>
              </div>

              {selectedInternship.skills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInternship.skills.map((sk: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{selectedInternship.stipend || 'Unpaid'}</span>
                  <span className="text-[10px] text-slate-400">Monthly Stipend</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">{selectedInternship.duration || '3 Months'}</span>
                  <span className="text-[10px] text-slate-400">Duration</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">
                    {selectedInternship._count?.applications ?? selectedInternship.applicantCount ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Applications</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedInternship(null)}
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
