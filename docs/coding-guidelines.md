# Coding Guidelines

## Overview

This project favors code that is easy to read, easy to test, and easy to change. The goal is not strict style for its own sake, but consistency that helps the team move quickly without introducing avoidable defects. These guidelines describe the expected coding style and quality principles for React and TypeScript development, with room for practical judgment when trade-offs are needed.

## General Style and Formatting

Use a single automated formatter and keep formatting decisions out of code review as much as possible. Prefer short, intention-revealing functions, consistent indentation, and predictable spacing. Avoid overly clever syntax when a straightforward expression is clearer. Keep line length reasonable so code remains readable in side-by-side review.

Name variables, functions, and components for what they represent, not how they are implemented. Favor full words over abbreviations unless the abbreviation is universally understood in context. Booleans should read like facts or questions (for example, `isLoading`, `hasError`, `canSubmit`).

## React Conventions

Write React code with functional components and hooks. Keep components focused on one responsibility, and split large components into smaller presentational and container-like units when complexity grows. Place side effects in `useEffect` with explicit dependencies and avoid effect logic that is hard to reason about.

Derived UI state should usually be computed, not duplicated in state, unless there is a clear performance or behavioral reason. Keep props interfaces small and meaningful. Prefer controlled components for forms and centralize validation logic where possible.

Co-locate component-specific files when practical (component, styles, tests), but keep shared UI primitives and domain utilities in clearly named shared locations. Avoid prop drilling when data flow becomes deep; use composition patterns or context carefully and only where it improves clarity.

## TypeScript Rules and Best Practices

Treat TypeScript as a design tool, not just a compile-time checker. Prefer explicit, domain-focused types over broad or ambiguous types. Use interfaces and type aliases intentionally: interfaces for extensible object shapes, type aliases for unions and mapped types.

Avoid `any` unless there is no practical alternative. If temporary `any` usage is unavoidable, isolate it and document why. Prefer `unknown` over `any` for untrusted values, then narrow with runtime checks. Model nullable values explicitly and handle them deliberately.

Use discriminated unions for variant state and complex UI flows. Keep function signatures narrow and return types predictable. Avoid deep generic complexity unless it provides clear value to maintainability.

## Import Organization

Keep imports clean, grouped, and stable. A common order is:

1. External libraries/framework imports
2. Absolute internal imports (if configured)
3. Relative imports from nearby modules
4. Style or asset imports

Within groups, sort alphabetically where tooling allows. Remove unused imports immediately. Avoid circular dependencies by keeping module boundaries clear and by extracting shared logic to neutral utility modules when needed.

Prefer named exports for most reusable modules to improve discoverability and refactoring safety. Use default exports selectively, typically when a file exposes one primary component.

## Linting and Static Analysis

Use ESLint as a required quality gate, not an optional suggestion. Keep lint rules enabled unless there is a strong reason to disable one, and prefer project-level rule decisions over frequent inline ignores.

When disabling a rule for a line, keep the suppression narrow and include a brief rationale. Resolve warnings proactively, especially around hooks, accessibility, and TypeScript safety. Integrate lint checks into local workflows and CI so style and correctness issues are caught early.

## Code Quality Principles

Apply DRY (Do Not Repeat Yourself) to reduce duplicated logic, but do not over-abstract too early. Small, intentional duplication can be acceptable when it keeps code simpler and clearer. Abstract when repetition is stable and meaningful.

Favor single-responsibility functions and modules. Keep business logic out of presentation where feasible, and separate pure logic from side effects to improve testability. Write code so that failure modes are explicit, errors are handled intentionally, and behavior is predictable.

Prefer composition over inheritance in React and TypeScript code. Optimize for readability first, then performance when profiling indicates a real bottleneck.

## Testing and Maintainability Expectations

Code should be written in a way that supports isolated testing. Design modules with clear inputs and outputs, avoid hidden mutable state, and make dependency boundaries visible.

Before merging, ensure formatting, linting, and tests pass. During review, prioritize correctness, clarity, and maintainability over personal style preferences.

## Practical Rule of Thumb

If a teammate can understand and safely modify your code quickly, the code is probably aligned with these guidelines. If they must reverse-engineer hidden assumptions first, simplify the design or improve naming and structure.
