# Image Promotion Workflow

## Overview

This document details the comprehensive workflow for promoting tested staging images to production in the DotCA CI/CD pipeline. The workflow includes sophisticated error handling, extensive validation, manual approval gates, and complete audit logging to ensure secure and reliable production deployments.

## Main Promotion Workflow

The actual image promotion workflow is significantly more sophisticated than basic validation and copying. It includes comprehensive error handling, extensive logging, and multiple safety mechanisms.

```mermaid
flowchart TD
    A[Manual Workflow Dispatch] --> B[error-handler: Setup Error Handling]
    B --> C[validate-promotion-conditions: Initial Validation]

    C --> D{Conditions Valid?}
    D -->|No| E[Handle Validation Failure]
    D -->|Yes| F[notify-promotion-start: Send Notifications]

    F --> G[promote-staging-image-to-production: Main Promotion Job]
    G --> H{Requires Manual Approval?}

    H -->|Yes| I[Pause for Manual Approval]
    I --> J{Approval Granted?}
    J -->|No| K[Cancel Promotion]
    J -->|Yes| L[Proceed with Validation]

    H -->|No| L
    L --> M[Image Integrity Validation]
    M --> N{All Checks Pass?}
    N -->|No| O[Force Promotion?]
    O -->|Yes| P[Proceed with Warnings]
    O -->|No| Q[Fail Promotion]

    N -->|Yes| P
    P --> R[Execute Image Promotion]
    R --> S{Promotion Success?}
    S -->|No| T[Retry with Backoff]
    T --> U{Max Retries?}
    U -->|Yes| V[Fail Promotion]
    U -->|No| R

    S -->|Yes| W[Generate Promotion Summary]
    W --> X[send-promotion-notifications: Alert Stakeholders]
    X --> Y[generate-promotion-status-report: Create Audit Report]
    Y --> Z[trigger-production-deployment: Auto-deploy to Prod]

    Z --> AA[Handle Promotion Success]
    AA --> BB[Promotion Complete]

    E --> CC[Handle Promotion Failure]
    K --> CC
    Q --> CC
    V --> CC
    CC --> DD[Log Comprehensive Error Details]
    DD --> EE[Send Failure Notifications]
    EE --> FF[Generate Failure Report]

    style BB fill:#ccffcc
    style FF fill:#ff9999
    style I fill:#ffff99
```

## Detailed Sub-Workflows

### 1. Comprehensive Error Handling System

The workflow includes a sophisticated error handling system with categorized logging:

```mermaid
flowchart TD
    A[Error Occurs] --> B{Categorize Error}
    B --> C{Error Severity}
    C -->|CRITICAL| D[Immediate Failure + Notifications]
    C -->|HIGH| E[Retry Logic + Alerts]
    C -->|MEDIUM| F[Log + Continue with Warnings]
    C -->|LOW| G[Log Only]

    D --> H[Update GitHub Status]
    E --> H
    F --> H
    G --> H

    H --> I[Write to Error Log File]
    I --> J[Send to Step Summary]
    J --> K[Format for Console Display]
    K --> L[Update Error Counters]

    L --> M{Should Continue?}
    M -->|Yes| N[Proceed with Caution]
    M -->|No| O[Trigger Failure Path]

    style D fill:#ff0000
    style O fill:#ff9999
    style N fill:#ffff99
```

**Error Categories:**

- **VALIDATION**: Image integrity and metadata issues
- **NETWORK**: Registry connectivity problems
- **AUTHENTICATION**: GHCR access issues
- **REGISTRY**: Docker registry operations
- **DOCKER**: Container runtime issues
- **PERMISSION**: Access control problems
- **TIMEOUT**: Operation timeouts
- **UNKNOWN**: Unclassified errors

### 2. Image Validation Process

The actual validation process is much more comprehensive than basic checks:

