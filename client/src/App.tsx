import React, { useState, useEffect, useCallback } from 'react';
import type { Employee, ActiveTimer, PeriodReport } from '../../shared/types.ts';
import { api, ApiError } from './api.ts';
import { Header } from './components/Header.tsx';
import { TimerBar } from './components/TimerBar.tsx';
import { ActiveTimersList } from './components/ActiveTimersList.tsx';
import { ReportFilters, PeriodPreset } from './components/ReportFilters.tsx';
import { ReportSummary } from './components/ReportSummary.tsx';
import { EmployeeBreakdown } from './components/EmployeeBreakdown.tsx';
import { EntriesList } from './components/EntriesList.tsx';
import { AddEmployeeModal } from './components/AddEmployeeModal.tsx';
import { AlertModal } from './components/AlertModal.tsx';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [report, setReport] = useState<PeriodReport | null>(null);

  const [timerEmployeeId, setTimerEmployeeId] = useState<number | null>(null);

  const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<PeriodPreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
  } | null>(null);

  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);

  const applyPreset = useCallback((preset: PeriodPreset) => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const pastWeek = new Date(now);
      pastWeek.setDate(now.getDate() - 7);
      setStartDate(formatYMD(pastWeek));
      setEndDate(formatYMD(now));
    } else if (preset === 'month') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatYMD(firstOfMonth));
      setEndDate(formatYMD(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await api.getEmployees();
      setEmployees(data);
      if (data.length > 0 && !timerEmployeeId) {
        setTimerEmployeeId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadActiveTimers = async () => {
    try {
      const data = await api.getActiveTimers();
      setActiveTimers(data);
    } catch (err: any) {
      console.error('Failed to load active timers:', err);
    }
  };

  const loadReport = useCallback(async () => {
    try {
      setIsLoadingReport(true);
      const data = await api.getReport({
        employeeId: filterEmployeeId,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setReport(data);
    } catch (err: any) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoadingReport(false);
    }
  }, [filterEmployeeId, startDate, endDate]);

  useEffect(() => {
    loadEmployees();
    loadActiveTimers();
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleStartTimer = async (employeeId: number, taskDescription: string) => {
    try {
      await api.startTimer(employeeId, taskDescription);
      await loadActiveTimers();
      await loadReport();
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'TIMER_ALREADY_ACTIVE') {
        const emp = employees.find((e) => e.id === employeeId);
        setAlertInfo({
          title: 'Timer Already Active',
          message:
            err.message ||
            `A timer is already running for "${emp?.name}". Please stop it before starting a new one.`,
        });
      } else {
        setAlertInfo({
          title: 'Error',
          message: err.message || 'Could not start timer',
        });
      }
      throw err;
    }
  };

  const handleStopTimer = async (employeeId: number, timerId?: number) => {
    try {
      await api.stopTimer(employeeId, timerId);
      await loadActiveTimers();
      await loadReport();
    } catch (err: any) {
      setAlertInfo({
        title: 'Error',
        message: err.message || 'Could not stop timer',
      });
      throw err;
    }
  };

  const handleAddEmployee = async (name: string, role: string) => {
    const newEmp = await api.createEmployee(name, role);
    await loadEmployees();
    setTimerEmployeeId(newEmp.id);
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await api.deleteEntry(id);
      await loadReport();
    } catch (err: any) {
      setAlertInfo({
        title: 'Error',
        message: err.message || 'Could not delete entry',
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col font-sans">
      <Header onOpenAddEmployee={() => setIsAddEmployeeOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* 1. Timer Bar */}
        <TimerBar
          employees={employees}
          activeTimers={activeTimers}
          onStart={handleStartTimer}
          onStop={handleStopTimer}
          onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
          selectedEmployeeId={timerEmployeeId}
          onSelectEmployee={(id) => setTimerEmployeeId(id)}
        />

        {/* 2. Active Timers (if any) */}
        <ActiveTimersList
          activeTimers={activeTimers}
          onStop={handleStopTimer}
          onSelectEmployee={(id) => setTimerEmployeeId(id)}
        />

        {/* 3. Filters */}
        <ReportFilters
          employees={employees}
          selectedEmployeeId={filterEmployeeId}
          onSelectEmployee={(id) => setFilterEmployeeId(id)}
          activePreset={activePreset}
          onSelectPreset={(p) => applyPreset(p)}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(d) => {
            setActivePreset('custom');
            setStartDate(d);
          }}
          onEndDateChange={(d) => {
            setActivePreset('custom');
            setEndDate(d);
          }}
        />

        {/* 4. Metric Cards */}
        <ReportSummary report={report} isLoading={isLoadingReport} />

        {/* 5. Employee Breakdown Table */}
        {report && report.employeeSummaries.length > 0 && (
          <EmployeeBreakdown
            summaries={report.employeeSummaries}
            onSelectEmployee={(id) => setFilterEmployeeId(id)}
            isLoading={isLoadingReport}
          />
        )}

        {/* 6. Timeline */}
        <EntriesList
          entries={report?.entries || []}
          onDeleteEntry={handleDeleteEntry}
          onResetFilters={() => applyPreset('all')}
          isLoading={isLoadingReport}
        />
      </main>

      <footer className="border-t border-zinc-200/80 bg-white py-3 text-center text-xs text-zinc-400">
        Falcon Time Tracker • Clean SQLite Persistence
      </footer>

      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onAddEmployee={handleAddEmployee}
      />

      <AlertModal
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.title || ''}
        message={alertInfo?.message || ''}
        onConfirm={alertInfo?.onConfirm}
        confirmText={alertInfo?.confirmText}
      />
    </div>
  );
}
