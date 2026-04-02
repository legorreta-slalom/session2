const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/todo-page');

test.describe('TODO critical workflows', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
    await expect(page.getByRole('heading', { name: 'TODO Planner' })).toBeVisible();
  });

  // Journey 1: Create a task with all fields and verify it persists after reload
  test('create a task and verify it persists', async ({ page }) => {
    const title = `Persist Check ${Date.now()}`;
    await todoPage.addTask({
      title,
      dueDate: '2030-06-15',
      priorityLabel: '1 - Top',
    });

    await expect(page.getByText(title)).toBeVisible();

    // Reload and verify backend state was saved
    await page.reload();
    await expect(page.getByText(title)).toBeVisible();
  });

  // Journey 2: Edit a task and verify the change
  test('edit a task title', async ({ page }) => {
    const original = `Edit Me ${Date.now()}`;
    await todoPage.addTask({ title: original });
    await expect(page.getByText(original)).toBeVisible();

    await todoPage.editTask(original, { title: 'Edited Title' });

    await expect(page.getByText('Edited Title')).toBeVisible();
    await expect(page.getByText(original)).not.toBeVisible();
  });

  // Journey 3: Delete a task and verify removal
  test('delete a task', async ({ page }) => {
    const title = `Delete Me ${Date.now()}`;
    await todoPage.addTask({ title });
    await expect(page.getByText(title)).toBeVisible();

    await todoPage.deleteTask(title);

    await expect(page.getByText(title)).not.toBeVisible();

    // Verify the deletion persisted on reload
    await page.reload();
    await expect(page.getByText(title)).not.toBeVisible();
  });

  // Journey 4: Overdue task shows red exclamation indicator
  test('overdue task displays overdue indicator', async ({ page }) => {
    const title = `Overdue ${Date.now()}`;
    await todoPage.addTask({
      title,
      dueDate: '2020-01-01',
      priorityLabel: '2 - Important',
    });

    await expect(page.getByText(title)).toBeVisible();
    await expect(todoPage.hasOverdueIndicator(title)).toBeVisible();
  });

  // Journey 5: Validation — empty title is rejected
  test('cannot submit a task with empty title', async ({ page }) => {
    // Count existing tasks
    const deleteButtonsBefore = await page.getByRole('button', { name: 'Delete' }).count();

    // Click Add without filling title
    await page.getByRole('button', { name: 'Add' }).click();

    // No new task should appear
    const deleteButtonsAfter = await page.getByRole('button', { name: 'Delete' }).count();
    expect(deleteButtonsAfter).toBe(deleteButtonsBefore);
  });

  // Journey 6: Eisenhower Matrix places tasks in correct quadrants
  test('matrix view shows tasks in correct quadrants', async ({ page }) => {
    const urgentTitle = `Urgent ${Date.now()}`;
    const planTitle = `Plan ${Date.now()}`;

    await todoPage.addTask({
      title: urgentTitle,
      dueDate: '2020-01-01',
      priorityLabel: '1 - Top',
    });

    await todoPage.addTask({
      title: planTitle,
      dueDate: '2035-12-31',
      priorityLabel: '2 - Important',
    });

    await todoPage.switchToMatrixView();

    // Urgent + high priority → top-left quadrant
    const urgentQuadrant = page.getByText('Priority 1-2 and Urgent/Overdue').locator('..');
    await expect(urgentQuadrant.getByText(urgentTitle)).toBeVisible();

    // Not urgent + high priority → top-right quadrant
    const planQuadrant = page.getByText('Priority 1-2 and Not Urgent').locator('..');
    await expect(planQuadrant.getByText(planTitle)).toBeVisible();
  });

  // Journey 7: Sort order — earlier due dates appear first, null at bottom
  test('tasks are sorted by due date then priority', async ({ page }) => {
    const laterTitle = `Later ${Date.now()}`;
    const earlierTitle = `Earlier ${Date.now()}`;
    const noDueTitle = `NoDue ${Date.now()}`;

    await todoPage.addTask({ title: laterTitle, dueDate: '2032-12-01', priorityLabel: '4 - Low' });
    await todoPage.addTask({ title: earlierTitle, dueDate: '2031-01-01', priorityLabel: '4 - Low' });
    await todoPage.addTask({ title: noDueTitle, priorityLabel: '1 - Top' });

    // Verify relative order in the DOM
    const earlierBox = page.getByText(earlierTitle);
    const laterBox = page.getByText(laterTitle);
    const noDueBox = page.getByText(noDueTitle);

    // All three should be visible
    await expect(earlierBox).toBeVisible();
    await expect(laterBox).toBeVisible();
    await expect(noDueBox).toBeVisible();

    // Earlier date should come before later date in the page
    const earlierY = (await earlierBox.boundingBox()).y;
    const laterY = (await laterBox.boundingBox()).y;
    const noDueY = (await noDueBox.boundingBox()).y;

    expect(earlierY).toBeLessThan(laterY);
    expect(laterY).toBeLessThan(noDueY);
  });
});
