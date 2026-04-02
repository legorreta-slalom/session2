class TodoPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async addTask({ title, dueDate, priorityLabel }) {
    await this.page.getByRole('textbox', { name: /task title/i }).fill(title);

    if (dueDate) {
      await this.page.getByLabel('Due date').fill(dueDate);
    }

    if (priorityLabel) {
      await this.page.getByLabel('Priority').click();
      await this.page.getByRole('option', { name: priorityLabel }).click();
    }

    await this.page.getByRole('button', { name: 'Add' }).click();
  }

  async editTask(currentTitle, { title, dueDate, priorityLabel }) {
    const row = this.page.getByText(currentTitle).locator('closest=li');
    await row.getByRole('button', { name: 'Edit' }).click();

    if (title !== undefined) {
      const input = this.page.getByRole('textbox', { name: /task title/i });
      await input.clear();
      await input.fill(title);
    }

    if (dueDate !== undefined) {
      await this.page.getByLabel('Due date').fill(dueDate);
    }

    if (priorityLabel) {
      await this.page.getByLabel('Priority').click();
      await this.page.getByRole('option', { name: priorityLabel }).click();
    }

    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async deleteTask(title) {
    const row = this.page.getByText(title).locator('closest=li');
    await row.getByRole('button', { name: 'Delete' }).click();
  }

  async switchToMatrixView() {
    await this.page.getByRole('button', { name: 'Eisenhower Matrix' }).click();
  }

  async switchToListView() {
    await this.page.getByRole('button', { name: 'List' }).click();
  }

  async getTaskTitles() {
    const items = this.page.locator('li');
    const count = await items.count();
    const titles = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).locator('span.MuiListItemText-primary').textContent();
      titles.push(text);
    }
    return titles;
  }

  hasOverdueIndicator(title) {
    return this.page
      .getByText(title)
      .locator('..')
      .locator('..')
      .getByText('Overdue');
  }
}

module.exports = { TodoPage };
