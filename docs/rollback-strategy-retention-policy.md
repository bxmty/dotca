# Rollback Strategy and Image Retention Policy

## Overview

This document defines the rollback strategy and image retention policy for the CI/CD pipeline, ensuring quick recovery from failed deployments while maintaining efficient storage management.

## Rollback Strategy

### Rollback Triggers

#### Automatic Rollback
The system will automatically trigger rollbacks when:

1. **Health Check Failures**
   - Application health checks fail for 3 consecutive attempts
   - Database connectivity issues persist for 2+ minutes
   - Critical endpoints return 5xx errors for 5+ consecutive requests

2. **Deployment Failures**
   - Container fails to start within 5 minutes
   - Service crashes within 2 minutes of deployment
   - Resource limits exceeded (CPU/Memory)

3. **Performance Degradation**
   - Response time increases by 300% from baseline
   - Error rate exceeds 5% for 3+ minutes
   - Memory usage exceeds 90% for 5+ minutes

#### Manual Rollback
Manual rollbacks can be triggered by:

1. **User Reports**: Critical user-reported issues
2. **Business Requirements**: Feature rollback requests
3. **Security Concerns**: Vulnerability discoveries
4. **Performance Issues**: Sustained performance degradation

### Rollback Decision Matrix

| Issue Type | Severity | Auto-Rollback | Manual Approval | Rollback Speed |
|------------|----------|---------------|-----------------|----------------|
| Service Crash | Critical | ✅ Yes | ❌ No | < 2 minutes |
| Health Check Fail | High | ✅ Yes | ❌ No | < 3 minutes |
| Performance Degradation | Medium | ❌ No | ✅ Yes | < 5 minutes |
| User Reports | Medium | ❌ No | ✅ Yes | < 10 minutes |
| Feature Issues | Low | ❌ No | ✅ Yes | < 15 minutes |

### Rollback Process

```mermaid
flowchart TD
    A[Rollback Triggered] --> B{Automatic or Manual?}
    B -->|Automatic| C[Immediate Rollback]
    B -->|Manual| D[Wait for Approval]
    
    C --> E[Stop Current Services]
    D --> F{Approved?}
    F -->|Yes| E
    F -->|No| G[Cancel Rollback]
    
    E --> H[Identify Rollback Target]
    H --> I{Target Available?}
    I -->|No| J[Fail Rollback]
    I -->|Yes| K[Deploy Previous Image]
    
    K --> L[Start Services]
    L --> M{Run Health Checks}
    M -->|Fail| N[Try Next Target]
    M -->|Pass| O[Rollback Complete]
    
    N --> P{More Targets?}
    P -->|Yes| H
    P -->|No| Q[Rollback Failed]
    
    style C fill:#ffcc99
    style O fill:#ccffcc
    style Q fill:#ff9999
```

### Rollback Target Selection

#### Priority Order for Rollback Targets

1. **Previous Production Image** (`:main-{previous-sha}`)
   - Most recent known good production deployment
   - Highest confidence level
   - Fastest rollback option

2. **Last Stable Release** (`:v{major}.{minor}.{patch}`)
   - Last semantic version release
   - Proven stability over time
   - Medium confidence level

3. **Rollback-Specific Image** (`:rollback-{timestamp}-{reason}`)
   - Previously created rollback images
   - Documented rollback reasons
   - Lower confidence level

4. **Emergency Fallback** (`:emergency-{date}`)
   - Last resort emergency images
   - Basic functionality guaranteed
   - Lowest confidence level

#### Rollback Target Validation

```yaml
# Rollback validation rules
rollback_validation:
  health_check_timeout: 300  # 5 minutes
  max_rollback_attempts: 3
  required_checks:
    - service_startup
    - health_endpoints
    - database_connectivity
    - basic_functionality
  
  target_selection:
    max_age_hours: 168  # 1 week
    min_uptime_hours: 2
    required_tests_passed: true
```

## Image Retention Policy

### Retention Categories

#### 1. Production Images (Keep Longer)

