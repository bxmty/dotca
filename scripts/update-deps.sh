#!/bin/bash

# update-deps.sh - Update dependencies one by one, running tests after each update
# This script helps ensure each dependency update doesn't break the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run tests
run_tests() {
    echo -e "${BLUE}Running tests...${NC}"

    # Run linting first
    if ! npm run lint; then
        echo -e "${RED}Linting failed${NC}"
        return 1
    fi

    # Run type checking
    if ! npm run typecheck; then
        echo -e "${RED}Type checking failed${NC}"
        return 1
    fi

    # Run unit tests
    if ! npm test; then
        echo -e "${RED}Unit tests failed${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ All tests passed${NC}"
    return 0
}

# Function to update a single dependency
update_dependency() {
    local package="$1"
    local current_version="$2"
    local latest_version="$3"

    echo -e "${BLUE}Updating ${package} from ${current_version} to ${latest_version}...${NC}"

    # Update the dependency
    if ! npm install "${package}@${latest_version}"; then
        echo -e "${RED}Failed to update ${package}${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Updated ${package} to ${latest_version}${NC}"

    # Run tests after update
    if ! run_tests; then
        echo -e "${RED}Tests failed after updating ${package}. Rolling back...${NC}"

        # Rollback the update
        if ! npm install "${package}@${current_version}"; then
            echo -e "${RED}Failed to rollback ${package}${NC}"
            return 1
        fi

        echo -e "${YELLOW}Rolled back ${package} to ${current_version}${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ ${package} update successful and tests passed${NC}"
    return 0
}

echo -e "${BLUE}Starting dependency update process...${NC}"

# Get outdated packages
echo -e "${BLUE}Checking for outdated dependencies...${NC}"
outdated_output=$(npm outdated --json 2>/dev/null || true)

if [ -z "$outdated_output" ] || [ "$outdated_output" = "{}" ]; then
    echo -e "${GREEN}No outdated dependencies found!${NC}"
    exit 0
fi

# Define packages that need to be updated together due to peer dependencies
stripe_packages="@stripe/react-stripe-js @stripe/stripe-js"
typescript_eslint_packages="@typescript-eslint/eslint-plugin @typescript-eslint/parser"

# First, handle Stripe packages together
if echo "$outdated_output" | jq -e '.["@stripe/react-stripe-js"] or .["@stripe/stripe-js"]' >/dev/null 2>&1; then
    echo -e "${BLUE}Updating Stripe packages together (peer dependency requirement)...${NC}"

    # Get versions for Stripe packages
    stripe_react_current=$(echo "$outdated_output" | jq -r '."@stripe/react-stripe-js".current // empty')
    stripe_react_latest=$(echo "$outdated_output" | jq -r '."@stripe/react-stripe-js".latest // empty')
    stripe_js_current=$(echo "$outdated_output" | jq -r '."@stripe/stripe-js".current // empty')
    stripe_js_latest=$(echo "$outdated_output" | jq -r '."@stripe/stripe-js".latest // empty')

    if [ -n "$stripe_react_latest" ] && [ -n "$stripe_js_latest" ]; then
        echo -e "${BLUE}Updating @stripe/stripe-js from ${stripe_js_current} to ${stripe_js_latest} and @stripe/react-stripe-js from ${stripe_react_current} to ${stripe_react_latest}...${NC}"

        # Update both Stripe packages together
        if ! npm install "@stripe/stripe-js@${stripe_js_latest}" "@stripe/react-stripe-js@${stripe_react_latest}"; then
            echo -e "${RED}Failed to update Stripe packages${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ Updated Stripe packages${NC}"

        # Run tests after update
        if ! run_tests; then
            echo -e "${RED}Tests failed after updating Stripe packages. Rolling back...${NC}"

            # Rollback both packages
            if ! npm install "@stripe/stripe-js@${stripe_js_current}" "@stripe/react-stripe-js@${stripe_react_current}"; then
                echo -e "${RED}Failed to rollback Stripe packages${NC}"
                exit 1
            fi

            echo -e "${YELLOW}Rolled back Stripe packages${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ Stripe packages update successful and tests passed${NC}"
        echo ""
    fi
fi

# Remove Stripe packages from the list since they're already handled
outdated_output=$(echo "$outdated_output" | jq 'del(.["@stripe/react-stripe-js"], .["@stripe/stripe-js"])')

# Handle TypeScript ESLint packages together
if echo "$outdated_output" | jq -e '.["@typescript-eslint/eslint-plugin"] or .["@typescript-eslint/parser"]' >/dev/null 2>&1; then
    echo -e "${BLUE}Updating TypeScript ESLint packages together (peer dependency requirement)...${NC}"

    # Get versions for TypeScript ESLint packages
    eslint_plugin_current=$(echo "$outdated_output" | jq -r '."@typescript-eslint/eslint-plugin".current // empty')
    eslint_plugin_latest=$(echo "$outdated_output" | jq -r '."@typescript-eslint/eslint-plugin".latest // empty')
    parser_current=$(echo "$outdated_output" | jq -r '."@typescript-eslint/parser".current // empty')
    parser_latest=$(echo "$outdated_output" | jq -r '."@typescript-eslint/parser".latest // empty')

    if [ -n "$eslint_plugin_latest" ] && [ -n "$parser_latest" ]; then
        echo -e "${BLUE}Updating @typescript-eslint/parser from ${parser_current} to ${parser_latest} and @typescript-eslint/eslint-plugin from ${eslint_plugin_current} to ${eslint_plugin_latest}...${NC}"

        # Update both TypeScript ESLint packages together
        if ! npm install "@typescript-eslint/parser@${parser_latest}" "@typescript-eslint/eslint-plugin@${eslint_plugin_latest}"; then
            echo -e "${RED}Failed to update TypeScript ESLint packages${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ Updated TypeScript ESLint packages${NC}"

        # Run tests after update
        if ! run_tests; then
            echo -e "${RED}Tests failed after updating TypeScript ESLint packages. Rolling back...${NC}"

            # Rollback both packages
            if ! npm install "@typescript-eslint/parser@${parser_current}" "@typescript-eslint/eslint-plugin@${eslint_plugin_current}"; then
                echo -e "${RED}Failed to rollback TypeScript ESLint packages${NC}"
                exit 1
            fi

            echo -e "${YELLOW}Rolled back TypeScript ESLint packages${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ TypeScript ESLint packages update successful and tests passed${NC}"
        echo ""
    fi
fi

# Remove TypeScript ESLint packages from the list since they're already handled
outdated_output=$(echo "$outdated_output" | jq 'del(.["@typescript-eslint/eslint-plugin"], .["@typescript-eslint/parser"])')

# Parse JSON and update remaining dependencies
echo "$outdated_output" | jq -r 'to_entries[] | "\(.key) \(.value.current) \(.value.latest)"' | while read -r package current latest; do
    if [ "$current" != "$latest" ]; then
        if ! update_dependency "$package" "$current" "$latest"; then
            echo -e "${RED}Failed to update ${package}. Stopping update process.${NC}"
            exit 1
        fi
        echo ""  # Add blank line between updates
    fi
done

echo -e "${GREEN}All dependency updates completed successfully!${NC}"

# Run final comprehensive test
echo -e "${BLUE}Running final comprehensive test suite...${NC}"
if run_tests; then
    echo -e "${GREEN}✓ Final test suite passed! All updates are working correctly.${NC}"
else
    echo -e "${RED}Final test suite failed. Please review the updates.${NC}"
    exit 1
fi