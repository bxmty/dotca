# Component Interaction Diagram for Unified Deployment System

## Overview

This document provides a comprehensive view of how all components in the unified deployment system interact with each other, showing data flow, triggers, and dependencies between different parts of the system.

## System Architecture Overview

```mermaid
graph TB
    subgraph "Source Control"
        A[Git Repository]
        B[Staging Branch]
        C[Main Branch]
    end

    subgraph "CI/CD Pipeline"
        D[GitHub Actions]
        E[Unified Deploy Workflow]
        F[Deployment Dashboard]
        G[Metrics Collection]
        H[Log Aggregation]
        I[Image Cleanup]
    end

    subgraph "Container Registry"
        J[GHCR Registry]
        K[Staging Images]
        L[Production Images]
        M[Image Storage]
    end

    subgraph "Infrastructure"
        N[Staging Environment]
        O[Production Environment]
        P[DigitalOcean Droplets]
    end

    subgraph "Deployment Automation"
        Q[Ansible Playbooks]
        R[Terraform Infrastructure]
    end

    subgraph "Monitoring & Alerting"
        S[Health Checks]
        T[Deployment Metrics]
        U[Notification System]
        V[Sentry Error Monitoring]
        W[Sentry Performance Tracing]
        X[Sentry Session Replay]
    end

    subgraph "Supporting Workflows"
        V[Dependency Check]
        W[Image Cleanup]
    end

    A --> B
    A --> C
    B --> E
    C --> E
    E --> J
    J --> K
    J --> L
    K --> N
    L --> O
    N --> Q
    O --> Q
    P --> R
    N --> S
    O --> S
    N --> V
    O --> V
    S --> T
    T --> U
    V --> W
    V --> X
    E --> F
    E --> G
    E --> H
    W --> M
    V --> E
```

## Detailed Component Interactions

### 1. Unified Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant WF as Unified Deploy Workflow
    participant Detect as Environment Detection
    participant Build as Build & Test
    participant GHCR as GHCR Registry
    participant Deploy as Deploy Action
    participant TF as Terraform
    participant ANS as Ansible
    participant Env as Environment
    participant Monitor as Monitoring

    Dev->>GH: Push to branch (staging/main)
    GH->>WF: Trigger deploy.yml
    WF->>Detect: Detect environment from branch
    Detect->>WF: Environment: staging/production

    alt Staging Branch
        WF->>Build: Build staging image
        Build->>GHCR: Push staging image
        WF->>Deploy: Deploy to staging
    else Main Branch
        WF->>Build: Build production image
        Build->>GHCR: Push production image
        WF->>Deploy: Deploy to production (with approval)
    end

    Deploy->>TF: Setup infrastructure
    TF->>Env: Provision resources
    Deploy->>ANS: Deploy application
    ANS->>Env: Configure and start services
    Deploy->>Monitor: Run health checks
    Monitor->>WF: Deployment status
    WF->>GH: Update deployment status
```

### 2. Environment Detection Flow

```mermaid
sequenceDiagram
    participant Trigger as Workflow Trigger
    participant Detect as Environment Detection Job
    participant Check as Change Detection
    participant Output as Output Variables

    Trigger->>Detect: Push event or manual dispatch
    Detect->>Check: Analyze changed files
    Check->>Detect: App changed / Infra changed

    alt Branch is staging
        Detect->>Output: environment=staging
        Detect->>Output: should_build=true
        Detect->>Output: should_deploy=true
    else Branch is main
        Detect->>Output: environment=production
        Detect->>Output: should_build=true
        Detect->>Output: should_deploy=true
    end

    Output->>Detect: Configuration ready
    Detect->>Trigger: Continue pipeline
```

### 3. Build and Quality Assurance Flow

```mermaid
sequenceDiagram
    participant WF as Workflow
    participant Build as Quality & Build Job
    participant Lint as Linting
    participant Test as Unit Tests
    participant Security as Security Scan
    participant Docker as Docker Build
    participant GHCR as GHCR Registry

    WF->>Build: Start quality checks
    Build->>Lint: Run ESLint
    Lint->>Build: Lint results
    Build->>Test: Run Jest tests
    Test->>Build: Test results & coverage
    Build->>Security: Run npm audit
    Security->>Build: Security scan results

    alt All checks pass
        Build->>Docker: Build Docker image
        Docker->>GHCR: Push image with tags
        GHCR->>Build: Image digest
        Build->>WF: Build success
    else Checks fail
        Build->>WF: Build failure
    end
