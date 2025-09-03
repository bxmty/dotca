# Image Promotion Workflow

## Overview

This document details the step-by-step workflow for promoting tested staging images to production, including validation, approval, and rollback mechanisms.

## Main Promotion Workflow

```mermaid
flowchart TD
    A[Staging Deployment Complete] --> B[Run Staging Tests]
    B --> C{Tests Pass?}
    C -->|No| D[Fail Promotion]
    C -->|Yes| E[Trigger Image Promotion]
    
    E --> F[Validate Staging Image]
    F --> G{Image Valid?}
    G -->|No| H[Log Validation Error]
    H --> I[Fail Promotion]
    G -->|Yes| J[Check Promotion Approval]
    
    J --> K{Manual Approval Required?}
    K -->|Yes| L[Wait for Manual Approval]
    L --> M{Approved?}
    M -->|No| N[Cancel Promotion]
    M -->|Yes| O[Proceed with Promotion]
    K -->|No| O
    
    O --> P[Copy Image: staging → production]
    P --> Q{Image Copy Success?}
    Q -->|No| R[Retry Image Copy]
    R --> S{Retry Count < 3?}
    S -->|Yes| P
    S -->|No| T[Fail Promotion - Max Retries]
    Q -->|Yes| U[Apply Production Tags]
    
    U --> V[Update Production Registry]
    V --> W{Registry Update Success?}
    W -->|No| X[Fail Promotion - Registry Error]
    W -->|Yes| Y[Trigger Production Deployment]
    
    Y --> Z[Deploy to Production]
    Z --> AA{Deployment Success?}
    AA -->|No| BB[Trigger Rollback]
    AA -->|Yes| CC[Run Production Health Checks]
    
    CC --> DD{Health Checks Pass?}
    DD -->|No| EE[Mark Deployment Unhealthy]
    EE --> BB
    DD -->|Yes| FF[Mark Promotion Complete]
    
    BB --> GG[Rollback to Previous Image]
    GG --> HH[Log Rollback Event]
    HH --> II[Send Rollback Notifications]
    
    style D fill:#ff9999
    style I fill:#ff9999
    style N fill:#ff9999
    style T fill:#ff9999
    style X fill:#ff9999
    style FF fill:#ccffcc
    style BB fill:#ffcc99
```

## Detailed Sub-Workflows

### 1. Image Validation Process

```mermaid
flowchart TD
    A[Start Image Validation] --> B[Check Image Size]
    B --> C{Size < 1GB?}
    C -->|No| D[Fail - Image Too Large]
    C -->|Yes| E[Verify Image Layers]
    
    E --> F{All Layers Present?}
    F -->|No| G[Fail - Corrupted Image]
    F -->|Yes| H[Check Image Metadata]
    
    H --> I{Metadata Valid?}
    I -->|No| J[Fail - Invalid Metadata]
    I -->|Yes| K[Verify Image Signature]
    
    K --> L{Signature Valid?}
    L -->|No| M[Fail - Invalid Signature]
    L -->|Yes| N[Validation Complete]
    
    style D fill:#ff9999
    style G fill:#ff9999
    style J fill:#ff9999
    style M fill:#ff9999
    style N fill:#ccffcc
```

### 2. Production Deployment Verification

```mermaid
flowchart TD
    A[Start Production Deployment] --> B[Pull Promoted Image]
    B --> C{Image Pull Success?}
    C -->|No| D[Fail - Cannot Pull Image]
    C -->|Yes| E[Update Docker Compose]
    
    E --> F{Compose Update Success?}
    F -->|No| G[Fail - Compose Error]
    F -->|Yes| H[Restart Production Services]
    
    H --> I{Services Start Success?}
    I -->|No| J[Fail - Service Start Error]
    I -->|Yes| K[Wait for Service Health]
    
    K --> L{Health Check Pass?}
    L -->|No| M[Fail - Unhealthy Service]
    L -->|Yes| N[Verify Application Endpoints]
    
    N --> O{Endpoints Respond?}
    O -->|No| P[Fail - Endpoint Error]
    O -->|Yes| Q[Deployment Complete]
    
    style D fill:#ff9999
    style G fill:#ff9999
    style J fill:#ff9999
    style M fill:#ff9999
    style P fill:#ff9999
    style Q fill:#ccffcc
```

### 3. Rollback Process

```mermaid
flowchart TD
    A[Rollback Triggered] --> B[Identify Previous Image]
    B --> C{Previous Image Available?}
    C -->|No| D[Fail - No Rollback Target]
    C -->|Yes| E[Stop Current Production Services]
    
    E --> F{Services Stopped?}
    F -->|No| G[Force Stop Services]
    G --> H[Update to Previous Image]
    F -->|Yes| H
    
    H --> I[Restart with Previous Image]
    I --> J{Services Start Success?}
    J -->|No| K[Fail - Rollback Failed]
    J -->|Yes| L[Run Health Checks]
    
    L --> M{Health Checks Pass?}
    M -->|No| N[Rollback Incomplete]
    M -->|Yes| O[Rollback Complete]
    
    style D fill:#ff9999
    style K fill:#ff9999
    style N fill:#ffcc99
    style O fill:#ccffcc
```

## Workflow States and Transitions

### Promotion States
1. **Pending** - Waiting for approval or conditions
2. **In Progress** - Promotion actively running
3. **Completed** - Successfully promoted and deployed
4. **Failed** - Promotion failed at some step
5. **Rolled Back** - Production rolled back to previous image

### Key Decision Points
- **Test Results** - Must pass all staging tests
- **Image Validation** - Image integrity and size checks
- **Approval** - Manual approval if required
- **Copy Success** - Image transfer between registries
- **Deployment Health** - Production service verification

### Error Recovery
- **Retry Logic** - Automatic retries for transient failures
- **Rollback Triggers** - Automatic rollback on critical failures
- **Notification System** - Alerts for all failure scenarios
- **Audit Logging** - Complete trail of all actions and decisions

## Integration Points

### GitHub Actions
- **Triggers**: Staging deployment success, manual promotion
- **Actions**: Image validation, registry operations, deployment orchestration
- **Outputs**: Promotion status, deployment results, rollback triggers

### Ansible Playbooks
- **Staging**: Triggers promotion workflow after successful deployment
- **Production**: Uses promoted images, handles rollback procedures
- **Verification**: Health checks, endpoint validation, service monitoring

### Monitoring and Alerting
- **Promotion Status**: Real-time updates on promotion progress
- **Deployment Health**: Continuous monitoring of production services
- **Rollback Alerts**: Immediate notification of rollback events
