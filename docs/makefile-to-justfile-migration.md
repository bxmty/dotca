# Makefile to Justfile Migration Guide

## Overview

This project has migrated from GNU Make to [Just](https://github.com/casey/just) as the primary command runner. This guide explains the migration and helps developers transition smoothly.

## Why Just?

- **Cleaner syntax**: More readable than Makefiles
- **Better error messages**: Clear, helpful error reporting
- **Cross-platform**: Works consistently across Linux, macOS, and Windows
- **No dependency ordering issues**: Recipes run in the order specified
- **Built-in help**: Automatic command listing and documentation
- **Faster execution**: No complex dependency resolution overhead

## Command Changes

All commands remain functionally identical - only the tool changes:

| Old Command                        | New Command                        | Description                   |
| ---------------------------------- | ---------------------------------- | ----------------------------- |
| `make`                             | `just`                             | Show help                     |
| `make setup`                       | `just setup`                       | Initial environment setup     |
| `make validate`                    | `just validate`                    | Validate environment          |
| `make dev-up`                      | `just dev-up`                      | Start development environment |
| `make dev-down`                    | `just dev-down`                    | Stop development environment  |
| `make dev-test`                    | `just dev-test`                    | Run all tests                 |
| `make deploy ENVIRONMENT=staging`  | `just deploy ENVIRONMENT=staging`  | Deploy to staging             |
| `make destroy ENVIRONMENT=staging` | `just destroy ENVIRONMENT=staging` | Destroy staging environment   |

## Installation

### Linux/macOS

```bash
# Using package managers
# Ubuntu/Debian
sudo apt install just

# macOS
brew install just

# Or download from releases
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin
```

### Windows

```powershell
# Using Chocolatey
choco install just

# Using Scoop
scoop install just

# Or download from releases
```

## Key Differences

### 1. Help System

**Make:**

```bash
make help  # Manual help implementation
```

**Just:**

```bash
just        # Built-in help
just --list # List all recipes
```

### 2. Variable Defaults

**Make:**

```makefile
ENVIRONMENT ?= staging
```

**Just:**

```justfile
ENVIRONMENT := env_var_or_default("ENVIRONMENT", "staging")
```

### 3. Conditional Logic

**Make:**

```makefile
deploy:
    @if [ "$(DRY_RUN)" = "true" ]; then \
        echo "DRY RUN MODE"; \
    fi
```

**Just:**

```justfile
deploy:
    @if [ "{{DRY_RUN}}" = "true" ]; then \
        echo "DRY RUN MODE"; \
    fi
```

### 4. Recipe Dependencies

**Make:**

```makefile
validate: check-env
    # validation logic
```

**Just:**

```justfile
validate: check-env
    # validation logic
```

## Environment Variables

All environment variables work the same way:

```bash
# Set environment variables
just deploy ENVIRONMENT=production
just terraform-plan ENVIRONMENT=staging BACKEND=local

# Or export them
export ENVIRONMENT=production
just deploy
```

## Troubleshooting

### "just: command not found"

Ensure Just is installed and in your PATH:

```bash
which just
# Should show: /usr/local/bin/just or similar

# If not found, reinstall
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
```

### Recipe not found

Check available recipes:

```bash
just --list
```

### Permission denied

Make sure the justfile is readable:

```bash
ls -la justfile
chmod 644 justfile
```

## Development Workflow

The development workflow remains identical:

```bash
# Setup (one time)
just setup

# Daily development
just dev-up          # Start environment
just dev-test        # Run tests
just dev-down        # Stop environment

# Deployment
just validate        # Check everything is ready
just deploy ENVIRONMENT=staging
```

## Advanced Usage

### Custom Variables

```bash
# Override defaults
just deploy ENVIRONMENT=production VERBOSE=true

# Use shell variables
MY_VAR=test just deploy
```

### Recipe Inspection

```bash
# Show recipe source
just --show deploy

# Show usage
just --usage deploy
```

### Dry Run

```bash
# See what would happen
just --dry-run deploy ENVIRONMENT=staging
```

## Migration Checklist

- [ ] Install Just on your system
- [ ] Update your shell scripts/aliases from `make` to `just`
- [ ] Update any CI/CD pipelines
- [ ] Update documentation links
- [ ] Test common workflows with Just

## Questions?

If you encounter issues:

1. Check `just --help` for available options
2. Review the Just documentation: https://just.systems/
3. Ask in the development channel

## Backwards Compatibility

The Makefile is still present but deprecated. It will be removed in a future version. For now, both systems coexist, but please use Just for new development.

---

_Last updated: January 2026_