| Tag Pattern | Retention Period | Cleanup Schedule | Reason |
|-------------|------------------|------------------|---------|
| `:v{major}.{minor}.{patch}` | **Indefinite** | Never | Immutable releases |
| `:main` | 30 days | Weekly | Current production |
| `:main-{sha}` | 90 days | Monthly | Production history |
| `:latest` | 60 days | Weekly | Latest stable |
| `:rollback-{timestamp}` | 30 days | Weekly | Rollback targets |

#### 2. Staging Images (Shorter Retention)

| Tag Pattern | Retention Period | Cleanup Schedule | Reason |
|-------------|------------------|------------------|---------|
| `:staging` | 7 days | Daily | Current staging |
| `:staging-{sha}` | 14 days | Weekly | Staging history |
| `:staging-{branch}` | 7 days | Weekly | Feature branches |
| `:staging-build-{n}` | 3 days | Daily | Build artifacts |

#### 3. Development Images (Shortest Retention)

| Tag Pattern | Retention Period | Cleanup Schedule | Reason |
|-------------|------------------|------------------|---------|
| `:dev-{branch}` | 3 days | Daily | Development work |
| `:test-{feature}` | 1 day | Daily | Feature testing |
| `:experimental` | 1 day | Daily | Experimental builds |

### Storage Management

#### Storage Limits

```yaml
storage_limits:
  total_registry_size_gb: 100
  staging_images_gb: 20
  production_images_gb: 60
  development_images_gb: 20
  
  cleanup_thresholds:
    warning_at_percent: 80
    critical_at_percent: 90
    emergency_at_percent: 95
```

#### Cleanup Strategies

##### 1. Time-Based Cleanup
```bash
#!/bin/bash
# cleanup-by-age.sh

# Cleanup staging images older than 7 days
find_staging_images_older_than 7d | cleanup_images

# Cleanup production images older than 30 days (except versioned)
find_production_images_older_than 30d | exclude_versioned | cleanup_images

# Cleanup rollback images older than 30 days
find_rollback_images_older_than 30d | cleanup_images
```

##### 2. Size-Based Cleanup
```bash
#!/bin/bash
# cleanup-by-size.sh

# When storage exceeds 80%, remove oldest non-versioned images
if [ $(get_storage_usage_percent) -gt 80 ]; then
  find_oldest_non_versioned_images | cleanup_images
fi

# When storage exceeds 90%, remove all non-versioned images
if [ $(get_storage_usage_percent) -gt 90 ]; then
  find_all_non_versioned_images | cleanup_images
fi
```

##### 3. Priority-Based Cleanup
```bash
#!/bin/bash
# cleanup-by-priority.sh

# Priority order for cleanup (lowest priority first)
cleanup_order=(
  "staging-build-*"      # Build artifacts
  "staging-{branch}"     # Feature branches
  "dev-*"                # Development images
  "test-*"               # Test images
  "rollback-*"           # Old rollback images
  "main-{sha}"           # Old production commits
  "staging-{sha}"        # Old staging commits
)

for pattern in "${cleanup_order[@]}"; do
  cleanup_images_by_pattern "$pattern"
  if [ $(get_storage_usage_percent) -lt 70 ]; then
    break  # Stop if we're under threshold
  fi
done
```

### Retention Policy Enforcement

#### Automated Cleanup Workflow

```yaml
# GitHub Actions cleanup workflow
name: Image Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:     # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Check Storage Usage
        id: storage
        run: |
          USAGE=$(gh api repos/${{ github.repository }}/packages/container/dotca --jq '.metadata.container.metadata.tags | length')
          echo "usage=$USAGE" >> $GITHUB_OUTPUT
      
      - name: Cleanup Old Images
        if: steps.storage.outputs.usage > 50
        run: |
          # Run cleanup scripts
          ./scripts/cleanup-by-age.sh
          ./scripts/cleanup-by-size.sh
      
      - name: Report Cleanup Results
        run: |
          echo "Cleanup completed at $(date)"
          echo "Current storage usage: $(gh api repos/${{ github.repository }}/packages/container/dotca --jq '.metadata.container.metadata.tags | length') images"
```

