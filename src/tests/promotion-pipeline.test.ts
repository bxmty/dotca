/**
 * @file promotion-pipeline.test.ts
 * @description Unit tests for image promotion pipeline validation and helper functions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock environment variables for testing
const mockEnv = {
  GITHUB_REPOSITORY: 'bxtech/dotca',
  GITHUB_RUN_ID: '12345',
  GITHUB_ACTOR: 'test-user',
  GITHUB_SHA: 'abc123def456',
  REGISTRY: 'ghcr.io'
};

// Mock GitHub API responses
const mockGitHubAPI = {
  packages: {
    getPackageVersionForUser: jest.fn(),
    deletePackageVersionForUser: jest.fn()
  },
  actions: {
    getWorkflowRun: jest.fn(),
    createWorkflowDispatch: jest.fn()
  }
};

// Helper functions that would be used in the promotion pipeline
class PromotionPipelineValidator {
  /**
   * Validates image tag format
   */
  static validateImageTag(tag: string): { valid: boolean; reason?: string } {
    if (!tag) {
      return { valid: false, reason: 'Tag cannot be empty' };
    }
    
    if (tag.length > 128) {
      return { valid: false, reason: 'Tag too long (max 128 characters)' };
    }
    
    // Docker tag validation: lowercase letters, digits, underscores, periods and dashes
    const validTagRegex = /^[a-z0-9._-]+$/;
    if (!validTagRegex.test(tag)) {
      return { valid: false, reason: 'Tag contains invalid characters' };
    }
    
    // Cannot start with . or -
    if (tag.startsWith('.') || tag.startsWith('-')) {
      return { valid: false, reason: 'Tag cannot start with . or -' };
    }
    
    return { valid: true };
  }

  /**
   * Validates promotion readiness based on staging deployment status
   */
  static validatePromotionReadiness(stagingStatus: {
    deploymentSuccess: boolean;
    testsPass: boolean;
    healthCheckPass: boolean;
    imageAge: number; // hours
  }): { ready: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!stagingStatus.deploymentSuccess) {
      issues.push('Staging deployment has not completed successfully');
    }
    
    if (!stagingStatus.testsPass) {
      issues.push('Staging tests are failing');
    }
    
    if (!stagingStatus.healthCheckPass) {
      issues.push('Staging health checks are failing');
    }
    
    if (stagingStatus.imageAge > 168) { // 1 week
      issues.push('Staging image is too old (>1 week)');
    }
    
    return {
      ready: issues.length === 0,
      issues
    };
  }

  /**
   * Generates promotion metadata
   */
  static generatePromotionMetadata(options: {
    stagingImage: string;
    promotionReason: string;
    approvedBy: string;
  }): Record<string, string> {
    const timestamp = new Date().toISOString();
    const promotionId = `promotion-${Date.now()}`;
    
    return {
      'promotion.id': promotionId,
      'promotion.timestamp': timestamp,
      'promotion.staging-image': options.stagingImage,
      'promotion.reason': options.promotionReason,
      'promotion.approved-by': options.approvedBy,
      'promotion.source': 'automated-pipeline'
    };
  }

  /**
   * Validates rollback target
   */
  static validateRollbackTarget(target: string, availableTargets: string[]): {
    valid: boolean;
    reason?: string;
  } {
    if (!target) {
      return { valid: false, reason: 'Rollback target cannot be empty' };
    }
    
    if (!availableTargets.includes(target)) {
      return { valid: false, reason: 'Rollback target not found in available images' };
    }
    
    // Check if target is not the current production image
    if (target.includes(':main') && !target.includes('-')) {
      return { valid: false, reason: 'Cannot rollback to current production tag' };
    }
    
    return { valid: true };
  }

  /**
   * Calculates deployment risk score
   */
  static calculateDeploymentRisk(factors: {
    stagingTestCoverage: number; // 0-100
    imageSize: number; // MB
    hasBreakingChanges: boolean;
    deploymentWindow: 'business-hours' | 'after-hours' | 'weekend';
    rollbackComplexity: 'low' | 'medium' | 'high';
  }): { score: number; level: 'low' | 'medium' | 'high' | 'critical' } {
    let score = 0;
    
    // Test coverage factor (0-30 points)
    score += Math.max(0, 30 - (100 - factors.stagingTestCoverage) * 0.3);
    
    // Image size factor (0-20 points)
    if (factors.imageSize > 2000) score -= 20; // Very large
    else if (factors.imageSize > 1000) score -= 10; // Large
    else if (factors.imageSize < 100) score -= 5; // Suspiciously small
    
    // Breaking changes factor
    if (factors.hasBreakingChanges) score -= 25;
    
    // Deployment window factor
    const windowScores = {
      'business-hours': -15,
      'after-hours': 0,
      'weekend': 5
    };
    score += windowScores[factors.deploymentWindow];
    
    // Rollback complexity factor
    const rollbackScores = {
      'low': 10,
      'medium': 0,
      'high': -15
    };
    score += rollbackScores[factors.rollbackComplexity];
    
    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score + 50));
    
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) level = 'low';
    else if (score >= 60) level = 'medium';
    else if (score >= 40) level = 'high';
    else level = 'critical';
    
    return { score, level };
  }
}

