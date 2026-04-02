const request = require('supertest');
const { app, db } = require('../../src/app');

// Ensure every test starts from a clean slate.
beforeEach(() => {
  db.exec('DELETE FROM tasks');
});

const createTask = async ({
  title = 'Temp task',
  dueDate = null,
  priority,
} = {}) => {
  const payload = { title, dueDate };
  if (priority !== undefined) {
    payload.priority = priority;
  }

  const response = await request(app)
    .post('/api/tasks')
    .send(payload)
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  return response.body;
};

describe('Tasks API integration', () => {
  // --- CREATE ---

  it('creates a task with default priority and verifies it in the database', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write docs' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Write docs');
    expect(response.body.priority).toBe(3);
    expect(response.body.dueDate).toBeNull();

    // Verify persisted via GET
    const listResponse = await request(app).get('/api/tasks');
    const persisted = listResponse.body.find(t => t.id === response.body.id);
    expect(persisted).toBeDefined();
    expect(persisted.title).toBe('Write docs');
    expect(persisted.priority).toBe(3);
  });

  it('creates a task with explicit priority and due date', async () => {
    const task = await createTask({
      title: 'Deploy release',
      dueDate: '2026-06-15T09:00:00.000Z',
      priority: 1,
    });

    expect(task.priority).toBe(1);
    expect(task.dueDate).toContain('2026-06-15');
  });

  // --- VALIDATION ---

  it('rejects creation with empty title', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task title is required');
  });

  it('rejects creation with missing title', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({})
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Task title is required');
  });

  it('rejects creation with out-of-range priority', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad priority', priority: 8 })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Priority must be an integer from 1 to 4');
  });

  it('rejects creation with invalid due date', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad date', dueDate: 'not-a-date' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Valid due date is required when provided');
  });

  // --- UPDATE ---

  it('updates an existing task and verifies persisted state', async () => {
    const task = await createTask({ title: 'Original title', priority: 4 });

    const response = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Updated title', priority: 1 })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated title');
    expect(response.body.priority).toBe(1);

    // Verify the change persisted via a follow-up GET
    const listResponse = await request(app).get('/api/tasks');
    const persisted = listResponse.body.find(t => t.id === task.id);
    expect(persisted.title).toBe('Updated title');
    expect(persisted.priority).toBe(1);
  });

  it('partial update preserves unchanged fields', async () => {
    const task = await createTask({
      title: 'Keep my priority',
      dueDate: '2026-08-01T00:00:00.000Z',
      priority: 2,
    });

    const response = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'New title only' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('New title only');
    expect(response.body.priority).toBe(2);
    expect(response.body.dueDate).toContain('2026-08-01');
  });

  it('returns 404 when updating a non-existent task', async () => {
    const response = await request(app)
      .put('/api/tasks/999999')
      .send({ title: 'Ghost' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('returns 400 when updating with an invalid id', async () => {
    const response = await request(app)
      .put('/api/tasks/abc')
      .send({ title: 'Bad id' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Valid task ID is required');
  });

  // --- SORT ORDER ---

  it('returns tasks in required sort order', async () => {
    await createTask({ title: 'No due date', dueDate: null, priority: 1 });
    await createTask({ title: 'Oct 20 low prio', dueDate: '2026-10-20T09:00:00.000Z', priority: 4 });
    await createTask({ title: 'Jan 01 low prio', dueDate: '2026-01-01T09:00:00.000Z', priority: 4 });
    await createTask({ title: 'Oct 20 high prio', dueDate: '2026-10-20T09:00:00.000Z', priority: 1 });

    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);

    const titles = response.body.map(t => t.title);

    // Due date ascending, null at bottom
    expect(titles.indexOf('Jan 01 low prio')).toBeLessThan(titles.indexOf('Oct 20 high prio'));
    // Same due date: priority ascending
    expect(titles.indexOf('Oct 20 high prio')).toBeLessThan(titles.indexOf('Oct 20 low prio'));
    // Null due date at bottom regardless of high priority
    expect(titles.indexOf('Oct 20 low prio')).toBeLessThan(titles.indexOf('No due date'));
  });

  // --- DELETE ---

  it('deletes a task and verifies it is gone from the database', async () => {
    const task = await createTask({ title: 'Delete me' });

    const response = await request(app).delete(`/api/tasks/${task.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Task deleted successfully', id: task.id });

    // Verify the task no longer appears in GET
    const listResponse = await request(app).get('/api/tasks');
    const deleted = listResponse.body.find(t => t.id === task.id);
    expect(deleted).toBeUndefined();
  });

  it('returns 404 when deleting a non-existent task', async () => {
    const response = await request(app).delete('/api/tasks/999999');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  it('returns 400 when deleting with an invalid id', async () => {
    const response = await request(app).delete('/api/tasks/abc');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Valid task ID is required');
  });
});
