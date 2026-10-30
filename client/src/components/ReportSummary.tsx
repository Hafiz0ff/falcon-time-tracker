import React from 'react';
import type { PeriodReport } from '../../../shared/types.ts';

interface ReportSummaryProps {
  report: PeriodReport | null;
  isLoading: boolean;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({ report, isLoading }) => {
  const totalHours = report ? (report.totalSeconds / 3600).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Total Time */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Total Tracked Time
        </p>
        <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mt-1">
          {isLoading ? '...' : report?.formattedTotal || '0m'}
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          ≈ {totalHours}h logged
        </p>
      </div>

      {/* 2. Active Employees */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Active Members
        </p>
        <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mt-1">
          {isLoading ? '...' : report?.activeEmployeesCount ?? 0}
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          with tracked hours
        </p>
      </div>

      {/* 3. Completed Tasks */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Tasks Completed
        </p>
        <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight mt-1">
          {isLoading ? '...' : report?.totalEntries ?? 0}
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          logged entries
        </p>
      </div>
    </div>
  );
};
