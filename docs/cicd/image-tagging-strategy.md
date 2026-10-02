# Image Tagging Strategy for CI/CD Pipeline

## Overview

`deploy.yml` builds a fresh image for the environment it is deploying. A push to `staging` builds and deploys staging. A push to `main` builds and deploys production. Production is not a retag of the staging image: the two builds inline different `NEXT_PUBLIC_*` values.

## Build identity (what `deploy.yml` pushes)

A deploy tag names one build. The commit SHA is not enough: rebuilding that commit with a different secret or build arg produces a different image. `scripts/build-image-tag.cjs` names the image

```text
<branch>-<full commit sha>-<run id>-<run attempt>
```

for example `staging-03f064a1b2c3d4e5f678901234567890abcdef01-18473920123-1`. The workflow run id changes on every run, including `workflow_dispatch`. The run attempt changes when failed jobs are re-run. Both environments use this tag.

Each push also moves a branch pointer, `:staging` or `:main`. Pushes to `main` also move `:latest`. Those three names always mean "whatever was pushed last." They are not rollback targets. Deploy uses the build-identity tag.

The Actions summary of the deploy run records that tag and the image digest. On the host, the running container's image name is that tag, and `docker image inspect --format '{{.RepoDigests}}' ghcr.io/bxmty/dotca:<tag>` is the digest. Those two together are one artifact.

### Rollback

Re-running the workflow builds a new image under a new run id. That is a new deploy, not a return to an earlier one.

To roll back, deploy the earlier build's tag. The playbooks read the Ansible variable `DEPLOY_DOCKER_IMAGE` (the same one CI writes into the inventory). Pass it as an extra var; a shell variable of that name is not visible to the play:

```bash
ansible-playbook -i inventory/deploy.ini staging-deploy.yml \
  -e DEPLOY_DOCKER_IMAGE=ghcr.io/bxmty/dotca:staging-03f064a1b2c3d4e5f678901234567890abcdef01-18473920123-1
```

Production uses the same extra var with `production-deploy.yml` and a `main-…` tag. Take the tag from the summary of the run you are returning to. The playbook's `docker pull` re-resolves that tag against the registry, including when the host already has it. If that tag is missing from the registry, the play fails. It does not substitute the moving `:staging` or `:main` tag.

Do not mint a separate `:rollback-*` tag. The original tag already names that build.

## Tags in the registry

```
ghcr.io/bxmty/dotca/
├── :staging                                          # moving pointer, staging branch
├── :staging-{full sha}-{run id}-{run attempt}       # one staging build; this is what deploy runs
├── :main                                             # moving pointer, main branch
├── :main-{full sha}-{run id}-{run attempt}          # one production build; this is what deploy runs
└── :latest                                           # moving pointer, same image as the newest :main push
```

| Tag                                     | Written by                         | Use it to                                       |
| --------------------------------------- | ---------------------------------- | ----------------------------------------------- |
| `:staging-{sha}-{run id}-{run attempt}` | `deploy.yml` on the staging branch | Deploy or roll back that staging build          |
| `:main-{sha}-{run id}-{run attempt}`    | `deploy.yml` on main               | Deploy or roll back that production build       |
| `:staging`, `:main`, `:latest`          | the same push, as aliases          | See what was last pushed. Not a rollback target |

## How the workflow writes them

`quality-and-build` runs `scripts/build-image-tag.cjs` with the branch name, the full commit SHA, `github.run_id`, and `github.run_attempt`. That string is both a pushed tag and the tag the deploy job hands to Ansible as `DEPLOY_DOCKER_IMAGE`.

`docker/metadata-action` also applies the branch name (`staging` or `main`) and, on the default branch, `latest`. It does not apply a tag of only the commit SHA. That name is what a later rebuild of the same commit used to overwrite.

## Pull on the host

Compose keeps `pull_policy: missing`, so a later restart does not log in to GHCR after the CI token has expired. The deploy playbook still runs `docker pull` on the build-identity tag before `up`. A first deploy of that tag would be pulled either way. The explicit pull covers a retry or a rollback, where the host may already have the tag, and a registry tag that has been overwritten.

## Retention

`.github/workflows/image-cleanup.yml` runs weekly. It deletes untagged versions and keeps the 50 most recent package versions (`min_versions` on a manual run). It does not delete by tag pattern. Build-identity tags remain the way to name an old build for as long as that version is inside the retained set.

## What this pipeline does not do

- It does not promote by retagging `:staging` as `:main`. Merging to `main` builds a new production image.
- It does not push `:v1.2.3`, `:stable`, `:canary`, `:staging-{branch}`, `:staging-build-{n}`, or `:rollback-*`.