```mermaid
flowchart TD
    A[Start Image Validation] --> B[Verify Image Exists in Registry]
    B --> C{Image Found?}
    C -->|No| D[Fail - Image Not Found]

    C -->|Yes| E[Pull Image for Inspection]
    E --> F[Check Image Size Limits]
    F --> G{Size Valid?}
    G -->|No| H[Fail - Size Out of Bounds]

    G -->|Yes| I[Validate Image Architecture]
    I --> J{Architecture Supported?}
    J -->|No| K[Fail - Unsupported Architecture]

    J -->|Yes| L[Inspect Image Layers]
    L --> M{Layers Intact?}
    M -->|No| N[Fail - Corrupted Layers]

    M -->|Yes| O[Validate Image Metadata]
    O --> P{Metadata Complete?}
    P -->|No| Q[Fail - Missing Metadata]

    P -->|Yes| R[Check Image Labels]
    R --> S{Required Labels Present?}
    S -->|No| T[Fail - Missing Labels]

    S -->|Yes| U[Verify CMD/ENTRYPOINT]
    U --> V{CMD Valid?}
    V -->|No| W[Fail - Invalid CMD]

    V -->|Yes| X[Security Scan Available?]
    X -->|Yes| Y[Run Security Scan]
    X -->|No| Z[Skip Security Scan]

    Y --> AA{Security Issues?}
    AA -->|Critical| BB[Fail - Security Risk]
    AA -->|High| CC[Warning - Review Needed]
    AA -->|Low| DD[Log - Acceptable Risk]

    Z --> EE[Validation Complete]
    CC --> EE
    DD --> EE

    style D fill:#ff9999
    style H fill:#ff9999
    style K fill:#ff9999
    style N fill:#ff9999
    style Q fill:#ff9999
    style T fill:#ff9999
    style W fill:#ff9999
    style BB fill:#ff9999
    style EE fill:#ccffcc
```

### 3. Audit Logging and Compliance

The workflow maintains comprehensive audit trails for compliance and debugging:

```mermaid
flowchart TD
    A[Promotion Event] --> B[Initialize Audit Log]
    B --> C[Capture Environment Context]
    C --> D[Log Workflow Metadata]

    D --> E[Log Key Decisions]
    E --> F[Record User Actions]
    F --> G[Document Validation Results]

    G --> H[Log Image Metadata]
    H --> I[Record Registry Operations]
    I --> J[Document Approval Process]

    J --> K[Archive to Artifacts]
    K --> L[Upload to GitHub]
    L --> M[Send to External Storage]

    M --> N[Generate Audit Summary]
    N --> O[Create Compliance Report]
    O --> P[Audit Trail Complete]

    style P fill:#ccffcc
```

**Audit Log Contents:**

- **Workflow Metadata**: Run ID, actor, repository, timestamps
- **Image Information**: Source/destination tags, SHA256 hashes, sizes
- **Validation Results**: All checks performed with pass/fail status
- **Approval Records**: Who approved, when, and under what conditions
- **Error Details**: Categorized errors with context and resolution attempts
- **Performance Metrics**: Timing data for each major operation

### 4. Manual Approval Process

The workflow includes sophisticated manual approval mechanisms:

```mermaid
flowchart TD
    A[Promotion Requires Approval] --> B[Check Environment Protection]
    B --> C{Approval Required?}

    C -->|No| D[Auto-approve for Safe Environments]
    C -->|Yes| E[Pause Workflow Execution]

    E --> F[Send Approval Request Notifications]
    F --> G[Display Approval UI in GitHub]
    G --> H[Wait for Reviewer Action]

    H --> I{Approval Decision}
    I -->|Approved| J[Log Approval Details]
    I -->|Rejected| K[Log Rejection Reason]
    I -->|Timeout| L[Auto-reject After Timeout]

    J --> M[Resume Workflow Execution]
    M --> N[Proceed with Promotion]

    K --> O[Cancel Promotion]
    L --> O
    O --> P[Send Rejection Notifications]
    P --> Q[Generate Cancellation Report]

    style D fill:#ccffcc
    style N fill:#ccffcc
    style O fill:#ff9999
```

**Approval Features:**

- **Environment Protection Rules**: Configurable required reviewers
- **Timeout Handling**: Automatic rejection after inactivity
- **Audit Trail**: Complete record of who approved/rejected and when
- **Notifications**: Alerts to stakeholders about pending approvals
- **Comments Support**: Reviewers can add approval comments

### 7. Rollback Process

The promotion workflow integrates with comprehensive rollback capabilities:

