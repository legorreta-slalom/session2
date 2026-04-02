const isValidDateString = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const normalizeDueDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (!isValidDateString(value)) {
    return undefined;
  }

  return new Date(value).toISOString();
};

const normalizePriority = (priority) => {
  if (priority === undefined || priority === null || priority === '') {
    return 3;
  }

  const normalized = Number(priority);
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 4) {
    return undefined;
  }

  return normalized;
};

const toTaskResponse = (task) => {
  if (!task) {
    return task;
  }

  const dueDateValue = task.due_date ? new Date(task.due_date).getTime() : null;
  return {
    id: task.id,
    title: task.title,
    dueDate: task.due_date,
    priority: task.priority,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    isOverdue: dueDateValue !== null && dueDateValue < Date.now(),
  };
};

module.exports = {
  isValidDateString,
  normalizeDueDate,
  normalizePriority,
  toTaskResponse,
};