```

### 4. Deployment Flow

```mermaid
sequenceDiagram
    participant WF as Workflow
    participant Deploy as Deploy Job
    participant Action as Deploy Action
    participant TF as Terraform
    participant ANS as Ansible
    participant Server as DigitalOcean Droplet
    participant Health as Health Check

    WF->>Deploy: Start deployment
    Deploy->>Action: Execute deploy action
    Action->>TF: Initialize & plan infrastructure
    TF->>Server: Provision/update resources
    Server->>TF: Resource status
    TF->>Action: Droplet IP

    Action->>ANS: Generate inventory
    Action->>ANS: Run playbook
    ANS->>Server: Deploy application
    ANS->>Server: Configure services
    Server->>ANS: Deployment status

    Action->>Health: Run health checks
    Health->>Server: Test endpoints
    Server->>Health: Health status
    Health->>Action: Verification result
    Action->>WF: Deployment status
```

### 5. Testing Integration Flow

```mermaid
sequenceDiagram
    participant WF as Workflow
    participant Unit as Unit Tests
    participant Integration as Integration Tests
    participant E2E as E2E Tests
    participant Smoke as Smoke Tests
    participant Report as Test Reports

    WF->>Unit: Run unit tests (all environments)
    Unit->>Report: Jest results
    Report->>WF: Unit test status

    alt Staging Environment
        WF->>Integration: Run integration tests
        Integration->>Report: Integration results
        WF->>E2E: Run Playwright E2E tests
        E2E->>Report: E2E results
    end

    alt Production Environment
        WF->>Smoke: Run smoke tests
        Smoke->>Report: Smoke test results
    end

    Report->>WF: Overall test status
```

### 6. Monitoring and Notification Flow

```mermaid
sequenceDiagram
    participant Deploy as Deployment
    participant Health as Health Checks
    participant Metrics as Metrics Collection
    participant Dashboard as Deployment Dashboard
    participant Notify as Notification System
    participant GitHub as GitHub

    Deploy->>Health: Trigger health checks
    Health->>Deploy: Health status
    Deploy->>Metrics: Collect deployment metrics
    Metrics->>Dashboard: Update dashboard
    Deploy->>Notify: Send notifications
    Notify->>GitHub: Update PR/issue comments
    Notify->>Dashboard: Update status
    Dashboard->>Metrics: Store metrics
```

## Component Responsibilities

### GitHub Actions Workflows

| Workflow                     | Responsibility                          | Triggers                              | Outputs                       |
| ---------------------------- | --------------------------------------- | ------------------------------------- | ----------------------------- |
| **deploy.yml**               | Unified deployment for all environments | Push to staging/main, manual dispatch | Deployment status, image tags |
| **deployment-dashboard.yml** | Status monitoring and dashboard updates | Scheduled, deployment events          | Dashboard updates             |
| **deployment-metrics.yml**   | Performance analytics                   | Deployment events                     | Metrics data                  |
| **log-aggregation.yml**      | Centralized log management              | Scheduled, deployment events          | Aggregated logs               |
| **image-cleanup.yml**        | Image retention management              | Scheduled                             | Cleanup reports               |
| **dependency-check.yml**     | Dependency vulnerability scanning       | Push events, scheduled                | Security reports              |

### Reusable Actions

| Action            | Purpose                   | Inputs                             | Outputs                         |
| ----------------- | ------------------------- | ---------------------------------- | ------------------------------- |
| **deploy/**       | Unified deployment action | environment, image_tag, skip_tests | deployment_status, deployed_url |
| **health-check/** | Health verification       | environment, app_url               | health_status                   |
| **test-runner/**  | Test orchestration        | test_type, environment, app_url    | test_results, coverage          |
| **notify/**       | Notification system       | event_type, environment, details   | notification_status             |

### Infrastructure Components

| Component                 | Environment | Purpose                     | Key Tasks                                    |
| ------------------------- | ----------- | --------------------------- | -------------------------------------------- |
| **Terraform**             | All         | Infrastructure provisioning | Provision droplets, networks, firewalls      |
| **Ansible**               | All         | Application deployment      | Deploy Docker containers, configure services |
| **DigitalOcean Droplets** | All         | Compute resources           | Host application containers                  |

### Monitoring Components

| Component              | Purpose              | Metrics                       | Alerts                      |
| ---------------------- | -------------------- | ----------------------------- | --------------------------- |
| **Health Checks**      | Service availability | Uptime, response time         | Service down, slow response |
| **Deployment Metrics** | Performance tracking | Deployment time, success rate | Failed deployments          |
| **Log Aggregation**    | Centralized logging  | Error rates, patterns         | Critical errors             |
| **Sentry Error Monitoring** | Error tracking     | Error frequency, stack traces | New errors, regressions     |
| **Sentry Performance Tracing** | Performance monitoring | Response times, throughput | Slow requests, bottlenecks  |
| **Sentry Session Replay** | User session recording | User interactions, error contexts | UX issues, error reproduction |

## Data Flow Patterns

### 1. Deployment Data Flow

```mermaid
flowchart LR
    A[Code Push] --> B[Environment Detection]
    B --> C[Build & Test]
    C --> D[Image Push to GHCR]
    D --> E[Infrastructure Setup]
    E --> F[Application Deployment]
    F --> G[Health Verification]
    G --> H[Success/Failure Response]

    style A fill:#ccffcc
    style H fill:#ffcc99
