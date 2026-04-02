class TodoPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async addTask({ title, dueDate, priorityLabel }) {
    await this.page.getByLabel('Task title').fill(title);

    if (dueDate) {
      await this.page.getByLabel('Due date').fill(dueDate);
    }

    if (priorityLabel) {
      await this.page.getByLabel('Priority').click();
      await this.page.getByRole('option', { name: priorityLabel }).click();
    }

    await this.page.getByRole('button', { name: 'Add' }).click();
  }

  async switchToMatrixView() {
    await this.page.getByRole('button', { name: 'Eisenhower Matrix' }).click();
  }
}

module.exports = { TodoPage };
