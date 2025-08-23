# Task List: CI/CD Pipeline Image Promotion

## Relevant Files

- `.github/workflows/docker-build.yml` - Contains the current Docker image building workflow that builds staging images
- `.github/workflows/prod-deploy.yml` - Production deployment workflow updated to use promoted images with manual and automatic triggers
- `.github/workflows/stg-deploy.yml` - Staging deployment workflow enhanced with promotion readiness reporting
- `.github/workflows/workflow-coordinator.yml` - New workflow for coordinating and validating dependencies between workflows
- `.github/workflows/dependency-check.yml` - New workflow for checking deployment dependencies and ensuring proper sequencing
- `.github/workflows/production-verification.yml` - Comprehensive standalone production verification workflow with health, performance, and security checks
- `ansible/staging-deploy.yml` - Staging Ansible playbook that needs updates for image promotion integration
- `ansible/production-deploy.yml` - Production Ansible playbook that needs updates to use promoted images and Jinja2 templates
- `ansible/templates/docker-compose.yml.j2` - Docker Compose template that handles both staging and production environments
- `ansible/templates/nginx.conf.j2` - Nginx configuration template for web server setup
- `ansible/templates/nextjs-site.conf.j2` - Next.js specific Nginx site configuration
- `ansible/templates/nextjs-site-ssl.conf.j2` - SSL-enabled Nginx configuration for production
- `ansible/templates/monitor.sh.j2` - Monitoring script template for health checks
- `ansible/templates/docker_cleanup.sh.j2` - Docker cleanup script template for maintenance
- `ansible/templates/port_verification.sh.j2` - Port verification script template
- `ansible/templates/logrotate.conf.j2` - Log rotation configuration template
- `docs/DEPLOYMENT_GHCR.md` - Documentation that needs updating to reflect the new promotion workflow
- `docs/cicd-architecture-comparison.md` - System architecture comparison document showing current vs. new pipeline flow
- `docs/image-promotion-workflow.md` - Detailed image promotion workflow diagrams and process flows
- `docs/image-tagging-strategy.md` - Image tagging strategy and registry organization documentation
- `docs/rollback-strategy-retention-policy.md` - Rollback strategy and image retention policy documentation
- `docs/component-interaction-diagram.md` - Component interaction diagram for the new image promotion system

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Design System Architecture and Diagrams
  - [x] 1.1 Create system architecture diagram showing current vs. new pipeline flow
  - [x] 1.2 Design image promotion workflow diagram using mermaid.js
  - [x] 1.3 Document image tagging strategy for staging and production
  - [x] 1.4 Design rollback strategy and image retention policy
  - [x] 1.5 Create component interaction diagram for the new system

- [ ] 2.0 Implement Image Promotion Mechanism
  - [x] 2.1 Create new GitHub Actions workflow for image promotion
  - [x] 2.2 Implement Docker image copying between staging and production registries
  - [x] 2.3 Add image validation and integrity checks before promotion
  - [x] 2.4 Implement image tagging strategy (staging → production)
  - [x] 2.5 Add promotion approval mechanism (manual or automated)
  - [x] 2.6 Create image promotion status tracking and reporting

- [ ] 3.0 Update Ansible Playbooks for Image Promotion
  - [x] 3.1 Modify staging playbook to trigger image promotion after successful deployment
  - [x] 3.2 Update production playbook to pull promoted images instead of building locally
  - [x] 3.3 Integrate production playbook with existing Jinja2 templates for consistency
  - [x] 3.4 Add image verification tasks in production deployment
  - [x] 3.5 Implement image rollback tasks in production playbook
  - [x] 3.6 Update environment variable handling for promoted images
  - [x] 3.7 Add health checks to verify promoted image deployment
  - [x] 3.8 Ensure production uses SSL-enabled Nginx configuration from templates

- [x] 4.0 Implement Rollback Capability
  - [x] 4.1 Create rollback workflow in GitHub Actions
  - [x] 4.2 Implement image history tracking for rollback targets
  - [x] 4.3 Add rollback approval and notification mechanisms
  - [x] 4.4 Create rollback verification and health check tasks
  - [x] 4.5 Implement rollback status reporting and audit logging

- [ ] 5.0 Update Production Deployment Pipeline
  - [x] 5.1 Modify production GitHub Actions workflow to use image promotion
  - [x] 5.2 Update workflow dependencies to ensure proper sequencing
  - [x] 5.3 Add production deployment verification steps
  - [ ] 5.4 Implement deployment status reporting and notifications
  - [ ] 5.5 Add integration tests for the complete promotion pipeline
  - [ ] 5.6 Update documentation and deployment guides

- [ ] 6.0 Add Error Handling and Audit Trail
  - [ ] 6.1 Implement comprehensive error handling in image promotion workflow
  - [ ] 6.2 Add detailed logging for all promotion and deployment steps
  - [ ] 6.3 Create audit trail for image promotions, deployments, and rollbacks
  - [ ] 6.4 Implement error notification system for failed promotions
  - [ ] 6.5 Add retry mechanisms for transient failures
  - [ ] 6.6 Create error recovery procedures and documentation

- [ ] 7.0 Cleanup and Remove Legacy Pipeline Files
  - [ ] 7.1 Identify and remove any unused GitHub Actions workflows
  - [ ] 7.2 Clean up deprecated Ansible playbook files or tasks
  - [ ] 7.3 Remove any legacy Docker build scripts or configurations
  - [ ] 7.4 Clean up unused environment variables and secrets
  - [ ] 7.5 Remove any temporary or test files created during development
  - [ ] 7.6 Update .gitignore to exclude any new temporary files
  - [ ] 7.7 Verify no broken references remain in documentation
  - [ ] 7.8 Final cleanup verification and system health check
