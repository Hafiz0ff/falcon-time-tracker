import React from 'react';
import { Trash2 } from 'lucide-react';
import type { TimeEntry } from '../../../shared/types.ts';
import { formatDateGroup, formatTimeRange, formatDurationHuman } from '../utils/format.ts';

interface EntriesListProps {
  entries: TimeEntry[];
  onDeleteEntry: (id: number) => Promise<void>;
  onResetFilters: () => void;
  isLoading: boolean;
}

export const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  onDeleteEntry,
  onResetFilters,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
          <div className="h-10 bg-zinc-50 rounded-lg"></div>
          <div className="h-10 bg-zinc-50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-8 sm:p-12 text-center shadow-xs">
        <h3 className="text-sm font-semibold text-zinc-900">
          No entries found for the selected period
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
          No time records were logged in this date range. Try selecting different filters or start a timer.
        </p>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
        >
          Reset to All Time
        </button>
      </div>
    );
  }

  const groupedByDate: { [dateStr: string]: { entries: TimeEntry[]; subtotalSeconds: number } } = {};

  for (const entry of entries) {
    const dateKey = entry.startTime.slice(0, 10);
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = { entries: [], subtotalSeconds: 0 };
    }
    groupedByDate[dateKey].entries.push(entry);
    groupedByDate[dateKey].subtotalSeconds += entry.durationSeconds || 0;
  }

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {sortedDateKeys.map((dateKey) => {
        const group = groupedByDate[dateKey];
        const dateTitle = formatDateGroup(group.entries[0].startTime);
        const subtotalText = formatDurationHuman(group.subtotalSeconds);

        return (
          <div key={dateKey} className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
            {/* Date Group Header */}
            <div className="bg-zinc-50/70 px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">
                {dateTitle}
              </span>
              <span className="text-xs font-mono font-medium text-zinc-500">
                Total: {subtotalText}
              </span>
            </div>

            {/* Entries in this day */}
            <div className="divide-y divide-zinc-100">
              {group.entries.map((entry) => {
                return (
                  <div
                    key={entry.id}
                    className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 transition-colors group"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-900 leading-snug">
                        {entry.taskDescription}
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                        <span className="text-zinc-600 font-medium">{entry.employeeName}</span>
                        <span>•</span>
                        <span>{entry.employeeRole}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
                      <span className="font-mono text-xs text-zinc-400 tabular-nums">
                        {formatTimeRange(entry.startTime, entry.endTime)}
                      </span>

                      <span className="font-mono text-xs font-semibold text-zinc-900 tabular-nums w-16 text-right">
                        {formatDurationHuman(entry.durationSeconds || 0)}
                      </span>

                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        title="Delete entry"
                        className="text-zinc-300 hover:text-zinc-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
