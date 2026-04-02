const {
  isValidDateString,
  normalizeDueDate,
  normalizePriority,
  toTaskResponse,
} = require('../src/task-utils');

describe('task-utils', () => {
  describe('isValidDateString', () => {
    it('accepts a valid ISO date string', () => {
      expect(isValidDateString('2026-05-01')).toBe(true);
      expect(isValidDateString('2026-05-01T09:00:00.000Z')).toBe(true);
    });

    it('rejects non-string inputs', () => {
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
      expect(isValidDateString(12345)).toBe(false);
    });

    it('rejects empty and garbage strings', () => {
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('   ')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
    });
  });

  describe('normalizePriority', () => {
    it('uses default priority when omitted', () => {
      expect(normalizePriority(undefined)).toBe(3);
    });

    it('uses default priority for null and empty string', () => {
      expect(normalizePriority(null)).toBe(3);
      expect(normalizePriority('')).toBe(3);
    });

    it('returns undefined for out-of-range values', () => {
      expect(normalizePriority(0)).toBeUndefined();
      expect(normalizePriority(5)).toBeUndefined();
      expect(normalizePriority(-1)).toBeUndefined();
    });

    it('returns undefined for non-numeric strings', () => {
      expect(normalizePriority('bad')).toBeUndefined();
      expect(normalizePriority('high')).toBeUndefined();
    });

    it('accepts integers between 1 and 4', () => {
      expect(normalizePriority(1)).toBe(1);
      expect(normalizePriority(2)).toBe(2);
      expect(normalizePriority(3)).toBe(3);
      expect(normalizePriority(4)).toBe(4);
    });

    it('accepts numeric strings between 1 and 4', () => {
      expect(normalizePriority('1')).toBe(1);
      expect(normalizePriority('4')).toBe(4);
    });

    it('rejects floats', () => {
      expect(normalizePriority(2.5)).toBeUndefined();
    });
  });

  describe('normalizeDueDate', () => {
    it('converts valid dates to full ISO strings', () => {
      const result = normalizeDueDate('2026-05-01');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(result).toContain('2026-05-01');
    });

    it('returns null for empty values', () => {
      expect(normalizeDueDate('')).toBeNull();
      expect(normalizeDueDate(null)).toBeNull();
      expect(normalizeDueDate(undefined)).toBeNull();
    });

    it('returns undefined for invalid dates', () => {
      expect(normalizeDueDate('not-a-date')).toBeUndefined();
      expect(normalizeDueDate('2026-99-99')).toBeUndefined();
    });
  });

  describe('toTaskResponse', () => {
    it('maps database fields to camelCase API shape', () => {
      const mapped = toTaskResponse({
        id: 1,
        title: 'Task',
        due_date: null,
        priority: 2,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      expect(mapped).toEqual({
        id: 1,
        title: 'Task',
        dueDate: null,
        priority: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        isOverdue: false,
      });
    });

    it('marks a task with a past due date as overdue', () => {
      const mapped = toTaskResponse({
        id: 2,
        title: 'Overdue task',
        due_date: '2020-01-01T00:00:00.000Z',
        priority: 1,
        created_at: '2020-01-01T00:00:00.000Z',
        updated_at: '2020-01-01T00:00:00.000Z',
      });

      expect(mapped.isOverdue).toBe(true);
    });

    it('marks a task with a future due date as not overdue', () => {
      const mapped = toTaskResponse({
        id: 3,
        title: 'Future task',
        due_date: '2099-12-31T00:00:00.000Z',
        priority: 3,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });

      expect(mapped.isOverdue).toBe(false);
    });

    it('returns falsy input unchanged', () => {
      expect(toTaskResponse(null)).toBeNull();
      expect(toTaskResponse(undefined)).toBeUndefined();
    });
  });
});