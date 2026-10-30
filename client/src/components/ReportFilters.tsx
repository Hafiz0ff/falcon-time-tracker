import React from 'react';
import type { Employee } from '../../../shared/types.ts';

export type PeriodPreset = 'today' | 'week' | 'month' | 'all' | 'custom';

interface ReportFiltersProps {
  employees: Employee[];
  selectedEmployeeId: number | null;
  onSelectEmployee: (id: number | null) => void;
  activePreset: PeriodPreset;
  onSelectPreset: (preset: PeriodPreset) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  activePreset,
  onSelectPreset,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const presets: { id: PeriodPreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: '7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Presets Segmented Control */}
        <div className="inline-flex p-1 bg-zinc-100 rounded-lg space-x-1">
          {presets.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset.id)}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Employee Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 font-medium">Member:</span>
          <select
            value={selectedEmployeeId ?? 'all'}
            onChange={(e) => {
              const val = e.target.value === 'all' ? null : Number(e.target.value);
              onSelectEmployee(val);
            }}
            className="pl-2.5 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
          >
            <option value="all">All team members ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activePreset === 'custom' && (
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-zinc-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
