# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js (App Router) marketing site + blog + checkout for Boximity MSP ("dotca"), deployed to DigitalOcean droplets via Terraform + Ansible, containerized with Docker, and built/deployed through GitHub Actions.

## Commands

Scripts live in `package.json`; recipes in the `justfile` (`just --list`). What those files do not say:

- `npm run test:coverage` is the gate CI runs. The thresholds in `jest.config.cjs` are a ratchet floor set to measured coverage: raise them as coverage improves, and fix the tests when a run falls below them.
- `npm run test:e2e` needs the dev environment up first (`just dev-up`).
- `npm run lint` is type-aware for `src` (boolean naming rule in `eslint.config.js`), so it takes a few seconds longer than a plain eslint run.
- Mutation testing (`just mutation`) is report-only. Before suppressing a mutant or filing survivor issues, read the suppression rules in the `stryker.config.mjs` header and `docs/agents/issue-tracker.md` § Mutation survivor issues.
- `just` is the command runner. The `Makefile` is deprecated: leave it as it is.
- Run Terraform and Ansible through `just` (`just deploy ENVIRONMENT=staging`): it validates env files and wraps the confirmation prompts for `destroy`, `terraform-destroy` and `dev-clean`.
- Dependency updates go through `scripts/update-deps.sh` / `.cursor/commands/update-deps.md`. Every dependency is pinned to an exact version across `package.json`, `Dockerfile`/`Dockerfile.dev`, `.nvmrc`, `ansible/requirements.yml`, `terraform/main.tf` and the GitHub Actions workflows. Update one at a time and run tests after each.

## Architecture

Routes are folders under `src/app`; API routes are `src/app/api/*/route.ts`; shared modules are in `src/lib`. Conventions the layout does not show:

- **Blog**: posts are GitHub-flavored markdown in `content/blog/*.md` with YAML frontmatter; MDX component syntax is unsupported. Every page and route reads posts through `src/lib/blog.ts`. `scripts/validate-blog-posts.js` checks frontmatter in CI.
- **Plans and pricing**: `src/lib/plan-catalog.ts` is the one plan catalog and holds display prices only. Charged amounts come from Stripe Prices resolved by lookup key (`src/lib/pricing.ts`, `src/lib/stripe.ts`); change the two together.
- **Structured data**: pages compose the JSON-LD builders in `src/lib/schema.ts`.
- **Observability**: web-vitals, Google Analytics and Sentry run in parallel (`src/lib/web-vitals.ts`, `analytics.ts`, `gtag.ts`, `ga4.ts`; Sentry configs at the repo root). `src/app/sentry-example-page` and `api/sentry-example-api` are verification routes.
- **Deploys**: `.github/workflows/deploy.yml` deploys branch `staging` to staging and `main` to production by promoting one built image. In `docs/ci-cd-architecture.md`, the "Implementation Roadmap" and "Remaining Targets" sections describe work still to do.
- **Secrets, SSH, deploy workflows**: read `docs/component-interaction-diagram.md`, `docs/ssh-key-management.md` and `docs/secrets-rotation-guide.md` before changing them.

## Conventions

- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`), subject line ≤ 50 chars.
- Feature branches are cut from `staging`; PRs should pass `just dev-test` first.
- Pre-commit hooks are managed via `pre-commit` (`npm run pre-commit:install` / `pre-commit:run`) — all hooks must pass before committing.
- Naming and design standards: `.cursor/rules/naming-conventions.mdc` and `.cursor/rules/design-principles.mdc`. Reviewers enforce them; lint enforces boolean naming.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `bxmty/dotca`, driven via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. `CONTEXT.md` and `docs/adr/` are created lazily and are absent today. See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
