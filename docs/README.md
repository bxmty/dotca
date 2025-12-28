# DotCA Project Documentation

This directory contains all project documentation organized by topic area.

## 📚 Documentation Structure

### 🏗️ [CI/CD Pipeline](./cicd/)

Comprehensive documentation for the image promotion CI/CD pipeline.

- **[Architecture Overview](./cicd/cicd-architecture-comparison.md)** - Pipeline design and deployment strategies
- **[Deployment Guide](./cicd/DEPLOYMENT_GHCR.md)** - GitHub Container Registry deployment procedures
- **[Image Promotion](./cicd/image-promotion-workflow.md)** - Detailed promotion workflow with error handling
- **[Image Tagging](./cicd/image-tagging-strategy.md)** - Naming conventions and lifecycle management
- **[Rollback Strategy](./cicd/rollback-strategy-retention-policy.md)** - Emergency procedures and retention policies

### 🔧 Infrastructure & Operations

- **[Component Interactions](./component-interaction-diagram.md)** - System architecture and data flow
- **[SSH Key Management](./SSH_KEY_MANAGEMENT.md)** - Secure key management and access control
- **[Secrets Rotation Guide](./SECRETS_ROTATION_GUIDE.md)** - Comprehensive secret rotation procedures and security practices

## 🚀 Quick Start

### For New Contributors

1. **CI/CD Pipeline**: Start with the [CI/CD README](./cicd/README.md) to understand deployments
2. **Architecture**: Read the [Component Interaction Diagram](./component-interaction-diagram.md)
3. **Security**: Review [SSH Key Management](./SSH_KEY_MANAGEMENT.md) for access procedures

### For DevOps Engineers

1. **Security First**: Review [Secrets Rotation Guide](./SECRETS_ROTATION_GUIDE.md) for security procedures
2. **Pipeline Architecture**: Study [CI/CD Architecture](./cicd/cicd-architecture-comparison.md)
3. **Promotion Workflows**: Master [Image Promotion](./cicd/image-promotion-workflow.md)
4. **Emergency Procedures**: Know [Rollback Strategy](./cicd/rollback-strategy-retention-policy.md)

## 🔗 Related Directories

- **`ansible/`** - Configuration management and deployment playbooks
- **`terraform/`** - Infrastructure as Code for cloud resources
- **`.github/workflows/`** - GitHub Actions CI/CD pipeline definitions
- **`src/`** - Application source code
- **`public/`** - Static assets and configuration files

## 📞 Support

- **Documentation Issues**: Update files directly and create PRs
- **Technical Questions**: Check workflow comments and code documentation
- **Emergency Procedures**: See CI/CD rollback documentation for production issues

---

**Last Updated**: Documentation reflects current implementation. Please update when making changes.
