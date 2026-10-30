import { TimeTrackerDB } from './db.ts';

const db = new TimeTrackerDB();

console.log('[Seed] Populating database with demo data...');

const existing = db.getAllEmployees();
if (existing.length === 0) {
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
    const stmt = db.db.prepare(`
      INSERT INTO time_entries (employee_id, task_description, start_time, end_time, duration_seconds)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(item.empId, item.task, item.start.toISOString(), item.end.toISOString(), duration);
  }

  db.startTimer(emp4.id, 'End-to-end browser scenario validation');
  console.log(`[Seed] Added 4 members, ${seedEntries.length} records, and 1 active timer.`);
} else {
  console.log(`[Seed] Database already has ${existing.length} members. Skipped.`);
}

db.close();
