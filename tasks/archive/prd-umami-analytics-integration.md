# Product Requirements Document: Umami Analytics Integration

## Introduction/Overview

This PRD outlines the requirements for integrating Umami analytics into our application to enable self-hosted web monitoring. Umami will complement our existing Google Analytics and Google Search Console setup by providing privacy-focused, self-hosted analytics that helps us monitor site performance and track visitor-to-lead conversion rates.

## Goals

1. **Monitor Site Performance**: Track page views, user sessions, and engagement metrics to understand how visitors interact with our site
2. **Track Conversion Rates**: Measure the effectiveness of our site in converting visitors to leads through custom event tracking
3. **Maintain Data Privacy**: Implement a self-hosted solution that gives us full control over user data
4. **Complement Existing Tools**: Work alongside Google Analytics and Google Search Console rather than replace them
5. **Developer-Friendly Dashboard**: Provide business stakeholders and developers with easy-to-understand analytics data

## User Stories

### Business Stakeholder
- As a business stakeholder, I want to see real-time visitor counts and page popularity so that I can understand which content resonates with our audience
- As a business stakeholder, I want to track conversion funnels from visitor to lead so that I can measure the effectiveness of our marketing efforts
- As a business stakeholder, I want to view analytics data without relying on third-party services so that I maintain control over our data privacy

### Developer
- As a developer, I want to implement custom event tracking for lead generation forms so that we can measure conversion rates accurately
- As a developer, I want to deploy Umami on the same infrastructure as our application so that I can manage everything in one place
- As a developer, I want to ensure proper SSL configuration for the analytics dashboard so that users can access it securely

## Functional Requirements

### Next.js Integration
1. The system must include Umami tracking script in the application layout
2. The system must track basic page views automatically on route changes
3. The system must support custom event tracking for key user actions
4. The system must track lead generation form submissions as conversion events
5. The system must handle tracking in development and production environments appropriately
6. The system must exclude bot traffic from analytics data

### Ansible Deployment
7. The system must deploy Umami on the same VM as the application
8. The system must configure SSL certificates for secure access to the analytics dashboard
9. The system must initialize and configure the database using existing Terraform infrastructure
10. The system must set up proper environment variables for Umami configuration
11. The system must configure nginx reverse proxy for the Umami dashboard
12. The system must set up automated backups for the analytics database

### Analytics Dashboard
13. The system must provide a web-based dashboard accessible at a dedicated subdomain
14. The system must display real-time visitor statistics
15. The system must show page view trends and popular content
16. The system must allow filtering analytics data by date ranges
17. The system must provide export functionality for analytics data

## Non-Goals (Out of Scope)

1. Replacing existing Google Analytics implementation
2. Advanced user segmentation and cohort analysis
3. Integration with external marketing automation tools
4. Mobile app analytics tracking
5. Real-time alerting and notification systems
6. Advanced privacy controls beyond basic GDPR compliance

## Technical Considerations

### Infrastructure
- Deploy on existing VM alongside the main application
- Use existing Terraform-managed database infrastructure
- Configure SSL using existing certificate management setup
- Set up nginx reverse proxy with existing configuration patterns

### Integration Points
- Integrate with existing Next.js application structure
- Follow existing Ansible playbook patterns for deployment
- Maintain consistency with current monitoring and logging setup

### Performance Impact
- Ensure tracking script doesn't significantly impact page load times
- Implement proper caching for analytics assets
- Monitor resource usage on the shared VM

## Success Metrics

1. **Data Accuracy**: Analytics dashboard shows accurate visitor counts and page views within 5% of Google Analytics
2. **Conversion Tracking**: Successfully track at least 95% of lead generation form submissions
3. **Performance**: Page load time increase of less than 100ms due to analytics tracking
4. **Uptime**: Analytics dashboard available 99.9% of the time
5. **User Adoption**: Business stakeholders regularly access the dashboard for decision-making

## Open Questions

1. What specific custom events should we track beyond basic page views and form submissions?
2. Should we implement user identification features for tracking returning visitors?
3. Are there any specific privacy requirements or cookie consent mechanisms needed?
4. What subdomain should be used for the analytics dashboard (e.g., analytics.example.com)?
5. Should we implement any rate limiting for the analytics API to prevent abuse?

## Implementation Timeline

### Phase 1: Infrastructure Setup (Week 1)
- Deploy Umami on existing VM
- Configure database and SSL
- Set up nginx reverse proxy

### Phase 2: Next.js Integration (Week 2)
- Add Umami tracking script
- Implement basic page view tracking
- Set up custom event tracking for conversions

### Phase 3: Testing and Validation (Week 3)
- Test analytics data accuracy
- Validate conversion tracking
- Performance testing and optimization

### Phase 4: Deployment and Monitoring (Week 4)
- Deploy to production
- Set up monitoring and alerts
- Train stakeholders on dashboard usage
