import React from 'react';

interface ScoreCardProps {
  label: string;
  score: number;
  maxScore?: number;
  weightLabel?: string;
  icon?: React.ReactNode;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  label,
  score,
  maxScore = 100,
  weightLabel,
  icon
}) => {
  const percentage = Math.min(100, Math.round((score / maxScore) * 100));

  const getBarColor = (pct: number) => {
    if (pct >= 85) return 'from-[#3525CD] to-[#712AE2]';
    if (pct >= 70) return 'from-indigo-500 to-indigo-600';
    if (pct >= 50) return 'from-amber-500 to-amber-600';
    return 'from-rose-500 to-rose-600';
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-bold text-[#737380] uppercase tracking-wider">{label}</span>
        </div>
        {weightLabel && (
          <span className="text-[11px] text-[#8E8EA0] font-medium">{weightLabel}</span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-extrabold text-[#191C1D]">{score}</span>
        <span className="text-xs font-semibold text-[#737380]">/{maxScore}</span>
      </div>

      {/* Progress line */}
      <div className="w-full bg-[#F3F4F6] h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor(percentage)} transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
