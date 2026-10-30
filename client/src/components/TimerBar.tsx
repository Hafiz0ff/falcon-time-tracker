import React, { useState, useEffect } from 'react';
import { Play, Square, User } from 'lucide-react';
import type { Employee, ActiveTimer } from '../../../shared/types.ts';
import { formatSecondsToClock } from '../utils/format.ts';

interface TimerBarProps {
  employees: Employee[];
  activeTimers: ActiveTimer[];
  onStart: (employeeId: number, taskDescription: string) => Promise<void>;
  onStop: (employeeId: number, timerId?: number) => Promise<void>;
  onOpenAddEmployee: () => void;
  selectedEmployeeId: number | null;
  onSelectEmployee: (id: number | null) => void;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  employees,
  activeTimers,
  onStart,
  onStop,
  onOpenAddEmployee,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentActiveTimer = activeTimers.find(
    (t) => t.employeeId === selectedEmployeeId
  );

  useEffect(() => {
    if (!currentActiveTimer) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      const startMs = new Date(currentActiveTimer.startTime).getTime();
      const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [currentActiveTimer]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!selectedEmployeeId) {
      setErrorMessage('Please select a team member');
      return;
    }

    if (currentActiveTimer) {
      try {
        setIsSubmitting(true);
        await onStop(selectedEmployeeId, currentActiveTimer.id);
        setTaskDescription('');
      } catch (err: any) {
        setErrorMessage(err.message || 'Error stopping timer');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!taskDescription.trim()) {
        setErrorMessage('Please enter a task description');
        return;
      }

      try {
        setIsSubmitting(true);
        await onStart(selectedEmployeeId, taskDescription.trim());
      } catch (err: any) {
        setErrorMessage(err.message || 'Error starting timer');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-3 sm:p-4">
      {errorMessage && (
        <div className="mb-3 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs text-zinc-800">
          <span className="font-medium text-rose-600">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-600 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Task Input */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={currentActiveTimer ? currentActiveTimer.taskDescription : taskDescription}
            onChange={(e) => {
              if (!currentActiveTimer) {
                setTaskDescription(e.target.value);
                setErrorMessage(null);
              }
            }}
            readOnly={!!currentActiveTimer}
            placeholder={
              currentActiveTimer
                ? 'Task in progress...'
                : 'What are you working on?'
            }
            className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
              currentActiveTimer
                ? 'bg-zinc-50 border-zinc-200 text-zinc-900 font-medium'
                : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900'
            }`}
          />
        </div>

        {/* Employee Select */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="relative">
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onSelectEmployee(val);
                setErrorMessage(null);
              }}
              className="w-full pl-8 pr-7 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="" disabled>
                {employees.length === 0 ? 'No members available' : 'Select team member'}
              </option>
              {employees.map((emp) => {
                const hasActive = activeTimers.some((t) => t.employeeId === emp.id);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role}){hasActive ? ' — [running]' : ''}
                  </option>
                );
              })}
            </select>
            <User className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          {employees.length === 0 && (
            <button
              type="button"
              onClick={onOpenAddEmployee}
              className="mt-1 text-[11px] text-zinc-600 hover:text-zinc-900 underline"
            >
              Add team member
            </button>
          )}
        </div>

        {/* Live Timer & Action Button */}
        <div className="flex items-center justify-between md:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 flex-shrink-0">
          <div className="font-mono text-lg font-semibold tracking-tight text-zinc-900 tabular-nums px-2">
            {formatSecondsToClock(elapsedSeconds)}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || employees.length === 0}
            className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-2xs disabled:opacity-50 ${
              currentActiveTimer
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            {currentActiveTimer ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
