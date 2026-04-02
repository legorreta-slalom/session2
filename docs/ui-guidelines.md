# UI Guidelines - TODO App

## Purpose

These guidelines define the core UI expectations for the TODO app so the product remains consistent, accessible, and easy to use.

## Component System

1. The UI shall use Material components as the default design system for all common controls and layout primitives.
2. Standard controls (buttons, inputs, selects, dialogs, snackbars, menus, chips, cards, and tabs) should come from the Material component library unless there is a strong product reason not to.
3. Any custom component should align with Material behavior patterns for spacing, states, motion, and feedback.

## Theme and Color Palette

1. The application shall use a dark-mode-first theme that is comfortable for long sessions and easy on the eyes.
2. Avoid harsh pure black/white combinations. Prefer softened dark neutrals and high-legibility text contrast.
3. Recommended baseline palette:
   - Background: `#121212`
   - Surface: `#1E1E1E`
   - Surface Variant: `#252525`
   - Primary: `#90CAF9`
   - Secondary: `#A5D6A7`
   - Error: `#EF9A9A`
   - Text Primary: `#ECEFF1`
   - Text Secondary: `#B0BEC5`
4. Overdue or urgent states should use a clear error accent while preserving readable contrast.
5. Use color consistently for meaning (for example, one color treatment for overdue, one for selected, one for disabled).

## Buttons

1. Buttons shall use rounded corners across the app.
2. Recommended corner radius:
   - Primary and secondary action buttons: `12px`
   - Icon buttons and small utility actions: `10px`
3. Button styles should include clear interactive states: default, hover, focus-visible, active, and disabled.
4. Primary actions should be visually distinct from secondary and tertiary actions.

## Accessibility Requirements

1. The UI shall meet WCAG 2.1 AA contrast expectations for text and interactive controls.
2. All interactive elements must be keyboard accessible and have visible focus indicators.
3. Icon-only controls must include accessible labels.
4. Form fields must have persistent labels, clear error messaging, and helper text where needed.
5. Status signals should not rely on color alone; pair color with iconography or text.

## Responsive and Layout Guidelines

1. The app should work well on desktop and mobile widths.
2. Use a consistent spacing scale (for example, 4px/8px increments).
3. Keep task list density readable; avoid overcrowded rows and tiny tap targets.
4. Minimum recommended touch target size is 44x44 CSS pixels for mobile interactions.

## Implementation Notes

1. Define theme tokens centrally (colors, typography, radius, spacing, elevation) so styles are not hardcoded per screen.
2. Reuse component variants instead of introducing one-off visual styles.
3. Validate the dark theme in real task scenarios, including overdue-state indicators, empty states, and matrix view.
