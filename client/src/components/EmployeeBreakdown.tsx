import React from 'react';
import type { EmployeeSummary } from '../../../shared/types.ts';

interface EmployeeBreakdownProps {
  summaries: EmployeeSummary[];
  onSelectEmployee: (id: number) => void;
  isLoading: boolean;
}

export const EmployeeBreakdown: React.FC<EmployeeBreakdownProps> = ({
  summaries,
  onSelectEmployee,
  isLoading,
}) => {
  if (isLoading || summaries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
          Team Breakdown
        </h2>
        <span className="text-xs text-zinc-400">
          Total tracked time in period
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50/50">
              <th className="py-2.5 px-4 font-medium">Team Member</th>
              <th className="py-2.5 px-4 font-medium hidden sm:table-cell">Role</th>
              <th className="py-2.5 px-4 font-medium text-center">Tasks</th>
              <th className="py-2.5 px-4 font-medium text-right">Tracked</th>
              <th className="py-2.5 px-4 font-medium text-right w-32">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs">
            {summaries.map((emp) => {
              const initials = emp.employeeName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr
                  key={emp.employeeId}
                  onClick={() => onSelectEmployee(emp.employeeId)}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 font-medium text-[11px] flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-zinc-900">
                        {emp.employeeName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 hidden sm:table-cell">
                    {emp.employeeRole}
                  </td>
                  <td className="py-3 px-4 text-center text-zinc-600">
                    {emp.entriesCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-zinc-900">
                    {emp.formattedTotal}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-[11px] font-mono text-zinc-500 w-8 text-right">
                        {emp.percentageOfTotal}%
                      </span>
                      <div className="w-16 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-zinc-900 h-1.5 rounded-full"
                          style={{ width: `${Math.max(4, emp.percentageOfTotal)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
