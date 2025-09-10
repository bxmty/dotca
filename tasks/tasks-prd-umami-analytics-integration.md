## Relevant Files

- `ansible/templates/docker-compose.yml.j2` - Update docker-compose template to include Umami service
- `ansible/staging-deploy.yml` - Update Ansible playbook for Umami deployment
- `ansible/templates/nginx-umami-site.conf.j2` - New nginx configuration for Umami dashboard
- `src/app/layout.tsx` - Add Umami tracking script alongside existing Google Analytics
- `src/lib/umami.ts` - New utility functions for Umami tracking
- `src/app/components/UmamiAnalytics.tsx` - New React component for Umami tracking
- `src/lib/analytics.ts` - Unified analytics interface for both GA and Umami
- `terraform/main.tf` - May need updates for additional database resources if required
- `package.json` - Add @umami/node package for server-side tracking
- `src/app/components/UmamiAnalytics.test.tsx` - Unit tests for Umami component
- `src/lib/umami.test.ts` - Unit tests for Umami utilities

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `UmamiAnalytics.tsx` and `UmamiAnalytics.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by Jest configuration.
- Umami will run on the same VM as the main application using existing Docker infrastructure
- SSL certificates will use the existing Let's Encrypt setup
- Database will use existing Terraform-managed infrastructure

## Tasks

- [ ] 2.0 Set up Umami infrastructure (Docker deployment, database, SSL configuration)
  - [ ] 2.1 Create Umami environment configuration file with database connection settings
  - [ ] 2.2 Update docker-compose.yml.j2 template to include Umami service with PostgreSQL database
  - [ ] 2.3 Configure Umami environment variables for production/staging environments
  - [ ] 2.4 Set up persistent volumes for Umami database data using existing volume patterns
  - [ ] 2.5 Configure SSL certificate for Umami dashboard subdomain using existing Let's Encrypt setup
  - [ ] 2.6 Update firewall rules to allow access to Umami dashboard port (if different from main app)

- [ ] 3.0 Configure Ansible playbooks for Umami deployment and nginx reverse proxy
  - [ ] 3.1 Update staging-deploy.yml to include Umami Docker image pull and service startup
  - [ ] 3.2 Create nginx-umami-site.conf.j2 template for Umami dashboard reverse proxy
  - [ ] 3.3 Add Umami nginx site configuration to Ansible deployment tasks
  - [ ] 3.4 Configure automated backup tasks for Umami database in monitoring script
  - [ ] 3.5 Update health check monitoring to include Umami service status
  - [ ] 3.6 Add Umami environment variables to Ansible variable management

- [ ] 4.0 Integrate Umami tracking into Next.js application
  - [ ] 4.1 Install @umami/node package for server-side tracking capabilities
  - [ ] 4.2 Create src/lib/umami.ts with tracking utility functions (pageview, event tracking)
  - [ ] 4.3 Create src/app/components/UmamiAnalytics.tsx React component for client-side tracking
  - [ ] 4.4 Add Umami tracking script to src/app/layout.tsx alongside existing Google Analytics
  - [ ] 4.5 Create src/lib/analytics.ts unified interface for both GA and Umami tracking
  - [ ] 4.6 Add Umami environment variables to existing Next.js environment configuration

- [ ] 5.0 Implement custom event tracking for lead generation conversion
  - [ ] 5.1 Identify all lead generation forms in the application (contact forms, signup forms, etc.)
  - [ ] 5.2 Add Umami event tracking to form submission handlers for conversion measurement
  - [ ] 5.3 Implement custom events for key user interactions (button clicks, feature usage)
  - [ ] 5.4 Add server-side event tracking for critical conversion events using @umami/node
  - [ ] 5.5 Create reusable tracking hooks for consistent event tracking across components
  - [ ] 5.6 Test event tracking implementation in development environment

- [ ] 6.0 Test and validate analytics data accuracy and performance
  - [ ] 6.1 Deploy Umami to staging environment and verify dashboard accessibility
  - [ ] 6.2 Validate that page view tracking works correctly on route changes
  - [ ] 6.3 Test custom event tracking for lead generation forms in staging
  - [ ] 6.4 Measure performance impact of Umami tracking on page load times (<100ms target)
  - [ ] 6.5 Compare Umami data accuracy with Google Analytics for same time period
  - [ ] 6.6 Test Umami dashboard functionality (date filtering, export features, real-time data)
  - [ ] 6.7 Validate SSL certificate setup and secure access to analytics dashboard
  - [ ] 6.8 Perform load testing to ensure Umami doesn't impact main application performance
  - [ ] 6.9 Test automated backup and monitoring functionality
  - [ ] 6.10 Document dashboard access and usage instructions for stakeholders
