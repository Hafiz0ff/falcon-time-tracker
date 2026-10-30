export interface Employee {
  id: number;
  name: string;
  role: string;
  createdAt: string;
}

export interface TimeEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  taskDescription: string;
  startTime: string; // ISO 8601 UTC
  endTime: string | null; // ISO 8601 UTC or null if running
  durationSeconds: number | null; // null if running
  createdAt: string;
}

export interface ActiveTimer {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  taskDescription: string;
  startTime: string;
}

export interface EmployeeSummary {
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  totalSeconds: number;
  formattedTotal: string;
  entriesCount: number;
  percentageOfTotal: number;
}

export interface PeriodReport {
  startDate: string | null;
  endDate: string | null;
  employeeId: number | null;
  totalSeconds: number;
  formattedTotal: string;
  totalEntries: number;
  activeEmployeesCount: number;
  employeeSummaries: EmployeeSummary[];
  entries: TimeEntry[];
}
