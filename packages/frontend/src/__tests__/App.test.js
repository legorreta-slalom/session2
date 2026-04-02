import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const baseTasks = [
  {
    id: 1,
    title: 'Test Task 1',
    dueDate: '2026-05-01T00:00:00.000Z',
    priority: 2,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    isOverdue: false,
  },
  {
    id: 2,
    title: 'Test Task 2',
    dueDate: null,
    priority: 3,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    isOverdue: false,
  },
  {
    id: 3,
    title: 'Overdue Report',
    dueDate: '2024-01-15T00:00:00.000Z',
    priority: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isOverdue: true,
  },
];

// Mutable task store so tests can observe state changes.
let taskStore;

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(taskStore));
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const { title, dueDate, priority } = req.body;
    if (!title || title.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    }
    const newTask = {
      id: taskStore.length + 100,
      title,
      dueDate: dueDate || null,
      priority: priority ?? 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOverdue: false,
    };
    taskStore.push(newTask);
    return res(ctx.status(201), ctx.json(newTask));
  }),

  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = taskStore.findIndex(t => t.id === id);
    if (idx === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }
    const updated = { ...taskStore[idx], ...req.body, updatedAt: new Date().toISOString() };
    taskStore[idx] = updated;
    return res(ctx.status(200), ctx.json(updated));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = taskStore.findIndex(t => t.id === id);
    if (idx === -1) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }
    taskStore.splice(idx, 1);
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Reset the mock store before every test for full isolation.
beforeEach(() => {
  taskStore = JSON.parse(JSON.stringify(baseTasks));
});

describe('App Component', () => {
  test('renders the header', async () => {
    render(<App />);
    expect(screen.getByText('TODO Planner')).toBeInTheDocument();
    expect(screen.getByText('Track work by due date, priority, and urgency.')).toBeInTheDocument();

    // Let the async fetch settle before teardown.
    expect(await screen.findByText('Test Task 1')).toBeInTheDocument();
  });

  test('loads and displays tasks including overdue indicator', async () => {
    render(<App />);

    expect(await screen.findByText('Overdue Report')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();

    // The overdue chip should be visible for the overdue task.
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('adds a new task with correct priority chip', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test Task 1');

    const input = await screen.findByRole('textbox', { name: /task title/i });
    await user.type(input, 'Brand New Task');

    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    // Verify the new task appears.
    expect(await screen.findByText('Brand New Task')).toBeInTheDocument();

    // Verify its default priority chip rendered.
    const allNormalChips = screen.getAllByText('3 - Normal');
    expect(allNormalChips.length).toBeGreaterThanOrEqual(1);
  });

  test('edits an existing task', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test Task 1');

    // Click the Edit button on the first visible task's row.
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    await user.click(editButtons[0]);

    // The form should now show "Edit task" heading and be populated.
    expect(await screen.findByText('Edit task')).toBeInTheDocument();

    const titleInput = screen.getByRole('textbox', { name: /task title/i });
    await user.clear(titleInput);
    await user.type(titleInput, 'Edited Title');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Verify the updated title appears in the list.
    expect(await screen.findByText('Edited Title')).toBeInTheDocument();
  });

  test('deletes a task and removes it from the list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test Task 2');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    const countBefore = deleteButtons.length;

    // Delete the last task in the rendered list.
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      const remaining = screen.getAllByRole('button', { name: 'Delete' });
      expect(remaining.length).toBe(countBefore - 1);
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Add your first task.')).toBeInTheDocument();
    });
  });

  test('matrix view places tasks in the correct quadrants', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Test Task 1');

    await user.click(screen.getByRole('button', { name: 'Eisenhower Matrix' }));

    // Wait for the grid to render.
    await waitFor(() => {
      expect(screen.getByText('Priority 1-2 and Urgent/Overdue')).toBeInTheDocument();
    });

    // Overdue Report: priority 1, overdue → high_urgent quadrant
    const urgentHighCard = screen.getByTestId('quadrant-high-urgent');
    expect(within(urgentHighCard).getByText('Overdue Report')).toBeInTheDocument();

    // Test Task 1: priority 2, future due → high_notUrgent quadrant
    const notUrgentHighCard = screen.getByTestId('quadrant-high-not-urgent');
    expect(within(notUrgentHighCard).getByText('Test Task 1')).toBeInTheDocument();

    // Test Task 2: priority 3, no due date → normal_notUrgent quadrant
    const notUrgentNormalCard = screen.getByTestId('quadrant-normal-not-urgent');
    expect(within(notUrgentNormalCard).getByText('Test Task 2')).toBeInTheDocument();
  });
});