import React, { useState } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Award, 
  Sliders, 
  Download, 
  ChevronRight, 
  Crown, 
  Zap,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';

interface SmartRankingPageProps {
  onNavigate: (page: string, candidateId?: string) => void;
}

export const SmartRankingPage: React.FC<SmartRankingPageProps> = ({ onNavigate }) => {
  const { applications, jobs } = useData();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || 'job-01');

  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Calculate and sort candidates by overall composite score
  const rankedCandidates = [...applications]
    .filter(app => !selectedJobId || app.jobId === selectedJobId || true)
    .sort((a, b) => b.scores.overallScore - a.scores.overallScore);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">Smart Ranking</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#712AE2] border border-purple-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Multi-Modal Ranking Engine</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-[#464555] max-w-3xl">
            AI-powered multi-modal ranking system that calculates composite scores across ATS, technical tests, interview performance, and behavioral signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-1.5 self-start"
          >
            <Download className="w-3.5 h-3.5 text-[#3525CD]" />
            <span>Export Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Role Selector & Formula Explanation Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Selector */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-3">
          <label className="text-xs font-bold text-[#737380] uppercase tracking-wider block">
            Select Job Benchmark
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#191C1D] outline-none cursor-pointer focus:ring-2 focus:ring-[#3525CD]/20"
          >
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.department})
              </option>
            ))}
          </select>

          <div className="pt-2 text-xs text-[#737380] flex items-center justify-between">
            <span>Active Pool: <strong>{rankedCandidates.length} Applicants</strong></span>
            <span className="text-[#3525CD] font-bold">Top Cutoff: 80%</span>
          </div>
        </div>

        {/* Weighted Formula Explanation */}
        <div className="lg:col-span-8 bg-gradient-to-r from-indigo-50/70 via-purple-50/70 to-white p-5 rounded-3xl border border-indigo-100 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] flex flex-col justify-center space-y-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#3525CD]" />
            <h4 className="text-xs font-bold text-[#191C1D] uppercase tracking-wider">
              Autonomous Composite Scoring Equation
            </h4>
          </div>
          <p className="text-xs text-[#464555] font-mono leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100/60">
            Composite Score = (ATS × 25%) + (Interview × 25%) + (Coding × 30%) + (Communication × 10%) + (Behavioral × 10%)
          </p>
        </div>
      </div>

      {/* Smart Ranking Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#191C1D]">Candidate Leaderboard</h3>
            <p className="text-xs text-[#737380] mt-0.5">Dynamically ranked by precision AI fit matrix</p>
          </div>
          <span className="px-3 py-1 bg-purple-50 text-[#712AE2] font-bold text-xs rounded-full border border-purple-100">
            Real-Time Ranking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#464555]">
            <thead className="bg-[#F8F9FA] text-[#737380] uppercase tracking-wider font-bold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-5 py-3.5 text-center">Rank</th>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-5 py-3.5">ATS Resume</th>
                <th className="px-5 py-3.5">AI Interview</th>
                <th className="px-5 py-3.5">Coding Test</th>
                <th className="px-5 py-3.5">Behavioral</th>
                <th className="px-5 py-3.5">Composite Score</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {rankedCandidates.map((app, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;

                return (
                  <tr 
                    key={app.id} 
                    className={`hover:bg-[#F8F9FA]/80 transition-colors ${
                      isFirst ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="px-5 py-4 text-center">
                      {isFirst ? (
                        <div className="w-7 h-7 rounded-xl bg-amber-400 text-white flex items-center justify-center mx-auto shadow-xs">
                          <Crown className="w-4 h-4" />
                        </div>
                      ) : isSecond ? (
                        <div className="w-7 h-7 rounded-xl bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center mx-auto">
                          #2
                        </div>
                      ) : isThird ? (
                        <div className="w-7 h-7 rounded-xl bg-amber-600/70 text-white font-black text-xs flex items-center justify-center mx-auto">
                          #3
                        </div>
                      ) : (
                        <span className="font-bold text-[#8E8EA0]">#{index + 1}</span>
                      )}
                    </td>

                    {/* Candidate */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.candidateAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={app.candidateName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-[#191C1D] text-xs flex items-center gap-1.5">
                            <span>{app.candidateName}</span>
                            {isFirst && (
                              <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                                Top Pick
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#737380]">{app.candidateEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* ATS Score */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-[#3525CD] rounded-lg font-bold">
                        {app.scores.atsScore}%
                      </span>
                    </td>

                    {/* Interview Score */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-[#712AE2] rounded-lg font-bold">
                        {app.scores.interviewScore}%
                      </span>
                    </td>

                    {/* Test Score */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold">
                        {app.scores.codingScore}%
                      </span>
                    </td>

                    {/* Behavioral Score */}
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold">
                        {app.scores.behavioralScore}%
                      </span>
                    </td>

                    {/* Prominent Purple/Indigo Composite Final Score */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#3525CD] to-[#712AE2] text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/25">
                          {app.scores.overallScore}
                        </div>
                        <span className="text-[10px] text-[#737380] font-semibold">
                          {app.scores.overallScore >= 85 ? 'Exceptional' : 'Strong'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Action: Full Profile */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onNavigate('candidate-details', app.candidateId)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-[#E5E7EB] text-[#3525CD] font-bold text-xs shadow-xs transition-colors"
                      >
                        Full Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
