# Renovate Dependency Update Workflow

## Overview

Consolidate all pending Renovate dependency update PRs into the main `renovations` branch to keep dependencies current.

## Prerequisites

- Must be run from the `renovations` branch
- All renovate branches should be up-to-date with origin
- No uncommitted changes in working directory

## Workflow Steps

### 1. Safety Checks

- Verify current branch is `renovations`
- Check for uncommitted changes
- Ensure remote tracking is set up

### 2. Fetch Latest Changes

- Fetch all remote branches from origin
- Update local `renovations` branch

### 3. Consolidate Renovate Updates

- Identify all remote `renovate/*` branches
- Merge each renovate branch into local `renovations` branch
- Handle merge conflicts if they occur (rare for dependency updates)

### 4. Push Consolidated Updates

- Push updated `renovations` branch to origin
- Verify all changes are pushed successfully

### 5. Cleanup (Optional)

- Delete merged remote renovate branches (requires admin permissions)
- Update any related PRs to reflect consolidated state

## Safety Features

- Only operates on branches matching `renovate/*` pattern
- Never modifies `main`, `staging`, or other non-renovate branches
- Preserves git history with merge commits
- Aborts on any merge conflicts for manual resolution

## Expected Outcome

- All dependency updates consolidated into `renovations` branch
- Dependencies kept as current as possible
- Clean git history with clear merge commits for each update
