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
        return 'bg-indigo-50 text-[#3525CD] border-indigo-200';
      case 'technical':
      case 'screening':
      case 'active':
        return 'bg-purple-50 text-[#712AE2] border-purple-200';
      case 'sourced':
      case 'applied':
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
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