// Integration test helpers
class IntegrationTestHelpers {
  /**
   * Creates a test deployment configuration
   */
  static createTestConfig(overrides: Partial<{
    environment: string;
    imageTag: string;
    skipTests: boolean;
    notificationChannels: string[];
  }> = {}) {
    return {
      environment: 'test',
      imageTag: `test-${Date.now()}`,
      skipTests: false,
      notificationChannels: ['github'],
      ...overrides
    };
  }

  /**
   * Simulates a workflow run result
   */
  static simulateWorkflowResult(success: boolean, details: Record<string, any> = {}) {
    return {
      success,
      runId: mockEnv.GITHUB_RUN_ID,
      timestamp: new Date().toISOString(),
      details
    };
  }

  /**
   * Validates notification payload structure
   */
  static validateNotificationPayload(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!payload.event_type) {
      errors.push('Missing event_type');
    }
    
    if (!payload.environment) {
      errors.push('Missing environment');
    }
    
    if (!payload.deployment_details) {
      errors.push('Missing deployment_details');
    }
    
    if (payload.notification_channels && !Array.isArray(payload.notification_channels)) {
      errors.push('notification_channels must be an array');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

describe('PromotionPipelineValidator', () => {
  describe('validateImageTag', () => {
    it('should accept valid image tags', () => {
      const validTags = [
        'staging',
        'main',
        'v1.2.3',
        'feature-branch',
        'staging-abc123',
        'main-20231201'
      ];
      
      validTags.forEach(tag => {
        const result = PromotionPipelineValidator.validateImageTag(tag);
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });

    it('should reject invalid image tags', () => {
      const invalidTags = [
        { tag: '', reason: 'Tag cannot be empty' },
        { tag: 'Invalid-Tag', reason: 'Tag contains invalid characters' },
        { tag: '.invalid', reason: 'Tag cannot start with . or -' },
        { tag: '-invalid', reason: 'Tag cannot start with . or -' },
        { tag: 'a'.repeat(129), reason: 'Tag too long (max 128 characters)' }
      ];
      
      invalidTags.forEach(({ tag, reason }) => {
        const result = PromotionPipelineValidator.validateImageTag(tag);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(reason);
      });
    });
  });

  describe('validatePromotionReadiness', () => {
    it('should approve promotion when all conditions are met', () => {
      const stagingStatus = {
        deploymentSuccess: true,
        testsPass: true,
        healthCheckPass: true,
        imageAge: 2 // 2 hours
      };
      
      const result = PromotionPipelineValidator.validatePromotionReadiness(stagingStatus);
      
      expect(result.ready).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject promotion when conditions are not met', () => {
      const stagingStatus = {
        deploymentSuccess: false,
        testsPass: false,
        healthCheckPass: true,
        imageAge: 200 // Over 1 week
      };
      
      const result = PromotionPipelineValidator.validatePromotionReadiness(stagingStatus);
      
      expect(result.ready).toBe(false);
      expect(result.issues).toContain('Staging deployment has not completed successfully');
      expect(result.issues).toContain('Staging tests are failing');
      expect(result.issues).toContain('Staging image is too old (>1 week)');
    });
  });

  describe('generatePromotionMetadata', () => {
    it('should generate valid promotion metadata', () => {
      const options = {
        stagingImage: 'ghcr.io/bxtech/dotca:staging-abc123',
        promotionReason: 'All tests passed',
        approvedBy: 'user@example.com'
      };
      
      const metadata = PromotionPipelineValidator.generatePromotionMetadata(options);
      
      expect(metadata['promotion.staging-image']).toBe(options.stagingImage);
      expect(metadata['promotion.reason']).toBe(options.promotionReason);
      expect(metadata['promotion.approved-by']).toBe(options.approvedBy);
      expect(metadata['promotion.source']).toBe('automated-pipeline');
      expect(metadata['promotion.id']).toMatch(/^promotion-\d+$/);
      expect(metadata['promotion.timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('validateRollbackTarget', () => {
    const availableTargets = [
      'ghcr.io/bxtech/dotca:main-abc123',
      'ghcr.io/bxtech/dotca:rollback-20231201-bugfix',
      'ghcr.io/bxtech/dotca:v1.2.3'
    ];

    it('should accept valid rollback targets', () => {
      availableTargets.forEach(target => {
        const result = PromotionPipelineValidator.validateRollbackTarget(target, availableTargets);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid rollback targets', () => {
      const invalidTargets = [
        { target: '', reason: 'Rollback target cannot be empty' },
        { target: 'nonexistent:tag', reason: 'Rollback target not found in available images' },
        { target: 'ghcr.io/bxtech/dotca:main', reason: 'Cannot rollback to current production tag' }
      ];
      
      invalidTargets.forEach(({ target, reason }) => {
        const result = PromotionPipelineValidator.validateRollbackTarget(target, availableTargets);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(reason);
      });
    });
  });

  describe('calculateDeploymentRisk', () => {
    it('should calculate low risk for safe deployments', () => {
      const factors = {
        stagingTestCoverage: 95,
        imageSize: 500,
        hasBreakingChanges: false,
        deploymentWindow: 'weekend' as const,
        rollbackComplexity: 'low' as const
      };
      
      const result = PromotionPipelineValidator.calculateDeploymentRisk(factors);
      
      expect(result.level).toBe('low');
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('should calculate high risk for risky deployments', () => {
      const factors = {
        stagingTestCoverage: 40,
        imageSize: 2500,
        hasBreakingChanges: true,
        deploymentWindow: 'business-hours' as const,
        rollbackComplexity: 'high' as const
      };
      
      const result = PromotionPipelineValidator.calculateDeploymentRisk(factors);
      
      expect(result.level).toBe('critical');
      expect(result.score).toBeLessThan(40);
    });

    it('should calculate medium risk for moderate deployments', () => {
      const factors = {
        stagingTestCoverage: 80,
        imageSize: 800,
        hasBreakingChanges: false,
        deploymentWindow: 'business-hours' as const,
        rollbackComplexity: 'medium' as const
      };
      
      const result = PromotionPipelineValidator.calculateDeploymentRisk(factors);
      
      expect(['medium', 'high']).toContain(result.level);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });
  });
});

describe('IntegrationTestHelpers', () => {
  describe('createTestConfig', () => {
    it('should create default test configuration', () => {
      const config = IntegrationTestHelpers.createTestConfig();
      
      expect(config.environment).toBe('test');
      expect(config.imageTag).toMatch(/^test-\d+$/);
      expect(config.skipTests).toBe(false);
      expect(config.notificationChannels).toEqual(['github']);
    });

    it('should allow overriding default values', () => {
      const overrides = {
        environment: 'staging',
        skipTests: true,
        notificationChannels: ['slack', 'teams']
      };
      
      const config = IntegrationTestHelpers.createTestConfig(overrides);
      
      expect(config.environment).toBe('staging');
      expect(config.skipTests).toBe(true);
      expect(config.notificationChannels).toEqual(['slack', 'teams']);
    });
  });

  describe('simulateWorkflowResult', () => {
    it('should create successful workflow result', () => {
      const result = IntegrationTestHelpers.simulateWorkflowResult(true, {
        deploymentTime: '2 minutes',
        healthScore: 95
      });
      
      expect(result.success).toBe(true);
      expect(result.runId).toBe(mockEnv.GITHUB_RUN_ID);
      expect(result.details.deploymentTime).toBe('2 minutes');
      expect(result.details.healthScore).toBe(95);
    });

    it('should create failed workflow result', () => {
      const result = IntegrationTestHelpers.simulateWorkflowResult(false, {
        error: 'Deployment timeout'
      });
      
      expect(result.success).toBe(false);
      expect(result.details.error).toBe('Deployment timeout');
    });
  });

  describe('validateNotificationPayload', () => {
    it('should validate correct notification payload', () => {
      const payload = {
        event_type: 'deployment-success',
        environment: 'production',
        deployment_details: { image: 'test:latest' },
        notification_channels: ['github', 'slack']
      };
      
      const result = IntegrationTestHelpers.validateNotificationPayload(payload);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid notification payload', () => {
      const payload = {
        environment: 'production',
        notification_channels: 'invalid'
      };
      
      const result = IntegrationTestHelpers.validateNotificationPayload(payload);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing event_type');
      expect(result.errors).toContain('Missing deployment_details');
      expect(result.errors).toContain('notification_channels must be an array');
    });
  });
});

describe('Pipeline Integration Scenarios', () => {
  describe('End-to-End Workflow Simulation', () => {
    it('should simulate successful promotion pipeline', async () => {
      // Stage 1: Validate staging readiness
      const stagingStatus = {
        deploymentSuccess: true,
        testsPass: true,
        healthCheckPass: true,
        imageAge: 1
      };
      
      const readiness = PromotionPipelineValidator.validatePromotionReadiness(stagingStatus);
      expect(readiness.ready).toBe(true);
      
      // Stage 2: Validate image tag
      const imageTag = 'staging-abc123';
      const tagValidation = PromotionPipelineValidator.validateImageTag(imageTag);
      expect(tagValidation.valid).toBe(true);
      
      // Stage 3: Generate promotion metadata
      const metadata = PromotionPipelineValidator.generatePromotionMetadata({
        stagingImage: `ghcr.io/bxtech/dotca:${imageTag}`,
        promotionReason: 'Integration test promotion',
        approvedBy: 'test-system'
      });
      expect(metadata['promotion.source']).toBe('automated-pipeline');
      
      // Stage 4: Calculate deployment risk
      const risk = PromotionPipelineValidator.calculateDeploymentRisk({
        stagingTestCoverage: 90,
        imageSize: 600,
        hasBreakingChanges: false,
        deploymentWindow: 'after-hours',
        rollbackComplexity: 'low'
      });
      expect(risk.level).not.toBe('critical');
      
      // Stage 5: Simulate workflow execution
      const workflowResult = IntegrationTestHelpers.simulateWorkflowResult(true, {
        promotionId: metadata['promotion.id'],
        riskLevel: risk.level
      });
      expect(workflowResult.success).toBe(true);
    });

    it('should handle promotion failure scenarios', () => {
      // Scenario: Staging tests failing
      const stagingStatus = {
        deploymentSuccess: true,
        testsPass: false,
        healthCheckPass: true,
        imageAge: 1
      };
      
      const readiness = PromotionPipelineValidator.validatePromotionReadiness(stagingStatus);
      expect(readiness.ready).toBe(false);
      expect(readiness.issues).toContain('Staging tests are failing');
      
      // Should not proceed with promotion when not ready
      const workflowResult = IntegrationTestHelpers.simulateWorkflowResult(false, {
        reason: 'Promotion blocked due to failed staging tests'
      });
      expect(workflowResult.success).toBe(false);
    });

    it('should handle rollback scenarios', () => {
      const availableTargets = [
        'ghcr.io/bxtech/dotca:main-def456',
        'ghcr.io/bxtech/dotca:rollback-20231201-hotfix'
      ];
      
      // Test rollback target selection
      const rollbackTarget = availableTargets[1]; // Choose rollback image
      const validation = PromotionPipelineValidator.validateRollbackTarget(
        rollbackTarget,
        availableTargets
      );
      
      expect(validation.valid).toBe(true);
      
      // Simulate rollback execution
      const rollbackResult = IntegrationTestHelpers.simulateWorkflowResult(true, {
        rollbackTarget,
        rollbackReason: 'Critical production issue'
      });
      expect(rollbackResult.success).toBe(true);
    });
  });
});

// Export helpers for use in other test files
export { PromotionPipelineValidator, IntegrationTestHelpers };
