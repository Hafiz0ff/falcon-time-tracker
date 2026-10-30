import React, { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import type { ActiveTimer } from '../../../shared/types.ts';
import { formatSecondsToClock } from '../utils/format.ts';

interface ActiveTimersListProps {
  activeTimers: ActiveTimer[];
  onStop: (employeeId: number, timerId?: number) => Promise<void>;
  onSelectEmployee: (employeeId: number) => void;
}

export const ActiveTimersList: React.FC<ActiveTimersListProps> = ({
  activeTimers,
  onStop,
  onSelectEmployee,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (activeTimers.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeTimers.length]);

  if (activeTimers.length === 0) return null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center space-x-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
          Currently Tracking ({activeTimers.length})
        </h2>
      </div>

      <div className="divide-y divide-zinc-100">
        {activeTimers.map((timer) => {
          const startMs = new Date(timer.startTime).getTime();
          const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));

          return (
            <div
              key={timer.id}
              className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onSelectEmployee(timer.employeeId)}
                    className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
                  >
                    {timer.employeeName}
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    {timer.employeeRole}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 truncate mt-0.5">
                  {timer.taskDescription}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0">
                <span className="font-mono text-xs font-semibold text-zinc-900 tabular-nums">
                  {formatSecondsToClock(elapsedSec)}
                </span>

                <button
                  type="button"
                  onClick={() => onStop(timer.employeeId, timer.id)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                >
                  <Square className="w-3 h-3 fill-zinc-700" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
