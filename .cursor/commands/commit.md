# Pre-Commit and Git Workflow

## Overview

Run all pre-commit tasks, create logically organized commits with descriptive messages, and prepare code for review without pushing to origin.

## Context

- This project uses UV for Python package management
- All pre-commit hooks must pass before creating commits

## Steps

1. **Run pre-commit checks**
   - Execute all pre-commit hooks using UV
   - Fix any linting, formatting, or validation errors
   - Ensure all tests pass
   - Verify type checking passes

2. **Stage changes logically**
   - Each commit should be atomic: complete, buildable, and testable on its own
   - Group changes by single responsibility (one feature, one fix, one refactor)
   - If a file has both feature code and incidental formatting changes, include the formatting in the feature commit
   - Separate commits only when they represent truly independent changes
   - Split large features into sequential, logical commits that each add value
   - Test that each commit builds and passes tests independently when possible

3. **Create descriptive commits**
   - Use conventional commit format: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore
   - First line: concise summary (50 chars or less)
   - Body: explain what and why, not how (when needed)
   - Reference issue numbers: `Fixes #123` or `Relates to #456`
   - Each commit message should complete: "If applied, this commit will..."

4. **Verification**
   - Confirm all commits are properly formatted
   - Ensure commit history is clean and logical
   - Verify no changes are left unstaged

## Requirements

- Do NOT push to origin/remote
- Each commit should represent a single logical unit of work
- Commit messages must be clear and descriptive
- All pre-commit hooks must pass before committing
