import React from 'react';

interface ProgressBarProps {
  label?: string;
  percentage: number;
  valueLabel?: string;
  color?: 'indigo' | 'purple' | 'emerald' | 'gradient';
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percentage,
  valueLabel,
  color = 'gradient',
  height = 'md'
}) => {
  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorStyles = {
    indigo: 'bg-[#3525CD]',
    purple: 'bg-[#712AE2]',
    emerald: 'bg-emerald-600',
    gradient: 'bg-[#0F766E]'
  };

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          {label && <span className="font-semibold text-[#464555]">{label}</span>}
          <span className="font-bold text-[#191C1D]">{valueLabel || `${percentage}%`}</span>
        </div>
      )}
      <div className={`w-full bg-[#EEF2FF] rounded-full overflow-hidden ${heightStyles[height]}`}>
        <div
          className={`${heightStyles[height]} rounded-full ${colorStyles[color]} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};
