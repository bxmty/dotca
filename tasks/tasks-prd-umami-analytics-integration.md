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

### Phase 1: Staging Environment Setup and Testing

- [ ] 1.0 Set up Umami infrastructure for staging environment
  - [x] 1.1 Create Umami environment configuration file with database connection settings for staging
  - [x] 1.2 Update docker-compose.yml.j2 template to include Umami service with PostgreSQL database
  - [x] 1.3 Configure Umami environment variables for staging environment
  - [x] 1.4 Set up persistent volumes for Umami database data using existing volume patterns
  - [x] 1.5 Configure SSL certificate for Umami dashboard subdomain in staging environment
  - [x] 1.6 Update firewall rules to allow access to Umami dashboard port in staging

- [ ] 2.0 Configure staging Ansible playbook for Umami deployment
  - [x] 2.1 Update staging-deploy.yml to include Umami Docker image pull and service startup
  - [x] 2.2 Create nginx-umami-site.conf.j2 template for Umami dashboard reverse proxy
  - [x] 2.3 Add Umami nginx site configuration to staging deployment tasks
  - [x] 2.4 Configure automated backup tasks for Umami database in staging monitoring script
  - [x] 2.5 Update health check monitoring to include Umami service status in staging
  - [x] 2.6 Add Umami environment variables to staging Ansible variable management

- [ ] 3.0 Integrate Umami tracking into Next.js application (staging)
  - [x] 3.1 Install @umami/node package for server-side tracking capabilities
  - [x] 3.2 Create src/lib/umami.ts with tracking utility functions (pageview, event tracking)
  - [x] 3.3 Create src/app/components/UmamiAnalytics.tsx React component for client-side tracking
  - [x] 3.4 Add Umami tracking script to src/app/layout.tsx alongside existing Google Analytics
  - [x] 3.5 Create src/lib/analytics.ts unified interface for both GA and Umami tracking
  - [ ] 3.6 Add Umami environment variables to staging Next.js environment configuration

- [ ] 4.0 Implement and test custom event tracking in staging
  - [ ] 4.1 Identify all lead generation forms in the application (contact forms, signup forms, etc.)
  - [ ] 4.2 Add Umami event tracking to form submission handlers for conversion measurement
  - [ ] 4.3 Implement custom events for key user interactions (button clicks, feature usage)
  - [ ] 4.4 Add server-side event tracking for critical conversion events using @umami/node
  - [ ] 4.5 Create reusable tracking hooks for consistent event tracking across components
  - [ ] 4.6 Test event tracking implementation in development environment
  - [ ] 4.7 Test custom event tracking in staging environment

- [ ] 5.0 Test and validate staging environment
  - [ ] 5.1 Deploy Umami to staging environment and verify dashboard accessibility
  - [ ] 5.2 Validate that page view tracking works correctly on route changes in staging
  - [ ] 5.3 Test custom event tracking for lead generation forms in staging
  - [ ] 5.4 Measure performance impact of Umami tracking on page load times in staging (<100ms target)
  - [ ] 5.5 Compare Umami data accuracy with Google Analytics for same time period in staging
  - [ ] 5.6 Test Umami dashboard functionality in staging (date filtering, export features, real-time data)
  - [ ] 5.7 Validate SSL certificate setup and secure access to analytics dashboard in staging
  - [ ] 5.8 Perform load testing to ensure Umami doesn't impact main application performance in staging
  - [ ] 5.9 Test automated backup and monitoring functionality in staging

### Phase 2: Production Environment Setup and Testing (After Staging Validation)

- [ ] 6.0 Set up Umami infrastructure for production environment
  - [ ] 6.1 Update Umami environment configuration file with production database connection settings
  - [ ] 6.2 Configure Umami environment variables for production environment
  - [ ] 6.3 Configure SSL certificate for Umami dashboard subdomain in production environment
  - [ ] 6.4 Update firewall rules to allow access to Umami dashboard port in production

- [ ] 7.0 Configure production Ansible playbook for Umami deployment
  - [ ] 7.1 Update production-deploy.yml to include Umami Docker image pull and service startup
  - [ ] 7.2 Add Umami nginx site configuration to production deployment tasks
  - [ ] 7.3 Configure automated backup tasks for Umami database in production monitoring script
  - [ ] 7.4 Update health check monitoring to include Umami service status in production
  - [ ] 7.5 Add Umami environment variables to production Ansible variable management

- [ ] 8.0 Deploy Umami tracking to production
  - [ ] 8.1 Add Umami environment variables to production Next.js environment configuration
  - [ ] 8.2 Test custom event tracking in production environment

- [ ] 9.0 Test and validate production environment
  - [ ] 9.1 Deploy Umami to production environment and verify dashboard accessibility
  - [ ] 9.2 Validate that page view tracking works correctly on route changes in production
  - [ ] 9.3 Test custom event tracking for lead generation forms in production
  - [ ] 9.4 Measure performance impact of Umami tracking on page load times in production (<100ms target)
  - [ ] 9.5 Compare Umami data accuracy with Google Analytics for same time period in production
  - [ ] 9.6 Test Umami dashboard functionality in production (date filtering, export features, real-time data)
  - [ ] 9.7 Validate SSL certificate setup and secure access to analytics dashboard in production
  - [ ] 9.8 Perform load testing to ensure Umami doesn't impact main application performance in production
  - [ ] 9.9 Test automated backup and monitoring functionality in production
  - [ ] 9.10 Document dashboard access and usage instructions for stakeholders (staging and production)
  - [ ] 9.11 Validate data synchronization between staging and production environments
