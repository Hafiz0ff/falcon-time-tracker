import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { TimeTrackerDB } from './db.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new TimeTrackerDB();

// ---------------- AUTOMATIC DEMO DATA SEEDING (ENGLISH) ----------------
export function ensureDemoData() {
  const existing = db.getAllEmployees();
  if (existing.length === 0) {
    console.log('[AutoSeed] Populating database with realistic demo data...');
    const emp1 = db.createEmployee('Alex Smith', 'Lead Backend Engineer');
    const emp2 = db.createEmployee('Maria Sokolova', 'Product Designer');
    const emp3 = db.createEmployee('David Vance', 'Frontend Developer');
    const emp4 = db.createEmployee('Anna Morris', 'QA Automation Engineer');

    const now = new Date();
    const getPastDate = (daysAgo: number, hours: number, minutes: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const seedEntries = [
      // Today
      {
        empId: emp1.id,
        task: 'Optimize SQLite indexing and report aggregations',
        start: getPastDate(0, 9, 30),
        end: getPastDate(0, 12, 15),
      },
      {
        empId: emp3.id,
        task: 'Redesign tracker interface following Linear & Toggl design',
        start: getPastDate(0, 10, 0),
        end: getPastDate(0, 13, 0),
      },
      {
        empId: emp2.id,
        task: 'Design system typography and table token definitions',
        start: getPastDate(0, 11, 0),
        end: getPastDate(0, 12, 45),
      },
      // Yesterday
      {
        empId: emp1.id,
        task: 'Validate duplicate timer prevention and return 409 Conflict',
        start: getPastDate(1, 14, 0),
        end: getPastDate(1, 17, 30),
      },
      {
        empId: emp4.id,
        task: 'End-to-end test suite for empty report and reboot persistence',
        start: getPastDate(1, 11, 30),
        end: getPastDate(1, 15, 0),
      },
      {
        empId: emp3.id,
        task: 'Implement live ticking monospace clock in top tracker bar',
        start: getPastDate(1, 15, 30),
        end: getPastDate(1, 18, 45),
      },
      // 2 days ago
      {
        empId: emp2.id,
        task: 'UI audit and cleanup of generic AI styling templates',
        start: getPastDate(2, 10, 0),
        end: getPastDate(2, 14, 0),
      },
      {
        empId: emp1.id,
        task: 'Schema architecture with SQLite partial unique index',
        start: getPastDate(2, 12, 0),
        end: getPastDate(2, 16, 20),
      },
      {
        empId: emp4.id,
        task: 'Verify edge cases of UTC date range queries',
        start: getPastDate(2, 15, 0),
        end: getPastDate(2, 18, 0),
      },
    ];

    for (const item of seedEntries) {
      const duration = Math.round((item.end.getTime() - item.start.getTime()) / 1000);
      db.db.prepare(`
        INSERT INTO time_entries (employee_id, task_description, start_time, end_time, duration_seconds)
        VALUES (?, ?, ?, ?, ?)
      `).run(item.empId, item.task, item.start.toISOString(), item.end.toISOString(), duration);
    }

    db.startTimer(emp4.id, 'End-to-end browser scenario validation');
    console.log(`[AutoSeed] Added 4 members, ${seedEntries.length} records, and 1 active timer.`);
  }
}
ensureDemoData();

// ---------------- REST API ROUTES ----------------

// 1. Employees
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.getAllEmployees();
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching employees' });
  }
});

app.post('/api/employees', (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Employee name is required' });
    }
    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ error: 'Employee role is required' });
    }

    const newEmployee = db.createEmployee(name, role);
    res.status(201).json(newEmployee);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error creating employee' });
  }
});

// 2. Active Timers
app.get('/api/timers/active', (req, res) => {
  try {
    const activeTimers = db.getActiveTimers();
    res.json(activeTimers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching active timers' });
  }
});

app.get('/api/timers/active/:employeeId', (req, res) => {
  try {
    const empId = Number(req.params.employeeId);
    if (isNaN(empId)) {
      return res.status(400).json({ error: 'Invalid employee ID' });
    }
    const timer = db.getActiveTimerForEmployee(empId);
    res.json(timer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching timer for employee' });
  }
});

// 3. Start Timer
app.post('/api/timers/start', (req, res) => {
  try {
    const { employeeId, taskDescription } = req.body;
    const empId = Number(employeeId);

    if (!empId || isNaN(empId)) {
      return res.status(400).json({ error: 'Please select an employee' });
    }

    if (!taskDescription || typeof taskDescription !== 'string' || !taskDescription.trim()) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    const activeTimer = db.startTimer(empId, taskDescription);
    res.status(201).json(activeTimer);
  } catch (error: any) {
    if (error.code === 'TIMER_ALREADY_ACTIVE') {
      return res.status(409).json({
        error: 'TIMER_ALREADY_ACTIVE',
        message: error.message,
        activeTimer: error.activeTimer || null,
      });
    }
    res.status(400).json({ error: error.message || 'Error starting timer' });
  }
});

// 4. Stop Timer
app.post('/api/timers/stop', (req, res) => {
  try {
    const { employeeId, timerId } = req.body;
    const empId = Number(employeeId);
    const tId = timerId ? Number(timerId) : undefined;

    if (!empId && !tId) {
      return res.status(400).json({ error: 'Please provide employeeId or timerId' });
    }

    const stoppedEntry = db.stopTimer(empId, tId);
    res.json(stoppedEntry);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error stopping timer' });
  }
});

// 5. Reports & Time Entries
app.get('/api/reports', (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const empId = employeeId && employeeId !== 'all' ? Number(employeeId) : null;
    const start = startDate ? String(startDate) : null;
    const end = endDate ? String(endDate) : null;

    const report = db.getReport({
      employeeId: empId,
      startDate: start,
      endDate: end,
    });

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error generating period report' });
  }
});

// 6. Delete Entry
app.delete('/api/entries/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }
    const success = db.deleteEntry(id);
    if (!success) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error deleting entry' });
  }
});

// ---------------- FRONTEND SERVING (SINGLE PROCESS) ----------------
async function startApp() {
  const isDev = process.env.NODE_ENV !== 'production';
  const clientDist = path.join(process.cwd(), 'dist', 'client');

  if (isDev && !process.env.SERVE_STATIC) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: 'client',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Falcon Time Tracker] Server running on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});

export { app, db };