```

### 2. Environment Detection Flow

```mermaid
flowchart LR
    A[Workflow Trigger] --> B[Branch Analysis]
    B --> C[Change Detection]
    C --> D[Environment Selection]
    D --> E[Configuration Output]

    style A fill:#ccffcc
    style E fill:#ffcc99
```

### 3. Image Management Flow

```mermaid
flowchart LR
    A[Build Complete] --> B[Tag Generation]
    B --> C[Push to GHCR]
    C --> D[Image Storage]
    D --> E[Deployment Use]
    E --> F[Cleanup Policy]

    style A fill:#ccffcc
    style F fill:#ffcc99
```

### 4. Sentry Monitoring Data Flow

```mermaid
flowchart LR
    subgraph "Client Application"
        A1[React Components]
        A2[API Calls]
        A3[User Interactions]
    end

    subgraph "Server Application"
        B1[API Routes]
        B2[Server Logic]
        B3[Database Queries]
    end

    subgraph "Sentry SDK"
        C1[Error Boundary]
        C2[Performance Tracing]
        C3[Session Replay]
        C4[Structured Logging]
    end

    subgraph "Sentry Service"
        D1[Error Tracking]
        D2[Performance Monitoring]
        D3[Session Recordings]
        D4[Log Aggregation]
    end

    A1 --> C1
    A2 --> C2
    A3 --> C3
    A1 --> C4

    B1 --> C1
    B2 --> C2
    B3 --> C2
    B1 --> C4

    C1 --> D1
    C2 --> D2
    C3 --> D3
    C4 --> D4

    style A1 fill:#e1f5fe
    style B1 fill:#f3e5f5
    style C1 fill:#fff3e0
    style D1 fill:#e8f5e8
```

## Integration Points

### External Systems

| System                  | Integration Method | Purpose               | Data Exchanged                 |
| ----------------------- | ------------------ | --------------------- | ------------------------------ |
| **GitHub**              | Webhooks, API      | Source control, CI/CD | Code changes, workflow status  |
| **GHCR**                | Docker API         | Image storage         | Image push/pull, metadata      |
| **DigitalOcean**        | API, SSH           | Infrastructure        | Droplet management, deployment |
| **GitHub Environments** | API                | Deployment protection | Approval gates, secrets        |
| **Sentry**              | SDK Integration    | Error monitoring      | Errors, traces, replays, logs  |

### Internal Dependencies

| Component         | Depends On            | Purpose               | Critical Path |
| ----------------- | --------------------- | --------------------- | ------------- |
| **Deployment**    | Environment Detection | Determine target      | Yes           |
| **Deployment**    | Build & Test          | Image availability    | Yes           |
| **Deployment**    | Infrastructure Setup  | Resource availability | Yes           |
| **Health Checks** | Deployment            | Verify success        | Yes           |
| **Notifications** | All stages            | Status updates        | No            |

## Error Handling and Recovery

### Failure Scenarios

```mermaid
flowchart TD
    A[Component Failure] --> B{Recovery Strategy}

    B -->|Retry| C[Automatic Retry]
    B -->|Skip| D[Skip Non-Critical Step]
    B -->|Fail| E[Workflow Failure]

    C --> F{Retry Success?}
    F -->|Yes| G[Continue Normal Flow]
    F -->|No| E

    E --> H[Notification Sent]
    H --> I[Manual Intervention]

    style A fill:#ff9999
    style G fill:#ccffcc
    style I fill:#ffcc99
