# HMS - Enhanced Permission Management System

Hospital Management System with comprehensive permission management, approval workflows, temporary permissions, and advanced security features.

## 🚀 New Features (Phase 4)

### Enhanced Permission Management

- **Role-Based Access Control (RBAC)**: Flexible role-permission assignments
- **User-Specific Permissions**: Individual permission overrides
- **Permission Dependencies**: Automatic validation of prerequisite permissions
- **Temporary Permissions**: Time-limited access grants with full audit trail

### Approval Workflow System

- **Structured Approval Process**: Multi-level permission change requests
- **Automated Validation**: Dependency checking and business rule enforcement
- **Complete Audit Trail**: Full tracking of requests, approvals, and rejections
- **Expiration Handling**: Automatic cleanup of stale requests

### Security & Monitoring

- **Anomaly Detection**: Real-time monitoring for suspicious permission activities
- **IP-Based Restrictions**: Network-level access control
- **Rate Limiting**: Protection against API abuse
- **Session Tracking**: Comprehensive user activity monitoring
- **Audit Logging**: Immutable security event logging

### Advanced Caching

- **Multi-Layer Caching**: Application, database, and query result caching
- **Smart Invalidation**: Event-driven cache clearing
- **Performance Optimization**: Sub-millisecond permission checks
- **Cache Monitoring**: Real-time performance metrics

## 🏗️ Architecture

### Core Components

- **Permission Engine**: High-performance authorization system
- **Approval Workflow**: Stateful permission change management
- **Security Monitor**: Real-time threat detection and response
- **Audit System**: Comprehensive security event logging
- **Cache Manager**: Intelligent caching with automatic invalidation

### Database Schema

- **Permissions**: Core permission definitions with metadata
- **Role Permissions**: RBAC role-permission mappings
- **User Permissions**: Individual user permission overrides
- **Temporary Permissions**: Time-bound permission grants
- **Permission Dependencies**: Prerequisite relationship definitions
- **Permission Change Requests**: Approval workflow tracking
- **Audit Logs**: Security event storage

## 📋 API Documentation

Complete OpenAPI 3.0 specification available at:
- `docs/api/permissions-api.yaml`

### Key Endpoints

```http
POST   /api/v1/admin/permissions/grant-temporary
DELETE /api/v1/admin/permissions/revoke-temporary/{id}
GET    /api/v1/admin/permissions/change-requests
POST   /api/v1/admin/permissions/change-requests
POST   /api/v1/admin/permissions/change-requests/{id}/approve
POST   /api/v1/admin/permissions/change-requests/{id}/reject
```

## 🧪 Testing

Comprehensive test suite covering:

### Unit Tests
- `tests/Unit/PermissionDependencyTest.php` - Permission dependency validation
- `tests/Unit/PermissionAnomalyDetectorTest.php` - Anomaly detection algorithms

### Feature Tests
- `tests/Feature/PermissionManagementTest.php` - Core permission functionality
- `tests/Feature/TemporaryPermissionTest.php` - Temporary permission lifecycle
- `tests/Feature/PermissionApprovalWorkflowTest.php` - End-to-end approval workflow
- `tests/Feature/PermissionSecurityTest.php` - Security vulnerability testing
- `tests/Feature/PermissionPerformanceTest.php` - Performance benchmarking

### Running Tests

```bash
# Run all tests
composer test

# Run specific test suite
php artisan test tests/Feature/PermissionManagementTest.php

# Run with coverage
php artisan test --coverage
```

## 📚 Documentation

### User Guides
- `docs/user-guides/administrator-permission-management.md` - Admin operations guide
- `docs/user-guides/approval-workflow-user-guide.md` - Approval workflow usage
- `docs/user-guides/security-best-practices.md` - Security guidelines

### Technical Documentation
- `docs/technical/architecture-overview.md` - System architecture
- `docs/technical/database-schema.md` - Database design
- `docs/technical/caching-strategy.md` - Caching implementation
- `docs/technical/security-measures.md` - Security controls

### Deployment
- `docs/deployment/deployment-guide.md` - Production deployment procedures

## 🔧 Installation & Setup

### Prerequisites

- PHP 8.1+
- Laravel 10+
- MySQL 8.0+ or PostgreSQL 13+
- Redis 6.0+ (recommended)
- Node.js 16+

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd hms-permission-system
   composer install
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   # Configure database and Redis settings
   ```

3. **Database Migration**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

4. **Cache Configuration**
   ```bash
   php artisan permission:cache-warm
   ```

5. **Start Services**
   ```bash
   php artisan serve
   npm run dev
   ```

### Production Deployment

See `docs/deployment/deployment-guide.md` for detailed deployment procedures.

## 🔒 Security Features

### Authentication & Authorization
- Multi-factor authentication (MFA) support
- Hardware security key integration
- Session management with automatic timeouts
- IP-based access restrictions

### Threat Detection
- Real-time anomaly detection
- Unusual permission grant monitoring
- Geographic access pattern analysis
- Automated threat response

### Audit & Compliance
- Comprehensive audit logging
- Immutable security event storage
- HIPAA-compliant data handling
- Automated compliance reporting

## 📊 Performance Characteristics

### Benchmarks (Expected)

- **Permission Check**: <50ms average
- **Cache Hit Rate**: >95%
- **API Response Time**: <200ms (p95)
- **Concurrent Users**: 10,000+ with proper scaling

### Monitoring

Real-time performance monitoring includes:
- Permission check latency
- Cache hit/miss ratios
- Database query performance
- Security event frequency

## 🚀 Scaling Considerations

### Horizontal Scaling
- Database read replicas
- Redis cluster for caching
- Load balancer configuration
- Queue-based background processing

### High Availability
- Multi-region deployment support
- Automatic failover procedures
- Database replication
- Backup and recovery automation

## 🤝 Contributing

### Development Setup
1. Follow Laravel coding standards
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Ensure security review for permission-related code

### Code Quality
- PSR-12 coding standards
- Comprehensive test coverage (>80%)
- Security code reviews required
- Performance benchmarking for core functions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: See `docs/` directory for comprehensive guides
- **Issues**: Use GitHub issues for bug reports and feature requests
- **Security**: Report security vulnerabilities via security@company.com

---

**Version**: 4.0.0
**Release Date**: January 2026
**Previous Version**: 3.0.0 (Basic Permission System)
