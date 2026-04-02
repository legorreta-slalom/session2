const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const {
  normalizeDueDate,
  normalizePriority,
  toTaskResponse,
} = require('./task-utils');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    priority INTEGER NOT NULL DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

const insertTaskStmt = db.prepare(
  'INSERT INTO tasks (title, due_date, priority) VALUES (?, ?, ?)'
);
const getTaskByIdStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');

// Insert some initial data
[
  { title: 'Create first task', dueDate: null, priority: 3 },
  { title: 'Plan sprint demo', dueDate: null, priority: 2 },
  { title: 'Check production alerts', dueDate: null, priority: 1 },
].forEach(task => {
  insertTaskStmt.run(task.title, task.dueDate, task.priority);
});

console.log('In-memory database initialized with sample data');

const listTasksStmt = db.prepare(`
  SELECT *
  FROM tasks
  ORDER BY
    CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
    due_date ASC,
    priority ASC,
    created_at ASC
`);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = listTasksStmt.all().map(toTaskResponse);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const normalizedDueDate = normalizeDueDate(dueDate);
    if (normalizedDueDate === undefined) {
      return res.status(400).json({ error: 'Valid due date is required when provided' });
    }

    const normalizedPriority = normalizePriority(priority);
    if (normalizedPriority === undefined) {
      return res.status(400).json({ error: 'Priority must be an integer from 1 to 4' });
    }

    const result = insertTaskStmt.run(title.trim(), normalizedDueDate, normalizedPriority);
    const id = result.lastInsertRowid;

    const newTask = getTaskByIdStmt.get(id);
    res.status(201).json(toTaskResponse(newTask));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    const { title, dueDate, priority } = req.body;

    if (!id || Number.isNaN(parsedId)) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = getTaskByIdStmt.get(parsedId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const nextTitle = title === undefined ? existingTask.title : title;
    if (!nextTitle || typeof nextTitle !== 'string' || nextTitle.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const nextDueDate = dueDate === undefined ? existingTask.due_date : normalizeDueDate(dueDate);
    if (nextDueDate === undefined) {
      return res.status(400).json({ error: 'Valid due date is required when provided' });
    }

    const nextPriority = priority === undefined ? existingTask.priority : normalizePriority(priority);
    if (nextPriority === undefined) {
      return res.status(400).json({ error: 'Priority must be an integer from 1 to 4' });
    }

    db.prepare(
      `UPDATE tasks
       SET title = ?, due_date = ?, priority = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextTitle.trim(), nextDueDate, nextPriority, parsedId);

    const updatedTask = getTaskByIdStmt.get(parsedId);
    res.json(toTaskResponse(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (!id || Number.isNaN(parsedId)) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existingTask = getTaskByIdStmt.get(parsedId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(parsedId);

    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id: parsedId });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Backward-compatible aliases for previous item routes.
app.get('/api/items', (req, res) => {
  req.url = '/api/tasks';
  app.handle(req, res);
});

app.post('/api/items', (req, res) => {
  req.url = '/api/tasks';
  app.handle(req, res);
});

app.delete('/api/items/:id', (req, res) => {
  req.url = `/api/tasks/${req.params.id}`;
  app.handle(req, res);
});

module.exports = { app, db };