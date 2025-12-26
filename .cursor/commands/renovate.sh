#!/bin/bash

# Renovate Dependency Consolidation Script
# This script safely consolidates all renovate dependency update branches into the renovations branch

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Safety check: Ensure we're on renovations branch
check_branch() {
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "renovations" ]]; then
        log_error "Must be on 'renovations' branch. Current branch: $current_branch"
        log_info "Run: git checkout renovations"
        exit 1
    fi
    log_success "On correct branch: $current_branch"
}

# Safety check: Ensure working directory is clean
check_clean_working_directory() {
    if ! git diff --quiet || ! git diff --staged --quiet; then
        log_error "Working directory has uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi
    log_success "Working directory is clean"
}

# Fetch all remote branches
fetch_updates() {
    log_info "Fetching latest changes from origin..."
    git fetch origin
    log_success "Fetched latest changes"
}

# Get list of renovate branches
get_renovate_branches() {
    git branch -r | grep "origin/renovate/" | sed 's|origin/||' | sort
}

# Check if remote branch exists and is ahead
branch_needs_merge() {
    local branch=$1
    local ahead_behind=$(git rev-list --left-right --count "renovations...origin/$branch" 2>/dev/null || echo "0 0")
    local ahead=$(echo "$ahead_behind" | awk '{print $2}')

    # Check if branch exists and has commits ahead
    if git show-ref --verify --quiet "refs/remotes/origin/$branch" 2>/dev/null && [[ "$ahead" -gt 0 ]]; then
        return 0  # true
    else
        return 1  # false
    fi
}

# Merge a single renovate branch
merge_renovate_branch() {
    local branch=$1

    if ! branch_needs_merge "$branch"; then
        log_info "Branch $branch is already merged or has no new commits"
        return 0
    fi

    log_info "Merging $branch..."

    if git merge --no-edit "origin/$branch" 2>/dev/null; then
        log_success "Successfully merged $branch"
        return 0
    else
        log_error "Merge conflict detected with $branch"
        log_info "Please resolve conflicts manually, then run: git commit"
        log_info "After resolving, you can continue with remaining branches"
        exit 1
    fi
}

# Main consolidation function
consolidate_renovate_updates() {
    local renovate_branches=$(get_renovate_branches)
    local branch_count=$(echo "$renovate_branches" | wc -l)

    if [[ -z "$renovate_branches" ]]; then
        log_warning "No renovate branches found"
        return 0
    fi

    log_info "Found $branch_count renovate branches to process"

    local merged_count=0
    while IFS= read -r branch; do
        if [[ -n "$branch" ]]; then
            if merge_renovate_branch "$branch"; then
                ((merged_count++))
            fi
        fi
    done <<< "$renovate_branches"

    log_success "Processed $merged_count out of $branch_count branches"
}

# Push consolidated changes
push_changes() {
    if git diff --quiet "origin/renovations"; then
        log_info "No changes to push"
        return 0
    fi

    log_info "Pushing consolidated changes..."
    git push origin renovations
    log_success "Successfully pushed changes to origin/renovations"
}

# Main execution
main() {
    log_info "Starting Renovate dependency consolidation..."

    check_branch
    check_clean_working_directory
    fetch_updates
    consolidate_renovate_updates
    push_changes

    log_success "Renovate consolidation completed!"
    log_info "All dependency updates have been consolidated into the renovations branch"
}

# Run main function
main "$@"
