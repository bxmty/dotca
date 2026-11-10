# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js (App Router) marketing site + blog + checkout for Boximity MSP ("dotca"), deployed to DigitalOcean droplets via Terraform + Ansible, containerized with Docker, and built/deployed through GitHub Actions.

## Commands

### App development

```bash
npm run dev              # Next.js dev server on 0.0.0.0:3000
npm run build             # production build
npm run lint              # eslint src
npm run typecheck         # tsc --noEmit
npm run format:check      # prettier; exclusions in .prettierignore
```

### Tests

```bash
npm run test              # jest (unit), no coverage
npm run test:watch
npm run test:coverage     # full suite + coverage thresholds; the gate CI runs
npx jest path/to/file.test.ts            # run a single test file
npx jest -t "test name"                  # run tests matching a name
just mutation             # Stryker in tmux; report archived to reports/mutation-runs/<sha>/

npm run test:e2e          # Playwright e2e — requires the dev environment running first (just dev-up)
npm run test:e2e:debug
npm run test:e2e:ui
```

Jest config (`jest.config.cjs`) enforces coverage thresholds and maps `@/*` to `src/*`. The configured thresholds are a ratchet floor set to measured coverage, rounded down (see the comment in that file) — raise them as coverage improves, never lower them to make a failing run pass. They now sit above the repo's original 65% branches/functions, 70% lines/statements target. Test files: `**/__tests__/**` or `*.test.ts(x)`/`*.spec.ts(x)`, excluding `e2e/`.

Mutation testing is report-only (no `break` threshold). Before suppressing a mutant or filing survivor issues, read the suppression rules in the `stryker.config.mjs` header and `docs/agents/issue-tracker.md` § Mutation survivor issues.

### Docker-based local dev (preferred; see `justfile`)

```bash
just setup            # initial environment configuration
just dev-up            # start dev containers
just dev-down
just dev-restart
just dev-logs
just dev-test          # unit + e2e tests
just dev-lint           # lint + typecheck
just dev-clean FORCE=true
```

`just` is the current command runner — the `Makefile` is deprecated (kept temporarily, do not extend it).

### Infrastructure (Terraform + Ansible on DigitalOcean)

```bash
just validate                                    # validate environment setup
just deploy ENVIRONMENT=staging                  # deploy (BACKEND=remote by default, or local)
just deploy ENVIRONMENT=production
just status ENVIRONMENT=staging
just destroy ENVIRONMENT=staging
just terraform-plan ENVIRONMENT=staging
just terraform-apply ENVIRONMENT=staging BACKEND=local
just ansible-ping
just ansible-syntax
```

Dependency updates: use `scripts/update-deps.sh` / `.cursor/commands/update-deps.md` — every dependency across `package.json`, `Dockerfile`/`Dockerfile.dev`, `.nvmrc`, `ansible/requirements.yml`, `terraform/main.tf`, and GitHub Actions workflows must be pinned to an exact version (no ranges, no `^`/`~`). Update one at a time and run tests after each.

## Architecture

### App structure (`src/app`, Next.js App Router)

- Route folders under `src/app/` (e.g. `services/*`, `blog/`, `pricing/`, `checkout/`, `onboarding/`) are marketing/product pages; each `services/*` subfolder is a dedicated landing page per vertical (accounting, architecture, law, marketing, managed IT).
- `src/app/api/*/route.ts` are the API routes: `contact`, `onboarding`, `stripe/create-payment-intent`, `analytics/web-vitals`, `health`, plus a Sentry test endpoint.
- `src/app/components` holds shared UI components.

### Blog (content-as-code)

- Posts live as GitHub-flavored markdown files in `content/blog/*.md` (rendered with `react-markdown` + `remark-gfm`; MDX component syntax is not supported) with YAML frontmatter (`title`, `description`, `date`, `author`, `tags`, `published`, `featured`, `coverImage`, optional `readingTime`).
- `src/lib/parseFrontmatter.ts` splits frontmatter from body via regex and parses YAML with `js-yaml` (this replaced `gray-matter` for js-yaml v4 compatibility — see recent commit history).
- `src/lib/blog.ts` reads `content/blog`, validates required frontmatter, computes reading time, and exposes `getAllBlogPosts`, `getBlogPostBySlug`, `getFeaturedBlogPosts`, `getBlogPostsByTag`, `getAllTags`, tag<->slug helpers. All blog pages/routes go through these functions rather than touching the filesystem directly.
- `scripts/validate-blog-posts.js` validates post frontmatter outside of the app (used in CI/pre-commit).

### SEO / structured data

`src/lib/schema.ts` centralizes JSON-LD builders (`LocalBusiness`, `BreadcrumbList`, `Service`, `FAQPage`, `Article`) around a single hardcoded `SITE_URL`. Pages compose these rather than inlining schema.org objects.

### Payments

`src/lib/stripe.ts` + `src/app/api/stripe/create-payment-intent/route.ts` + `@stripe/stripe-js`/`@stripe/react-stripe-js` on the client power the `checkout` flow.

### Analytics / observability

Three parallel systems, each with its own lib module: `src/lib/web-vitals.ts` (Core Web Vitals → `/api/analytics/web-vitals`), `src/lib/umami.ts` (`@umami/node`), `src/lib/gtag.ts` (Google tag), plus Sentry (`sentry.server.config.ts`, `sentry.edge.config.ts`, `@sentry/nextjs`) for error tracking — `src/app/sentry-example-page` and `api/sentry-example-api` are verification routes, not product features.

### Infrastructure & deployment

- `terraform/` provisions DigitalOcean infra; supports local or remote backend, selected by `terraform/select-backend.sh` / `BACKEND` var.
- `ansible/` (`staging-deploy.yml`, `production-deploy.yml`) configures/deploys onto provisioned droplets.
- `justfile` is the orchestration layer over both — prefer it over invoking `terraform`/`ansible-playbook` directly, since it wraps confirmation prompts for destructive ops (`destroy`, `terraform-destroy`, `dev-clean`) and validates env files first.
- `.github/workflows/deploy.yml` is the unified CI/CD workflow: branch `staging` → staging build/deploy, branch `main` → production build/deploy, using image promotion (single image built once, promoted across environments rather than rebuilt). Other workflows handle dependency checks and manual environment destroy. Design/rationale background (including aspirational roadmap items not yet implemented) is in `docs/ci-cd-architecture.md` — treat its "Implementation Roadmap"/"Remaining Targets" sections as not-yet-done, not as current state.
- `docs/component-interaction-diagram.md`, `docs/ssh-key-management.md`, `docs/secrets-rotation-guide.md` cover system architecture and operational security procedures; read before touching secrets/SSH/deploy workflows.

## Conventions

- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`), subject line ≤ 50 chars.
- Feature branches are cut from `staging`; PRs should pass `just dev-test` first.
- Pre-commit hooks are managed via `pre-commit` (`npm run pre-commit:install` / `pre-commit:run`) — all hooks must pass before committing.
- Naming/design style guide (verb-based function names, `is`/`has`/`can` booleans, deep modules, avoid `Manager`/`Helper`/`Utils` suffixes, prefer object params over >3-4 positional params) is documented in full in `.cursor/rules/naming-conventions.mdc` and `.cursor/rules/design-principles.mdc` — apply these when writing or renaming code in this repo.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `bxmty/dotca`, driven via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