```

### Recovery Mechanisms

1. **Automatic Retry**: Transient failures with exponential backoff
2. **Graceful Degradation**: Skip non-critical steps when possible
3. **Manual Override**: Human intervention for complex failures
4. **Rollback Capability**: Deploy previous image version if needed

## Performance Characteristics

### Latency Expectations

| Operation              | Expected Time | Timeout    | Recovery Time |
| ---------------------- | ------------- | ---------- | ------------- |
| Environment Detection  | < 10 seconds  | 30 seconds | Immediate     |
| Build & Test           | 5-8 minutes   | 15 minutes | 2-3 minutes   |
| Infrastructure Setup   | 2-4 minutes   | 10 minutes | 1-2 minutes   |
| Application Deployment | 3-5 minutes   | 10 minutes | 2-3 minutes   |
| Health Check           | 30 seconds    | 2 minutes  | Immediate     |

### Throughput Considerations

- **Concurrent Deployments**: Maximum 1 deployment per environment at a time
- **Build Rate**: Maximum 1 build per branch per push
- **Cleanup Operations**: Maximum 1 cleanup per hour

## Security Considerations

### Access Control

| Component               | Access Level | Authentication        | Authorization                |
| ----------------------- | ------------ | --------------------- | ---------------------------- |
| **GitHub Actions**      | Repository   | GitHub Token          | Workflow permissions         |
| **GHCR Registry**       | Package      | Personal Access Token | Package permissions          |
| **Infrastructure**      | Server       | SSH Keys              | User/role-based              |
| **GitHub Environments** | Environment  | GitHub Token          | Environment protection rules |

### Data Protection

- **Image Signing**: Verify image integrity before deployment
- **Secrets Management**: Use GitHub Secrets for sensitive data
- **Network Security**: Secure communication between components
- **Audit Logging**: Track all deployment activities

## Sentry Error Monitoring Integration

### SDK Configuration

The application integrates Sentry SDK across three runtime environments:

| Runtime    | Config File              | Features Enabled                  |
| ---------- | ------------------------ | --------------------------------- |
| **Client** | `src/instrumentation-client.ts` | Error tracking, performance tracing, session replay, structured logging |
| **Server** | `sentry.server.config.ts` | Error tracking, performance tracing, structured logging |
| **Edge**   | `sentry.edge.config.ts`  | Error tracking, performance tracing, structured logging |

### Environment-Based Configuration

```yaml
# Development Environment (NODE_ENV=development)
tracesSampleRate: 1.0    # 100% tracing for full visibility
replaysSessionSampleRate: 0.1  # 10% session recording
replaysOnErrorSampleRate: 1.0  # 100% recording on errors

# Production Environment (NODE_ENV=production)
tracesSampleRate: 0.1    # 10% tracing for performance
replaysSessionSampleRate: 0.1  # 10% session recording
replaysOnErrorSampleRate: 1.0  # 100% recording on errors

# All Environments
environment: process.env.NODE_ENV
release: process.env.NEXT_PUBLIC_COMMIT_HASH
sendDefaultPii: true
enableLogs: true
```

### Data Collection Points

| Component          | Error Types Caught              | Performance Data Tracked        | Additional Features     |
| ------------------ | ------------------------------- | ------------------------------- | ----------------------- |
| **React Components** | JavaScript errors, unhandled promise rejections | Component render times, user interactions | Session replay recording |
| **API Routes**     | Server errors, database errors  | Request/response times, DB queries | Structured logging      |
| **Edge Functions** | Runtime errors, network failures | Edge compute performance        | Global error tracking   |
| **Error Boundaries** | React rendering errors         | Error recovery metrics          | User-friendly fallbacks |

### Error Handling Strategy

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type}

    B -->|JavaScript Error| C[Sentry.captureException]
    B -->|API Error| D[Sentry.captureException]
    B -->|React Error| E[Error Boundary]
    B -->|Unhandled Promise| F[Sentry.captureException]

    C --> G[Stack Trace Analysis]
    D --> G
    E --> H[User-Friendly Fallback UI]
    F --> G

    G --> I[Issue Grouping]
    H --> I

    I --> J{Environment}
    J -->|Development| K[Full Details, High Sampling]
    J -->|Production| L[Filtered Data, Controlled Sampling]

    K --> M[Sentry Dashboard]
    L --> M
```

## Monitoring and Observability

### Key Metrics

```yaml
critical_metrics:
  deployment_success_rate: "> 95%"
  deployment_time: "< 10 minutes"
  environment_detection_time: "< 10 seconds"
  health_check_pass_rate: "> 99%"
  image_build_time: "< 8 minutes"
  error_rate: "< 1%"                    # Sentry error rate threshold
  p95_response_time: "< 2000ms"         # Performance tracing metric
  session_replay_coverage: "> 10%"      # Minimum replay coverage

alerting_rules:
  - name: "High Deployment Failure Rate"
    condition: "deployment_success_rate < 90%"
    severity: "critical"

  - name: "Slow Deployments"
    condition: "deployment_time > 15 minutes"
    severity: "warning"

  - name: "Health Check Failures"
    condition: "health_check_pass_rate < 95%"
    severity: "critical"

  - name: "High Error Rate"
    condition: "error_rate > 2%"
    severity: "critical"
    source: "sentry"

  - name: "Performance Degradation"
    condition: "p95_response_time > 3000ms"
    severity: "warning"
    source: "sentry"

  - name: "New Error Patterns"
    condition: "new_error_count > 0"
    severity: "info"
    source: "sentry"
```

### Logging Strategy

- **Structured Logging**: JSON format for machine parsing
- **Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Log Retention**: 30 days for operational logs, 1 year for audit logs
- **Centralized Collection**: Aggregate logs from all components via `log-aggregation.yml`

---

**Last Updated**: Documentation reflects current unified workflow implementation.
