import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'purple' | 'emerald' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  accentColor = 'indigo'
}) => {
  const iconColorStyles = {
    indigo: 'text-[#3525CD] bg-indigo-50 border-indigo-100/80',
    purple: 'text-[#712AE2] bg-purple-50 border-purple-100/80',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/80',
    amber: 'text-amber-600 bg-amber-50 border-amber-100/80'
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)] hover:shadow-[0_10px_30px_-5px_rgba(79,70,229,0.08)] transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#737380] uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${iconColorStyles[accentColor]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-[#191C1D] tracking-tight">{value}</h3>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
          }`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-[#737380] font-normal leading-relaxed">{subtext}</p>
      )}
    </div>
  );
};