```mermaid
flowchart TD
    A[Promotion Failure Detected] --> B{Auto-Rollback Enabled?}
    B -->|Yes| C[Trigger Rollback Workflow]
    B -->|No| D[Manual Rollback Required]

    C --> E[Identify Optimal Rollback Target]
    E --> F{Target Available?}
    F -->|No| G[Fail - No Rollback Option]
    F -->|Yes| H[Execute Rollback Deployment]

    D --> I[Send Rollback Instructions]
    I --> J[Wait for Manual Execution]
    J --> K{Manual Rollback Complete?}
    K -->|No| L[Escalate to On-Call]
    K -->|Yes| M[Verify Rollback Success]

    H --> M
    M --> N{Rollback Successful?}
    N -->|No| O[Rollback Failed - Alert Team]
    N -->|Yes| P[Rollback Complete]

    L --> Q[Critical Incident Response]
    O --> Q
    Q --> R[Manual Intervention Required]

    style P fill:#ccffcc
    style G fill:#ff9999
    style R fill:#ff0000
```

**Rollback Integration Features:**

- **Automatic Triggers**: Failed promotions can auto-trigger rollback workflows
- **Target Selection**: Intelligent selection of best rollback image
- **Health Verification**: Post-rollback health checks and validation
- **Notification Cascade**: Alerts for rollback events and outcomes

## Workflow States and Transitions

### Comprehensive Promotion States

The actual workflow has more granular states than basic promotion steps:

1. **Initializing** - Setting up error handling utilities and logging
2. **Validating Conditions** - Checking prerequisites and environment readiness
3. **Pending Approval** - Awaiting manual reviewer approval (if required)
4. **Approval Granted** - Manual approval received, proceeding with validation
5. **Validation Running** - Comprehensive image integrity and security checks
6. **Validation Passed** - All checks completed successfully
7. **Validation Failed** - Checks failed, force promotion may be available
8. **Promotion Running** - Actively copying image to production registry
9. **Promotion Retrying** - Retry logic for transient failures
10. **Promotion Failed** - All retries exhausted, promotion unsuccessful
11. **Promotion Succeeded** - Image successfully promoted to production
12. **Generating Reports** - Creating audit logs and status reports
13. **Notifications Sent** - Stakeholders notified of outcome
14. **Triggering Deployment** - Automatic production deployment initiated
15. **Completed Successfully** - Full promotion and deployment cycle complete
16. **Failed** - Promotion failed with comprehensive error reporting

### Key Decision Points

- **Manual Approval Required**: Environment protection rules and reviewer requirements
- **Force Promotion Available**: Override validation failures for emergency deployments
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Error Severity**: Critical errors trigger immediate failure, others may allow continuation
- **Rollback Triggers**: Automatic rollback on deployment failures
- **Notification Channels**: Multiple communication channels based on event severity

### Error Recovery Mechanisms

- **Categorized Error Handling**: Errors classified by severity (Critical, High, Medium, Low)
- **Automatic Retry Logic**: Configurable retry attempts with backoff strategies
- **Force Promotion Option**: Emergency override for validation failures
- **Rollback Integration**: Automatic triggers for failed promotions
- **Comprehensive Logging**: Detailed error logs with context and resolution attempts
- **Stakeholder Notifications**: Immediate alerts for failures and recovery actions

## Integration Points

### GitHub Actions Ecosystem

- **deploy.yml**: Unified workflow that builds environment-specific images
- **deployment-dashboard.yml**: Provides deployment status and notifications
- **deployment-metrics.yml**: Tracks deployment metrics and performance
- **rollback.yml**: Emergency rollback capability integration
- **deployment-notifications.yml**: Centralized notification system (reusable workflow)
- **workflow-coordinator.yml**: Validates workflow dependencies and sequencing

### Infrastructure Integration

- **Terraform**: Infrastructure provisioning for staging and production environments
- **Ansible**: Application deployment and configuration management
- **DigitalOcean**: Cloud infrastructure provider (droplets, networking, DNS)
- **GitHub Container Registry**: Private image storage and distribution

### Security and Compliance

- **GitHub Environments**: Protected environments with required reviewers
- **GitHub Secrets**: Encrypted storage for API keys, tokens, and credentials
- **SSH Key Management**: Secure server access with fingerprint validation
- **Audit Logging**: Comprehensive compliance trail for all operations

### Monitoring and Alerting

- **Real-time Notifications**: Slack, Teams, Email, and GitHub integrations
- **Health Monitoring**: Automated health checks and endpoint validation
- **Performance Tracking**: Deployment timing and resource usage metrics
- **Error Categorization**: Structured error reporting with severity levels
- **Status Dashboards**: Visual monitoring of deployment pipeline status

### External Service Integration

- **Brevo (Email)**: Transactional email notifications
- **Stripe**: Payment processing (if applicable)
- **Google Analytics**: Usage tracking and analytics
- **DigitalOcean Spaces**: Object storage for backups and assets
