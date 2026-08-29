import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  PieChart as PieIcon,
  Download,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { CircularScore } from '../../components/common/CircularScore';

export const AnalyticsPage: React.FC = () => {
  const scoreDistribution = [
    { range: '90-100%', count: 18, label: 'Top Tier' },
    { range: '80-89%', count: 46, label: 'Strong' },
    { range: '70-79%', count: 52, label: 'Qualified' },
    { range: '60-69%', count: 28, label: 'Review' },
    { range: '<60%', count: 12, label: 'Unmatched' }
  ];

  const skillDemandData = [
    { name: 'PyTorch / AI', value: 42, color: '#3525CD' },
    { name: 'TypeScript / React', value: 28, color: '#712AE2' },
    { name: 'Distributed Systems', value: 18, color: '#10B981' },
    { name: 'MLOps & Cloud', value: 12, color: '#F59E0B' }
  ];

  const funnelData = [
    { stage: 'Sourced', candidates: 156 },
    { stage: 'ATS Screened', candidates: 94 },
    { stage: 'AI Interview', candidates: 42 },
    { stage: 'Coding Challenge', candidates: 28 },
    { stage: 'Offer Made', candidates: 6 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">Recruitment Intelligence & Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#3525CD] border border-indigo-100">
              Live Insights
            </span>
          </div>
          <p className="mt-1 text-sm text-[#464555]">
            Comprehensive pipeline metrics, automated scoring distributions, and bias mitigation audits.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-white border border-[#E5E7EB] hover:border-indigo-200 text-[#191C1D] text-xs font-bold rounded-xl shadow-xs hover:bg-[#F8F9FA] transition-all flex items-center gap-1.5 self-start"
        >
          <Download className="w-3.5 h-3.5 text-[#3525CD]" />
          <span>Export Analytics PDF</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Avg Time to Hire"
          value="9.2 Days"
          icon={Clock}
          accentColor="indigo"
          subtext="Industry benchmark: 34 days"
          trend={{ value: '73% Faster', isPositive: true }}
        />
        <StatCard
          label="AI Assessment Rate"
          value="94.6%"
          icon={Sparkles}
          accentColor="purple"
          subtext="Autonomous completions"
          trend={{ value: '+4.2% MoM', isPositive: true }}
        />
        <StatCard
          label="Candidate Offer Acceptance"
          value="88.2%"
          icon={TrendingUp}
          accentColor="emerald"
          subtext="High candidate satisfaction"
          trend={{ value: '+8% vs benchmark', isPositive: true }}
        />
        <StatCard
          label="Fairness & Parity Index"
          value="99.4%"
          icon={ShieldCheck}
          accentColor="amber"
          subtext="Audited zero demographic skew"
          trend={{ value: 'Fairness Passed', isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Distribution Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-base font-bold text-[#191C1D]">Composite Score Distribution</h3>
              <p className="text-xs text-[#737380]">Candidate volume across multi-modal assessment bands</p>
            </div>
            <span className="text-xs font-bold text-[#3525CD] bg-indigo-50 px-2.5 py-1 rounded-full">
              Normal Bell Distribution
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#737380' }} />
                <YAxis tick={{ fontSize: 11, fill: '#737380' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3525CD" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Composition Donut */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] space-y-4">
          <div className="pb-3 border-b border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#191C1D]">In-Demand Competencies</h3>
            <p className="text-xs text-[#737380]">Most screened technical capabilities</p>
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skillDemandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {skillDemandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2">
            {skillDemandData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#464555] font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-[#191C1D]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
