import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ArrowUpDown, 
  ChevronRight, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Award,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApplicationStatus } from '../../types';

interface CandidatesListPageProps {
  onNavigate: (page: string, candidateId?: string) => void;
}

export const CandidatesListPage: React.FC<CandidatesListPageProps> = ({ onNavigate }) => {
  const { applications, updateApplicationStatus } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'overall' | 'ats' | 'interview' | 'date'>('overall');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          app.candidateName.toLowerCase().includes(query) ||
          app.candidateEmail.toLowerCase().includes(query) ||
          app.jobTitle.toLowerCase().includes(query);

        const matchesRole = selectedRole === 'All' || app.jobTitle.toLowerCase().includes(selectedRole.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        if (sortBy === 'overall') {
          valA = a.scores.overallScore;
          valB = b.scores.overallScore;
        } else if (sortBy === 'ats') {
          valA = a.scores.atsScore;
          valB = b.scores.atsScore;
        } else if (sortBy === 'interview') {
          valA = a.scores.interviewScore;
          valB = b.scores.interviewScore;
        } else {
          return sortOrder === 'desc' 
            ? new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
            : new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
        }

        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [applications, searchQuery, selectedRole, selectedStatus, sortBy, sortOrder]);

  const handleExportCSV = () => {
    const headers = 'Candidate Name,Email,Role,ATS Score,Interview Score,Coding Score,Overall Score,Status\n';
    const rows = filteredApplications.map(a => 
      `"${a.candidateName}","${a.candidateEmail}","${a.jobTitle}",${a.scores.atsScore},${a.scores.interviewScore},${a.scores.codingScore},${a.scores.overallScore},"${a.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HireMind_Candidates_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">Candidates</h1>
          <p className="mt-1 text-sm text-[#464555]">
            Search, filter, and review candidates across all active job positions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#3525CD]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name, email, or skill..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] outline-none focus:ring-2 focus:ring-[#3525CD]/20"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] font-semibold outline-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="AI">AI / ML Engineer</option>
            <option value="Backend">Backend Engineer</option>
            <option value="Frontend">Frontend Engineer</option>
            <option value="Full-Stack">Full-Stack</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] font-semibold outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Sourced">Sourced</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Interviewed">Interviewed</option>
            <option value="Technical">Technical</option>
            <option value="Offer">Offer</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-[#3525CD] rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="overall">Sort: Overall AI Score</option>
            <option value="ats">Sort: ATS Resume Score</option>
            <option value="interview">Sort: Interview Score</option>
            <option value="date">Sort: Applied Date</option>
          </select>
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#464555]">
            <thead className="bg-[#F8F9FA] text-[#737380] uppercase tracking-wider font-bold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3.5">Candidate</th>
                <th className="px-6 py-3.5">Job Target</th>
                <th className="px-6 py-3.5">ATS Resume</th>
                <th className="px-6 py-3.5">Live Interview</th>
                <th className="px-6 py-3.5">Coding Test</th>
                <th className="px-6 py-3.5">Overall Fit</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-[#F8F9FA]/80 transition-colors">
                  {/* Candidate Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.candidateAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={app.candidateName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-[#191C1D] text-xs flex items-center gap-1.5">
                          <span>{app.candidateName}</span>
                          {app.scores.overallScore >= 85 && (
                            <Sparkles className="w-3.5 h-3.5 text-[#712AE2]" />
                          )}
                        </p>
                        <p className="text-[11px] text-[#737380]">{app.candidateEmail}</p>
                      </div>
                    </div>
                  </td>

                  {/* Job Target */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#191C1D]">{app.jobTitle}</p>
                    <p className="text-[10px] text-[#8E8EA0]">Applied {app.appliedDate}</p>
                  </td>

                  {/* ATS Resume Score */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#3525CD] px-2 py-1 bg-indigo-50 rounded-lg">
                      {app.scores.atsScore}%
                    </span>
                  </td>

                  {/* Live Interview Score */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#712AE2] px-2 py-1 bg-purple-50 rounded-lg">
                      {app.scores.interviewScore}%
                    </span>
                  </td>

                  {/* Coding Test Score */}
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg">
                      {app.scores.codingScore}%
                    </span>
                  </td>

                  {/* Overall Fit */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3525CD] to-[#712AE2] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        {app.scores.overallScore}
                      </div>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-6 py-4">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-gray-200 bg-white cursor-pointer outline-none"
                    >
                      <option value="Sourced">Sourced</option>
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Interviewed">Interviewed</option>
                      <option value="Technical">Technical</option>
                      <option value="Offer">Offer</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onNavigate('candidate-details', app.candidateId)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
                    >
                      Profile &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
