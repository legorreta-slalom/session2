const request = require('supertest');
const { app } = require('../../src/app');

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
  it('creates tasks with default priority', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write docs' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Write docs');
    expect(response.body.priority).toBe(3);
  });

  it('validates task payload', async () => {
    const badTitleResponse = await request(app)
      .post('/api/tasks')
      .send({ title: '' })
      .set('Accept', 'application/json');

    expect(badTitleResponse.status).toBe(400);
    expect(badTitleResponse.body.error).toBe('Task title is required');

    const badPriorityResponse = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task', priority: 8 })
      .set('Accept', 'application/json');

    expect(badPriorityResponse.status).toBe(400);
    expect(badPriorityResponse.body.error).toBe('Priority must be an integer from 1 to 4');
  });

  it('updates an existing task', async () => {
    const task = await createTask({ title: 'Original title', priority: 4 });

    const response = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Updated title', priority: 1 })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated title');
    expect(response.body.priority).toBe(1);
  });

  it('returns tasks in required sort order', async () => {
    await createTask({
      title: 'No due date',
      dueDate: null,
      priority: 1,
    });

    await createTask({
      title: 'Same due lower priority',
      dueDate: '2026-10-20T09:00:00.000Z',
      priority: 4,
    });

    await createTask({
      title: 'Earlier due date',
      dueDate: '2026-01-01T09:00:00.000Z',
      priority: 4,
    });

    await createTask({
      title: 'Same due higher priority',
      dueDate: '2026-10-20T09:00:00.000Z',
      priority: 1,
    });

    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);

    const titles = response.body.map(task => task.title);
    const earlierDueIndex = titles.lastIndexOf('Earlier due date');
    const sameDueHighIndex = titles.lastIndexOf('Same due higher priority');
    const sameDueLowIndex = titles.lastIndexOf('Same due lower priority');
    const noDueDateIndex = titles.lastIndexOf('No due date');

    expect(earlierDueIndex).toBeLessThan(sameDueHighIndex);
    expect(sameDueHighIndex).toBeLessThan(sameDueLowIndex);
    expect(sameDueLowIndex).toBeLessThan(noDueDateIndex);
  });

  it('deletes a task', async () => {
    const task = await createTask({ title: 'Delete me' });

    const response = await request(app).delete(`/api/tasks/${task.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Task deleted successfully', id: task.id });
  });
});
