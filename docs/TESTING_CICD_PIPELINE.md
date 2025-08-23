# CI/CD Pipeline Testing Guide

## 🎯 Overview

This guide provides comprehensive instructions for testing the updated CI/CD pipeline on the `test/cicd-pipeline-updates` branch before merging to production.

## 🚀 Quick Start

### 1. Switch to Test Branch
```bash
git checkout test/cicd-pipeline-updates
git pull origin test/cicd-pipeline-updates
```

### 2. Test Docker Build
```bash
# Trigger test build workflow
gh workflow run test-docker-build.yml
```

### 3. Test Image Promotion
```bash
# First, get the image tag from the build workflow
# Then trigger promotion test
gh workflow run test-promotion-pipeline.yml \
  --field source_image_tag="test-test/cicd-pipeline-updates-abc123" \
  --field target_environment="test-staging" \
  --field promotion_reason="Testing promotion workflow"
```

### 4. Run Integration Tests
```bash
# Run comprehensive integration tests
gh workflow run promotion-pipeline-integration-tests.yml \
  --field test_scope="full-pipeline" \
  --field use_test_environment=true
```

## 📋 Testing Checklist

### ✅ Phase 1: Basic Workflow Validation

- [ ] **Test Docker Build Workflow**
  - [ ] Triggers on push to test branch
  - [ ] Builds image with test-specific tags
  - [ ] Pushes to GHCR with test labels
  - [ ] Validates container startup
  - [ ] Generates proper build outputs

- [ ] **Test Image Promotion Workflow**
  - [ ] Validates test image tags
  - [ ] Promotes test images between environments
  - [ ] Creates rollback tags
  - [ ] Generates promotion metadata
  - [ ] Handles promotion failures gracefully

### ✅ Phase 2: Integration Testing

- [ ] **Unit Tests**
  - [ ] Run `npm test` locally
  - [ ] Validate promotion pipeline unit tests
  - [ ] Check test coverage reports
  - [ ] Verify all test scenarios pass

- [ ] **Integration Test Workflows**
  - [ ] Run full pipeline integration tests
  - [ ] Test promotion-only workflow
  - [ ] Test verification-only workflow
  - [ ] Test rollback-only workflow
  - [ ] Validate test cleanup processes

### ✅ Phase 3: Workflow Dependencies

- [ ] **Dependency Validation**
  - [ ] Test workflow-coordinator.yml
  - [ ] Test dependency-check.yml
  - [ ] Validate proper sequencing
  - [ ] Check workflow call integrations

- [ ] **Notification Systems**
  - [ ] Test deployment-notifications.yml
  - [ ] Validate notification payloads
  - [ ] Check multi-channel support
  - [ ] Test severity levels

### ✅ Phase 4: Production Simulation

- [ ] **Deployment Verification**
  - [ ] Test production-verification.yml
  - [ ] Validate health checks
  - [ ] Test performance checks
  - [ ] Test security checks
  - [ ] Validate failure handling

- [ ] **Status Dashboard**
  - [ ] Test deployment-status-dashboard.yml
  - [ ] Validate status reporting
  - [ ] Check environment health monitoring
  - [ ] Test workflow activity tracking

## 🧪 Test Scenarios

### Scenario 1: Successful Promotion Pipeline
```bash
# 1. Build test image
gh workflow run test-docker-build.yml

# 2. Wait for build completion, then promote
gh workflow run test-promotion-pipeline.yml \
  --field source_image_tag="test-branch-latest" \
  --field target_environment="test-staging"

# 3. Run integration tests
gh workflow run promotion-pipeline-integration-tests.yml \
  --field test_scope="full-pipeline"
```

### Scenario 2: Promotion Failure Handling
```bash
# Test with invalid image tag
gh workflow run test-promotion-pipeline.yml \
  --field source_image_tag="invalid-tag" \
  --field target_environment="test-staging"
```

### Scenario 3: Rollback Testing
```bash
# Test rollback functionality
gh workflow run promotion-pipeline-integration-tests.yml \
  --field test_scope="rollback-only"
```

### Scenario 4: Comprehensive Testing
```bash
# Run all tests
gh workflow run run-integration-tests.yml \
  --field test_type="all" \
  --field send_notifications=true
```

## 🔍 Validation Points

