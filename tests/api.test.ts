import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { TimeTrackerDB } from '../server/db.ts';

test('Falcon Time Tracker Core Scenarios & Persistence Suite', async (t) => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-timetracker.db');
  
  // Clean up any existing test db
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  let db = new TimeTrackerDB(testDbPath);

  await t.test('1. Adding employees', () => {
    const emp1 = db.createEmployee('Alex Smith', 'Frontend Developer');
    const emp2 = db.createEmployee('Maria Sokolova', 'UI/UX Designer');

    assert.strictEqual(emp1.name, 'Alex Smith');
    assert.strictEqual(emp1.role, 'Frontend Developer');
    assert.strictEqual(emp2.name, 'Maria Sokolova');

    const all = db.getAllEmployees();
    assert.strictEqual(all.length, 2);
  });

  await t.test('2. Validation: cannot add employee with empty fields', () => {
    assert.throws(() => {
      db.createEmployee('', 'Developer');
    }, /cannot be empty/i);

    assert.throws(() => {
      db.createEmployee('John', '   ');
    }, /cannot be empty/i);
  });

  await t.test('3. Starting a timer with task description', () => {
    const employees = db.getAllEmployees();
    const emp = employees[0];

    const activeTimer = db.startTimer(emp.id, 'Dashboard layout and wireframing');
    assert.ok(activeTimer.id > 0);
    assert.strictEqual(activeTimer.employeeId, emp.id);
    assert.strictEqual(activeTimer.taskDescription, 'Dashboard layout and wireframing');
    assert.ok(activeTimer.startTime);

    const activeList = db.getActiveTimers();
    assert.strictEqual(activeList.length, 1);
    assert.strictEqual(activeList[0].taskDescription, 'Dashboard layout and wireframing');
  });

  await t.test('4. Scenario Check: Duplicate timer launch for same employee MUST fail', () => {
    const employees = db.getAllEmployees();
    const emp = employees[0];

    // Attempting to start another timer while one is already running
    assert.throws(
      () => {
        db.startTimer(emp.id, 'Second parallel task attempt');
      },
      (err: any) => {
        assert.strictEqual(err.code, 'TIMER_ALREADY_ACTIVE');
        assert.match(err.message, /already running/i);
        return true;
      }
    );

    // Active timers count remains 1
    const activeList = db.getActiveTimers();
    assert.strictEqual(activeList.length, 1);
  });

  await t.test('5. Stopping the active timer', async () => {
    const employees = db.getAllEmployees();
    const emp = employees[0];

    // Wait 1.1s for duration >= 1
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const stoppedEntry = db.stopTimer(emp.id);
    assert.ok(stoppedEntry.endTime);
    assert.ok(stoppedEntry.durationSeconds !== null && stoppedEntry.durationSeconds >= 1);

    // Active timers count should now be 0
    const activeList = db.getActiveTimers();
    assert.strictEqual(activeList.length, 0);
  });

  await t.test('6. Stopping when no timer is active throws appropriate error', () => {
    const employees = db.getAllEmployees();
    const emp = employees[0];

    assert.throws(() => {
      db.stopTimer(emp.id);
    }, /no active timer/i);
  });

  await t.test('7. Scenario Check: Empty report for a date period with no records', () => {
    const emptyReport = db.getReport({
      startDate: '2099-01-01',
      endDate: '2099-01-31',
    });

    assert.strictEqual(emptyReport.totalSeconds, 0);
    assert.strictEqual(emptyReport.totalEntries, 0);
    assert.strictEqual(emptyReport.formattedTotal, '0m');
    assert.strictEqual(emptyReport.activeEmployeesCount, 0);
    assert.strictEqual(emptyReport.employeeSummaries.length, 0);
    assert.strictEqual(emptyReport.entries.length, 0);
  });

  await t.test('8. Report with records for current period', () => {
    const today = new Date().toISOString().slice(0, 10);
    const report = db.getReport({
      startDate: today,
      endDate: today,
    });

    assert.ok(report.totalSeconds >= 1);
    assert.strictEqual(report.totalEntries, 1);
    assert.strictEqual(report.activeEmployeesCount, 1);
    assert.strictEqual(report.employeeSummaries.length, 1);
    assert.strictEqual(report.employeeSummaries[0].entriesCount, 1);
  });

  await t.test('9. Scenario Check: Data Persistence across application restart', () => {
    db.close();

    // Re-instantiate DB pointing to the same file
    const reloadedDb = new TimeTrackerDB(testDbPath);

    const employees = reloadedDb.getAllEmployees();
    assert.strictEqual(employees.length, 2);

    const today = new Date().toISOString().slice(0, 10);
    const report = reloadedDb.getReport({ startDate: today, endDate: today });
    assert.strictEqual(report.totalEntries, 1);
    assert.strictEqual(report.entries[0].taskDescription, 'Dashboard layout and wireframing');

    // Start a timer, shutdown again, verify active timer persists across reboots
    const runningTimer = reloadedDb.startTimer(employees[1].id, 'Mobile responsiveness');
    reloadedDb.close();

    const thirdDb = new TimeTrackerDB(testDbPath);
    const activeTimers = thirdDb.getActiveTimers();
    assert.strictEqual(activeTimers.length, 1);
    assert.strictEqual(activeTimers[0].taskDescription, 'Mobile responsiveness');
    assert.strictEqual(activeTimers[0].startTime, runningTimer.startTime);

    thirdDb.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });
});
