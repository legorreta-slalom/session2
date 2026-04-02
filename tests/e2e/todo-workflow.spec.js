const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO critical workflow', () => {
  test('user can add and view tasks across list and matrix', async ({ page }) => {
    const todoPage = new TodoPage(page);

    await todoPage.goto();
    await expect(page.getByRole('heading', { name: 'TODO Planner' })).toBeVisible();

    const uniqueTitle = `E2E Task ${Date.now()}`;
    await todoPage.addTask({
      title: uniqueTitle,
      dueDate: '2030-01-15',
      priorityLabel: '2 - Important',
    });

    await expect(page.getByText(uniqueTitle)).toBeVisible();

    await todoPage.switchToMatrixView();
    await expect(page.getByText('Priority 1-2 and Not Urgent')).toBeVisible();
  });
});
