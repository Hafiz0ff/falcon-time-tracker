import type { Employee, ActiveTimer, TimeEntry, PeriodReport } from '../../shared/types.ts';

const API_BASE = '/api';

export class ApiError extends Error {
  public code?: string;
  public activeTimer?: ActiveTimer | null;
  public status: number;

  constructor(message: string, status: number, code?: string, activeTimer?: ActiveTimer | null) {
    super(message);
    this.status = status;
    this.code = code;
    this.activeTimer = activeTimer;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error || data?.message || 'An error occurred while processing the request',
      res.status,
      data?.error,
      data?.activeTimer
    );
  }

  return data as T;
}

export const api = {
  getEmployees: () => request<Employee[]>('/employees'),
  
  createEmployee: (name: string, role: string) =>
    request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify({ name, role }),
    }),

  getActiveTimers: () => request<ActiveTimer[]>('/timers/active'),

  startTimer: (employeeId: number, taskDescription: string) =>
    request<ActiveTimer>('/timers/start', {
      method: 'POST',
      body: JSON.stringify({ employeeId, taskDescription }),
    }),

  stopTimer: (employeeId: number, timerId?: number) =>
    request<TimeEntry>('/timers/stop', {
      method: 'POST',
      body: JSON.stringify({ employeeId, timerId }),
    }),

  getReport: (params: {
    employeeId?: number | null;
    startDate?: string | null;
    endDate?: string | null;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.employeeId) searchParams.set('employeeId', String(params.employeeId));
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    
    const qs = searchParams.toString();
    return request<PeriodReport>(`/reports${qs ? `?${qs}` : ''}`);
  },

  deleteEntry: (id: number) =>
    request<{ success: boolean }>(`/entries/${id}`, {
      method: 'DELETE',
    }),
};
