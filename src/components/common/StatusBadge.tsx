import React from 'react';
import { Application } from '../../types';

interface StatusBadgeProps {
  status: Application['status'] | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (st: string) => {
    switch (st.toLowerCase()) {
      case 'offer':
      case 'hired':
      case 'passed':
      case 'strongly recommended':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'interviewed':
      case 'in progress':
      case 'recommended':
        return 'bg-[#E6F4F1] text-[#0F766E] border-[#B9DFD8]';
      case 'technical':
      case 'screening':
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'sourced':
      case 'applied':
      case 'scheduled':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'rejected':
      case 'failed':
      case 'not recommended':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'conditional':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStyle(status)}`}>
      {status}
    </span>
  );
};
