import React from 'react';

interface CircularScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercentageSign?: boolean;
}

export const CircularScore: React.FC<CircularScoreProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  showPercentageSign = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EEF2FF"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3525CD" />
              <stop offset="100%" stopColor="#712AE2" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[#191C1D] tracking-tight">
            {score}{showPercentageSign && '%'}
          </span>
          {label && <span className="text-[10px] font-bold text-[#737380] uppercase tracking-wider">{label}</span>}
        </div>
      </div>

      {sublabel && (
        <span className="mt-2 text-xs font-medium text-[#464555]">{sublabel}</span>
      )}
    </div>
  );
};
