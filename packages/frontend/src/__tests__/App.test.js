import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock server to intercept API requests
const server = setupServer(
  // GET /api/tasks handler
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
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
      ])
    );
  }),
  
  // POST /api/tasks handler
  rest.post('/api/tasks', (req, res, ctx) => {
    const { title, dueDate, priority } = req.body;
    
    if (!title || title.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Task title is required' })
      );
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        title,
        dueDate,
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOverdue: false,
      })
    );
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id: Number(req.params.id) }));
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    render(<App />);
    expect(screen.getByText('TODO Planner')).toBeInTheDocument();
    expect(screen.getByText('Track work by due date, priority, and urgency.')).toBeInTheDocument();

    // Ensure the initial async fetch effect settles before test teardown.
    expect(await screen.findByText('Test Task 1')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    render(<App />);

    expect(await screen.findByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    await screen.findByText('Test Task 1');
    
    // Fill in the form and submit
    const input = await screen.findByRole('textbox', { name: /task title/i });
    await user.type(input, 'New Test Task');
    
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);
    
    // Check that the new task appears
    await waitFor(() => {
      expect(screen.getByText('New Test Task')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    // Override the default handler to simulate an error
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
    // Override the default handler to return empty array
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

  test('can switch to matrix view', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByText('Test Task 1');

    await user.click(screen.getByRole('button', { name: 'Eisenhower Matrix' }));

    await waitFor(() => {
      expect(screen.getByText('Priority 1-2 and Urgent/Overdue')).toBeInTheDocument();
    });
  });
});