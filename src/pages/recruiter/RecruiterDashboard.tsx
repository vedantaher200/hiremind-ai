import React from 'react';
import {
  Briefcase,
  Users,
  Video,
  UserCheck,
  Plus,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';

interface RecruiterDashboardProps {
  onNavigate: (page: string, candidateId?: string) => void;
  onOpenCreateJob?: () => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  onNavigate,
  onOpenCreateJob
}) => {
  const { applications } = useData();

  const pipelineStages = [
    {
      label: 'Sourced',
      count: 64,
      percentage: 100,
      color: 'bg-blue-500'
    },
    {
      label: 'Interviewed',
      count: 42,
      percentage: 65,
      color: 'bg-indigo-600'
    },
    {
      label: 'Technical',
      count: 28,
      percentage: 44,
      color: 'bg-purple-600'
    },
    {
      label: 'Offer',
      count: 6,
      percentage: 10,
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">
            Recruiter Overview
          </h1>

          <p className="mt-1 text-sm text-[#464555]">
            Welcome back. Here is the latest intelligence on your hiring pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('smart-ranking')}
            className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#3525CD]" />
            <span>Smart Rankings</span>
          </button>

          <button
            onClick={() => {
              if (onOpenCreateJob) {
                onOpenCreateJob();
              } else {
                onNavigate('jobs-management');
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-xs font-bold rounded-xl shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(79,70,229,0.4)] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* TOP STATISTICS - CLICKABLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Active Jobs */}
        <button
          type="button"
          onClick={() => onNavigate('jobs-management')}
          className="text-left rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3525CD]/30"
          title="View Active Jobs"
        >
          <StatCard
            label="Active Jobs"
            value="8"
            icon={Briefcase}
            accentColor="indigo"
            subtext="4 Engineering, 2 Product"
            trend={{ value: '+2 this month', isPositive: true }}
          />
        </button>

        {/* Candidates */}
        <button
          type="button"
          onClick={() => onNavigate('candidates-list')}
          className="text-left rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#712AE2]/30"
          title="View Candidates"
        >
          <StatCard
            label="Candidates"
            value="156"
            icon={Users}
            accentColor="purple"
            subtext="42 high precision matches"
            trend={{ value: '+18% vs last week', isPositive: true }}
          />
        </button>

        {/* Interviews */}
        <button
          type="button"
          onClick={() => onNavigate('candidates-list')}
          className="text-left rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          title="View Interview Candidates"
        >
          <StatCard
            label="Interviews"
            value="24"
            icon={Video}
            accentColor="emerald"
            subtext="Autonomous AI evaluations"
            trend={{ value: '94% completed', isPositive: true }}
          />
        </button>

        {/* Hired */}
        <button
          type="button"
          onClick={() => onNavigate('candidates-list')}
          className="text-left rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          title="View Hired Candidates"
        >
          <StatCard
            label="Hired"
            value="6"
            icon={UserCheck}
            accentColor="amber"
            subtext="Average time to hire: 9 days"
            trend={{ value: '3x faster', isPositive: true }}
          />
        </button>
      </div>

      {/* CANDIDATES BY STAGE */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-base font-bold text-[#191C1D]">
              Candidates by Stage
            </h3>

            <p className="text-xs text-[#737380] mt-0.5">
              Real-time throughput across automated screening funnel
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('candidates-list')}
            className="text-xs font-bold text-[#3525CD] bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors cursor-pointer"
          >
            Pipeline Health: 96%
          </button>
        </div>

        {/* Funnel Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {pipelineStages.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => onNavigate('candidates-list')}
              className="p-4 bg-[#F8F9FA] hover:bg-indigo-50 rounded-2xl border border-gray-100 hover:border-indigo-200 space-y-2 text-left transition-all hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3525CD]/20"
              title={`View ${stage.label} candidates`}
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#191C1D]">
                  {stage.label}
                </span>

                <span className="font-black text-[#3525CD]">
                  {stage.count} Candidates
                </span>
              </div>

              <div className="w-full bg-gray-200/70 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.color} transition-all duration-700`}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>

              <span className="text-[10px] text-[#8E8EA0] block">
                {stage.percentage}% of initial pool
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RECENT APPLICATIONS */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#191C1D]">
              Recent Applications
            </h3>

            <p className="text-xs text-[#737380] mt-0.5">
              Top-ranked applicants prioritized by multidimensional AI scoring
            </p>
          </div>

          <button
            onClick={() => onNavigate('candidates-list')}
            className="text-xs font-bold text-[#3525CD] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All 156 Candidates</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#464555]">
            <thead className="bg-[#F8F9FA] text-[#737380] uppercase tracking-wider font-bold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-3.5">Candidate</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">ATS Score</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 font-medium">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-[#F8F9FA]/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          app.candidateAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={app.candidateName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-50"
                      />

                      <div>
                        <p className="font-bold text-[#191C1D] text-xs">
                          {app.candidateName}
                        </p>

                        <p className="text-[11px] text-[#737380]">
                          {app.candidateEmail}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-[#191C1D]">
                    {app.jobTitle}
                  </td>

                  <td className="px-6 py-4 text-[#737380]">
                    {app.appliedDate}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-[#3525CD] font-bold flex items-center justify-center text-xs">
                        {app.scores.atsScore}
                      </span>

                      <span className="text-[11px] text-emerald-600 font-bold">
                        Top 5%
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        onNavigate('candidate-details', app.candidateId)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#3525CD] font-bold text-xs transition-colors cursor-pointer"
                    >
                      View Candidate
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