#### Manual Cleanup Commands

```bash
# Manual cleanup commands for administrators

# List all images with creation dates
docker images ghcr.io/bxtech/dotca --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"

# Remove specific image
docker rmi ghcr.io/bxtech/dotca:staging-old

# Remove all staging images except current
docker images ghcr.io/bxtech/dotca:staging-* --format "{{.Repository}}:{{.Tag}}" | \
  grep -v ":staging$" | \
  xargs -I {} docker rmi {}

# Force remove dangling images
docker image prune -f
```

## Rollback Implementation

### Rollback Workflow in GitHub Actions

```yaml
# Rollback workflow
name: Production Rollback
on:
  workflow_dispatch:
    inputs:
      rollback_target:
        description: 'Rollback target (image tag)'
        required: true
        default: 'main-previous'
      rollback_reason:
        description: 'Reason for rollback'
        required: true
        default: 'Manual rollback request'

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Rollback Target
        run: |
          # Check if target image exists
          if ! docker pull ghcr.io/bxtech/dotca:${{ github.event.inputs.rollback_target }}; then
            echo "::error::Rollback target not found"
            exit 1
          fi
      
      - name: Create Rollback Tag
        run: |
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          REASON="${{ github.event.inputs.rollback_reason }}"
          
          docker tag ghcr.io/bxtech/dotca:${{ github.event.inputs.rollback_target }} \
            ghcr.io/bxtech/dotca:rollback-$TIMESTAMP-$REASON
          
          docker push ghcr.io/bxtech/dotca:rollback-$TIMESTAMP-$REASON
      
      - name: Deploy Rollback Image
        run: |
          # Update production to use rollback image
          ./scripts/deploy-production.sh rollback-$TIMESTAMP-$REASON
      
      - name: Verify Rollback
        run: |
          # Wait for services to start
          sleep 60
          
          # Run health checks
          ./scripts/health-check.sh
          
          # Verify endpoints
          ./scripts/endpoint-verification.sh
```

### Rollback Monitoring

#### Rollback Metrics

```yaml
metrics_to_track:
  rollback_frequency:
    - daily_rollbacks
    - weekly_rollbacks
    - monthly_rollbacks
  
  rollback_success_rate:
    - successful_rollbacks
    - failed_rollbacks
    - partial_rollbacks
  
  rollback_performance:
    - time_to_rollback
    - time_to_healthy
    - total_downtime
```

#### Rollback Alerts

```yaml
alerts:
  rollback_triggered:
    - channel: "#devops-alerts"
    - message: "🚨 Production rollback triggered: ${{ github.event.inputs.rollback_reason }}"
  
  rollback_complete:
    - channel: "#devops-alerts"
    - message: "✅ Production rollback completed successfully"
  
  rollback_failed:
    - channel: "#devops-alerts"
    - message: "❌ Production rollback failed - manual intervention required"
```

## Best Practices

### Rollback Best Practices

1. **Always have rollback targets available**
   - Maintain at least 3 previous production images
   - Keep versioned releases indefinitely
   - Document rollback reasons and outcomes

2. **Test rollback procedures regularly**
   - Monthly rollback drills
   - Verify rollback targets are accessible
   - Test rollback speed and success rate

3. **Monitor rollback effectiveness**
   - Track rollback success rates
   - Measure time to recovery
   - Document lessons learned

### Retention Best Practices

1. **Balance storage costs with recovery needs**
   - Keep critical images longer
   - Clean up development artifacts quickly
   - Use automated cleanup to prevent manual errors

2. **Document retention decisions**
   - Explain why certain images are kept longer
   - Document cleanup schedules and policies
   - Maintain audit trail of cleanup operations

3. **Regular policy review**
   - Review retention periods quarterly
   - Adjust based on business needs
   - Optimize for cost and recovery requirements
