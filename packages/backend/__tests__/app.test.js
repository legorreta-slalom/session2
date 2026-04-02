const {
  normalizeDueDate,
  normalizePriority,
  toTaskResponse,
} = require('../src/task-utils');

describe('task-utils', () => {
  describe('normalizePriority', () => {
    it('uses default priority when omitted', () => {
      expect(normalizePriority(undefined)).toBe(3);
    });

    it('returns undefined for invalid values', () => {
      expect(normalizePriority(0)).toBeUndefined();
      expect(normalizePriority(5)).toBeUndefined();
      expect(normalizePriority('bad')).toBeUndefined();
    });

    it('accepts integers between 1 and 4', () => {
      expect(normalizePriority(1)).toBe(1);
      expect(normalizePriority('4')).toBe(4);
    });
  });

  describe('normalizeDueDate', () => {
    it('converts valid dates to ISO strings', () => {
      expect(normalizeDueDate('2026-05-01')).toContain('2026-05-01');
    });

    it('returns null for empty values', () => {
      expect(normalizeDueDate('')).toBeNull();
      expect(normalizeDueDate(null)).toBeNull();
    });

    it('returns undefined for invalid dates', () => {
      expect(normalizeDueDate('not-a-date')).toBeUndefined();
    });
  });

  describe('toTaskResponse', () => {
    it('maps database fields to API shape', () => {
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
  });
});