### Docker Build Validation
- ✅ Images tagged with `test-` prefix
- ✅ Images contain test metadata labels
- ✅ Container starts without errors
- ✅ Basic functionality verified
- ✅ Build outputs properly formatted

### Promotion Validation
- ✅ Source image validation works
- ✅ Target tagging follows conventions
- ✅ Rollback tags created correctly
- ✅ Image integrity maintained
- ✅ Promotion metadata generated

### Integration Test Validation
- ✅ All test jobs complete successfully
- ✅ Test cleanup removes artifacts
- ✅ Error scenarios handled properly
- ✅ Test reports are comprehensive
- ✅ No production impact

### Workflow Validation
- ✅ Triggers work correctly
- ✅ Dependencies respected
- ✅ Inputs validated properly
- ✅ Outputs formatted correctly
- ✅ Error handling robust

## 🚨 Safety Measures

### Test Environment Isolation
- **Image Tags**: All test images use `test-` prefix
- **Environment**: Separate test environment configurations
- **Cleanup**: Automated cleanup of test resources
- **Labeling**: Clear test labels on all artifacts

### Production Protection
- **Branch Restrictions**: Test workflows only on test branch
- **Tag Conventions**: Test tags clearly distinguished
- **Manual Triggers**: Critical workflows require manual approval
- **Rollback Ready**: Quick rollback procedures documented

## 📊 Monitoring Test Results

### GitHub Actions Dashboard
1. Navigate to **Actions** tab in GitHub
2. Filter by branch: `test/cicd-pipeline-updates`
3. Monitor workflow runs and status
4. Review detailed logs for any failures

### Test Reports
- **Unit Tests**: Coverage reports in artifacts
- **Integration Tests**: Comprehensive summaries in job outputs
- **Build Results**: Image details and validation results
- **Promotion Results**: Detailed promotion tracking

### Key Metrics to Track
- ✅ **Success Rate**: Percentage of successful workflow runs
- ⏱️ **Execution Time**: Time for each workflow phase
- 🔄 **Retry Rate**: Number of retries needed
- 🚨 **Failure Rate**: Types and frequency of failures

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
gh run view --log

# Local build testing
docker build -t test-local .
```

#### Promotion Failures
```bash
# Verify image exists
docker pull ghcr.io/bxtech/dotca:test-branch-latest

# Check registry permissions
gh auth token | docker login ghcr.io -u USERNAME --password-stdin
```

#### Test Failures
```bash
# Run tests locally
npm test

# Run specific test file
npm test -- src/tests/promotion-pipeline.test.ts
```

### Debug Commands
```bash
# List test images
gh api /user/packages/container/dotca/versions \
  --jq '.[] | select(.metadata.container.tags[] | startswith("test-"))'

# Check workflow status
gh workflow list
gh run list --workflow="test-docker-build.yml"

# View specific run
gh run view [RUN_ID] --log
```

## ✅ Pre-Merge Validation

Before merging to main, ensure all tests pass:

### Final Checklist
- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing
- [ ] Docker build workflow successful
- [ ] Image promotion workflow successful
- [ ] Deployment verification successful
- [ ] Notification system functional
- [ ] No production environment impact
- [ ] Test artifacts cleaned up
- [ ] Documentation updated
- [ ] Team review completed

### Merge Preparation
```bash
# Ensure all tests pass
gh workflow run run-integration-tests.yml --field test_type="all"

# Clean up test artifacts
gh workflow run promotion-pipeline-integration-tests.yml \
  --field cleanup_after_test=true

# Prepare merge commit
git checkout test/cicd-pipeline-updates
git rebase staging  # or main
git push origin test/cicd-pipeline-updates
```

## 📚 Additional Resources

- [Image Promotion Workflow Documentation](./image-promotion-workflow.md)
- [Rollback Strategy Guide](./rollback-strategy-retention-policy.md)
- [CI/CD Architecture Comparison](./cicd-architecture-comparison.md)
- [Component Interaction Diagram](./component-interaction-diagram.md)

## 🆘 Support

If you encounter issues during testing:

1. **Check Logs**: Review GitHub Actions logs for detailed error messages
2. **Local Testing**: Run tests locally to isolate issues
3. **Documentation**: Refer to workflow-specific documentation
4. **Team Support**: Reach out to the DevOps team for assistance

---

**⚠️ Important**: Always test on the `test/cicd-pipeline-updates` branch before merging to production environments!
