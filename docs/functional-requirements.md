# Functional Requirements - TODO App

## Core Task Management

1. The system shall allow the user to add a due date to a task.
2. The system shall allow the user to assign a priority to each task using the following levels:
   - `1` = Top
   - `2` = Important
   - `3` = Normal
   - `4` = Low
3. The default task priority shall be `3` (Normal) when no priority is explicitly selected.
4. The system shall allow the user to edit an existing task.

## Task Ordering

5. The system shall display tasks sorted in the following order:
   1. Due date in ascending order.
   2. Tasks with no due date shall be placed at the bottom of the list.
   3. Within the same due date grouping, sort by priority from Top to Low (`1` to `4`).
   4. If due date and priority are the same, sort by date added.

## Overdue Highlighting

6. The system shall visually mark overdue tasks with a red exclamation icon.

## Alternate View: Eisenhower Matrix

7. The system shall provide an option to switch from list view to an Eisenhower Matrix view.
8. The Eisenhower Matrix view shall contain four quadrants.
9. The top row shall contain tasks with priorities `1` and `2`.
10. The left column shall contain urgent/overdue tasks.
11. The right column shall contain tasks that are not yet urgent (there is still time to do them).
