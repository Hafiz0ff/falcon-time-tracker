import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import type { Employee, TimeEntry, ActiveTimer, PeriodReport, EmployeeSummary } from '../shared/types.ts';

export class TimeTrackerDB {
  public db: DatabaseSync;

  constructor(dbPath?: string) {
    const finalPath = dbPath || path.join(process.cwd(), 'data', 'timetracker.db');
    
    // Ensure data directory exists if writing to file
    if (finalPath !== ':memory:') {
      const dir = path.dirname(finalPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new DatabaseSync(finalPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        task_description TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_seconds INTEGER,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        CONSTRAINT chk_time_order CHECK (end_time IS NULL OR end_time >= start_time)
      );

      -- Critical partial unique index: ensures an employee can have at most ONE active timer at any time
      CREATE UNIQUE INDEX IF NOT EXISTS idx_active_timer_per_employee 
      ON time_entries(employee_id) 
      WHERE end_time IS NULL;

      -- Indices for fast range queries and employee history
      CREATE INDEX IF NOT EXISTS idx_entries_range 
      ON time_entries(employee_id, start_time, end_time);

      CREATE INDEX IF NOT EXISTS idx_entries_dates 
      ON time_entries(start_time, end_time);
    `);
  }

  public getAllEmployees(): Employee[] {
    const stmt = this.db.prepare(`
      SELECT id, name, role, created_at AS createdAt 
      FROM employees 
      ORDER BY name ASC
    `);
    return stmt.all() as unknown as Employee[];
  }

  public getEmployeeById(id: number): Employee | null {
    const stmt = this.db.prepare(`
      SELECT id, name, role, created_at AS createdAt 
      FROM employees 
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return row ? (row as unknown as Employee) : null;
  }

  public createEmployee(name: string, role: string): Employee {
    const trimmedName = name.trim();
    const trimmedRole = role.trim();

    if (!trimmedName) {
      throw new Error('Employee name cannot be empty');
    }
    if (!trimmedRole) {
      throw new Error('Employee role cannot be empty');
    }

    const stmt = this.db.prepare(`
      INSERT INTO employees (name, role) 
      VALUES (?, ?)
    `);
    const result = stmt.run(trimmedName, trimmedRole);
    const newId = Number(result.lastInsertRowid);
    return this.getEmployeeById(newId)!;
  }

  public getActiveTimers(): ActiveTimer[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.id,
        t.employee_id AS employeeId,
        e.name AS employeeName,
        e.role AS employeeRole,
        t.task_description AS taskDescription,
        t.start_time AS startTime
      FROM time_entries t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.end_time IS NULL
      ORDER BY t.start_time DESC
    `);
    return stmt.all() as unknown as ActiveTimer[];
  }

  public getActiveTimerForEmployee(employeeId: number): ActiveTimer | null {
    const stmt = this.db.prepare(`
      SELECT 
        t.id,
        t.employee_id AS employeeId,
        e.name AS employeeName,
        e.role AS employeeRole,
        t.task_description AS taskDescription,
        t.start_time AS startTime
      FROM time_entries t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.employee_id = ? AND t.end_time IS NULL
      LIMIT 1
    `);
    const row = stmt.get(employeeId);
    return row ? (row as unknown as ActiveTimer) : null;
  }

  public startTimer(employeeId: number, taskDescription: string): ActiveTimer {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) {
      throw new Error(`Employee with ID ${employeeId} not found`);
    }

    const trimmedDesc = taskDescription.trim();
    if (!trimmedDesc) {
      throw new Error('Task description cannot be empty');
    }

    // 1. Explicit business check for active timer
    const existing = this.getActiveTimerForEmployee(employeeId);
    if (existing) {
      const err = new Error(
        `A timer is already running for "${emp.name}" on task "${existing.taskDescription}". Please stop it before starting a new one.`
      );
      (err as any).code = 'TIMER_ALREADY_ACTIVE';
      (err as any).activeTimer = existing;
      throw err;
    }

    const startTime = new Date().toISOString();

    try {
      const stmt = this.db.prepare(`
        INSERT INTO time_entries (employee_id, task_description, start_time)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(employeeId, trimmedDesc, startTime);
      const newId = Number(result.lastInsertRowid);

      return {
        id: newId,
        employeeId,
        employeeName: emp.name,
        employeeRole: emp.role,
        taskDescription: trimmedDesc,
        startTime,
      };
    } catch (dbError: any) {
      if (dbError.message?.includes('UNIQUE constraint failed')) {
        const err = new Error(`Employee "${emp.name}" already has an active timer`);
        (err as any).code = 'TIMER_ALREADY_ACTIVE';
        throw err;
      }
      throw dbError;
    }
  }

  public stopTimer(employeeId: number, timerId?: number): TimeEntry {
    let active: ActiveTimer | null = null;
    if (timerId) {
      const stmt = this.db.prepare(`
        SELECT 
          t.id,
          t.employee_id AS employeeId,
          e.name AS employeeName,
          e.role AS employeeRole,
          t.task_description AS taskDescription,
          t.start_time AS startTime
        FROM time_entries t
        JOIN employees e ON t.employee_id = e.id
        WHERE t.id = ? AND t.end_time IS NULL
      `);
      const row = stmt.get(timerId);
      if (row) active = row as unknown as ActiveTimer;
    } else {
      active = this.getActiveTimerForEmployee(employeeId);
    }

    if (!active) {
      throw new Error(`No active timer found to stop for employee ID ${employeeId}`);
    }

    const endTime = new Date().toISOString();
    const startMs = new Date(active.startTime).getTime();
    const endMs = new Date(endTime).getTime();
    const durationSeconds = Math.max(1, Math.round((endMs - startMs) / 1000));

    const updateStmt = this.db.prepare(`
      UPDATE time_entries 
      SET end_time = ?, duration_seconds = ?
      WHERE id = ? AND end_time IS NULL
    `);
    updateStmt.run(endTime, durationSeconds, active.id);

    return {
      id: active.id,
      employeeId: active.employeeId,
      employeeName: active.employeeName,
      employeeRole: active.employeeRole,
      taskDescription: active.taskDescription,
      startTime: active.startTime,
      endTime,
      durationSeconds,
      createdAt: active.startTime,
    };
  }

  public getReport(options: {
    employeeId?: number | null;
    startDate?: string | null;
    endDate?: string | null;
  }): PeriodReport {
    const { employeeId, startDate, endDate } = options;

    let query = `
      SELECT 
        t.id,
        t.employee_id AS employeeId,
        e.name AS employeeName,
        e.role AS employeeRole,
        t.task_description AS taskDescription,
        t.start_time AS startTime,
        t.end_time AS endTime,
        t.duration_seconds AS durationSeconds,
        t.created_at AS createdAt
      FROM time_entries t
      JOIN employees e ON t.employee_id = e.id
      WHERE t.end_time IS NOT NULL
    `;
    const params: any[] = [];

    if (employeeId) {
      query += ` AND t.employee_id = ?`;
      params.push(employeeId);
    }

    if (startDate) {
      query += ` AND date(t.start_time) >= date(?)`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date(t.start_time) <= date(?)`;
      params.push(endDate);
    }

    query += ` ORDER BY t.start_time DESC`;

    const stmt = this.db.prepare(query);
    const entries = (stmt.all(...params) as unknown as TimeEntry[]) || [];

    let totalSeconds = 0;
    const employeeMap = new Map<number, {
      employeeId: number;
      employeeName: string;
      employeeRole: string;
      totalSeconds: number;
      entriesCount: number;
    }>();

    for (const entry of entries) {
      const dur = entry.durationSeconds || 0;
      totalSeconds += dur;

      if (!employeeMap.has(entry.employeeId)) {
        employeeMap.set(entry.employeeId, {
          employeeId: entry.employeeId,
          employeeName: entry.employeeName,
          employeeRole: entry.employeeRole,
          totalSeconds: 0,
          entriesCount: 0,
        });
      }
      const agg = employeeMap.get(entry.employeeId)!;
      agg.totalSeconds += dur;
      agg.entriesCount += 1;
    }

    const employeeSummaries: EmployeeSummary[] = Array.from(employeeMap.values())
      .map((agg) => {
        const percentageOfTotal = totalSeconds > 0 
          ? Math.round((agg.totalSeconds / totalSeconds) * 100) 
          : 0;
        return {
          employeeId: agg.employeeId,
          employeeName: agg.employeeName,
          employeeRole: agg.employeeRole,
          totalSeconds: agg.totalSeconds,
          formattedTotal: formatDuration(agg.totalSeconds),
          entriesCount: agg.entriesCount,
          percentageOfTotal,
        };
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    return {
      startDate: startDate || null,
      endDate: endDate || null,
      employeeId: employeeId || null,
      totalSeconds,
      formattedTotal: formatDuration(totalSeconds),
      totalEntries: entries.length,
      activeEmployeesCount: employeeMap.size,
      employeeSummaries,
      entries,
    };
  }

  public deleteEntry(id: number): boolean {
    const stmt = this.db.prepare(`DELETE FROM time_entries WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  }

  public close() {
    this.db.close();
  }
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0 && minutes === 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}
