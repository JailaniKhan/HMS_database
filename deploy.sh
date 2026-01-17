#!/bin/bash

# HMS Database Performance Optimization Deployment Script
# This script sets up the production environment for optimal database performance

set -e

echo "🚀 HMS Database Performance Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MYSQL_CONFIG="/etc/mysql/mysql.conf.d/z-hms-performance.cnf"
SUPERVISOR_CONFIG="/etc/supervisor/conf.d/hms-queues.conf"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root for system configuration"
        echo "Usage: sudo $0"
        exit 1
    fi
}

backup_existing_config() {
    local config_file=$1
    local backup_file="${config_file}.backup.$(date +%Y%m%d_%H%M%S)"

    if [[ -f "$config_file" ]]; then
        cp "$config_file" "$backup_file"
        print_success "Backed up existing config: $backup_file"
    fi
}

setup_mysql_config() {
    print_status "Setting up MySQL performance configuration..."

    # Check if MySQL config file exists
    if [[ ! -f "mysql-performance-config.cnf" ]]; then
        print_error "MySQL config file 'mysql-performance-config.cnf' not found in current directory"
        return 1
    fi

    # Backup existing config
    backup_existing_config "$MYSQL_CONFIG"

    # Copy optimized config
    cp "mysql-performance-config.cnf" "$MYSQL_CONFIG"
    print_success "MySQL performance config installed: $MYSQL_CONFIG"

    # Set proper permissions
    chmod 644 "$MYSQL_CONFIG"

    print_warning "Please review and adjust memory settings in $MYSQL_CONFIG based on your server RAM"
    print_status "Restarting MySQL service..."
    systemctl restart mysql

    if systemctl is-active --quiet mysql; then
        print_success "MySQL restarted successfully"
    else
        print_error "MySQL failed to restart. Please check configuration."
        return 1
    fi
}

setup_supervisor() {
    print_status "Setting up Supervisor for queue processing..."

    # Create supervisor configuration
    cat > "$SUPERVISOR_CONFIG" << EOF
[program:hms-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php $PROJECT_PATH/artisan queue:work --queue=reports,default --sleep=3 --tries=3 --max-jobs=1000 --timeout=300
directory=$PROJECT_PATH
user=www-data
numprocs=2
priority=999
autostart=true
autorestart=true
startsecs=5
startretries=3
redirect_stderr=true
stdout_logfile=$PROJECT_PATH/storage/logs/supervisor-queue.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=3

[program:hms-cache-warmer]
process_name=%(program_name)s
command=php $PROJECT_PATH/artisan cache:warmup
directory=$PROJECT_PATH
user=www-data
numprocs=1
priority=1000
autostart=false
autorestart=false
startsecs=5
startretries=1
redirect_stderr=true
stdout_logfile=$PROJECT_PATH/storage/logs/supervisor-cache.log
EOF

    print_success "Supervisor configuration created: $SUPERVISOR_CONFIG"

    # Reload supervisor
    supervisorctl reread
    supervisorctl update

    # Start queue workers
    supervisorctl start hms-queue-worker:*

    if supervisorctl status hms-queue-worker:* | grep -q "RUNNING"; then
        print_success "Queue workers started successfully"
    else
        print_warning "Queue workers may need manual start after deployment"
    fi
}

setup_cron_jobs() {
    print_status "Setting up cron jobs for automated tasks..."

    # Create cron job file
    local cron_file="/etc/cron.d/hms-performance"

    cat > "$cron_file" << EOF
# HMS Performance Monitoring Cron Jobs
# Generated on $(date)

# Run Laravel scheduler every minute
* * * * * www-data cd $PROJECT_PATH && php artisan schedule:run >> /dev/null 2>&1

# Database health check every hour
0 * * * * www-data cd $PROJECT_PATH && php artisan db:health-check --performance >> $PROJECT_PATH/storage/logs/health-check.log 2>&1

# Cache warming daily at 1 AM
0 1 * * * www-data cd $PROJECT_PATH && php artisan cache:warmup >> $PROJECT_PATH/storage/logs/cache-warmup.log 2>&1

# Monthly report generation on 1st at 2 AM
0 2 1 * * www-data cd $PROJECT_PATH && php artisan reports:generate --email=admin@hospital.com >> $PROJECT_PATH/storage/logs/monthly-reports.log 2>&1

# Log rotation weekly
0 3 * * 0 www-data cd $PROJECT_PATH && php artisan db:health-check --optimize >> $PROJECT_PATH/storage/logs/weekly-maintenance.log 2>&1
EOF

    chmod 644 "$cron_file"
    print_success "Cron jobs configured: $cron_file"

    # Test cron syntax
    if crontab -l > /dev/null 2>&1; then
        print_success "Cron service is accessible"
    else
        print_warning "Could not verify cron service. Please check manually."
    fi
}

setup_logrotate() {
    print_status "Setting up log rotation..."

    local logrotate_config="/etc/logrotate.d/hms-performance"

    cat > "$logrotate_config" << EOF
$PROJECT_PATH/storage/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 664 www-data www-data
    postrotate
        supervisorctl restart hms-queue-worker:* > /dev/null 2>&1 || true
    endscript
}
EOF

    chmod 644 "$logrotate_config"
    print_success "Log rotation configured: $logrotate_config"
}

create_monitoring_scripts() {
    print_status "Creating monitoring and maintenance scripts..."

    local scripts_dir="$PROJECT_PATH/scripts"
    mkdir -p "$scripts_dir"

    # Performance monitoring script
    cat > "$scripts_dir/monitor-performance.sh" << 'EOF'
#!/bin/bash
# HMS Performance Monitoring Script

PROJECT_PATH="$(dirname "$(dirname "$0")")"
LOG_FILE="$PROJECT_PATH/storage/logs/performance-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting performance monitoring..." >> "$LOG_FILE"

# Check application health
if curl -f -s http://localhost/health-check > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Application: HEALTHY" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] Application: UNHEALTHY - HTTP check failed" >> "$LOG_FILE"
fi

# Database connection check
cd "$PROJECT_PATH" || exit 1
if php artisan db:health-check --connections | grep -q "✅ Database connection: Healthy"; then
    echo "[$TIMESTAMP] Database: HEALTHY" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] Database: UNHEALTHY" >> "$LOG_FILE"
fi

# Queue status
if supervisorctl status hms-queue-worker:* | grep -q "RUNNING"; then
    echo "[$TIMESTAMP] Queue Workers: RUNNING" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] Queue Workers: NOT RUNNING" >> "$LOG_FILE"
fi

# Memory usage
MEMORY_USAGE=$(ps aux --no-headers -o pmem -C php | awk '{sum+=$1} END {print sum"%"}' 2>/dev/null || echo "N/A")
echo "[$TIMESTAMP] PHP Memory Usage: $MEMORY_USAGE" >> "$LOG_FILE"

echo "[$TIMESTAMP] Performance monitoring completed." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
EOF

    chmod +x "$scripts_dir/monitor-performance.sh"

    # Emergency cache clear script
    cat > "$scripts_dir/emergency-cache-clear.sh" << 'EOF'
#!/bin/bash
# Emergency Cache Clear Script

PROJECT_PATH="$(dirname "$(dirname "$0")")"
LOG_FILE="$PROJECT_PATH/storage/logs/emergency-cache-clear.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting emergency cache clear..." >> "$LOG_FILE"

cd "$PROJECT_PATH" || exit 1

# Clear all Laravel caches
php artisan cache:clear >> "$LOG_FILE" 2>&1
php artisan config:clear >> "$LOG_FILE" 2>&1
php artisan route:clear >> "$LOG_FILE" 2>&1
php artisan view:clear >> "$LOG_FILE" 2>&1

# Clear file-based caches
rm -rf storage/framework/cache/data/* 2>/dev/null || true
rm -rf storage/framework/views/* 2>/dev/null || true

# Warm critical caches
php artisan cache:warmup --forms-only >> "$LOG_FILE" 2>&1

echo "[$TIMESTAMP] Emergency cache clear completed." >> "$LOG_FILE"
EOF

    chmod +x "$scripts_dir/emergency-cache-clear.sh"

    print_success "Monitoring scripts created in: $scripts_dir"
}

run_post_deployment_checks() {
    print_status "Running post-deployment checks..."

    cd "$PROJECT_PATH" || return 1

    # Test Laravel commands
    if php artisan --version > /dev/null 2>&1; then
        print_success "Laravel installation: OK"
    else
        print_error "Laravel installation: FAILED"
        return 1
    fi

    # Test database connection
    if php artisan db:health-check --connections | grep -q "✅ Database connection: Healthy"; then
        print_success "Database connection: OK"
    else
        print_error "Database connection: FAILED"
        return 1
    fi

    # Test queue system
    if php artisan queue:failed | grep -q "failed jobs table"; then
        print_success "Queue system: OK"
    else
        print_warning "Queue system: May need manual verification"
    fi

    # Test cache system
    if php artisan cache:warmup | grep -q "Cache warmup completed"; then
        print_success "Cache system: OK"
    else
        print_warning "Cache system: May need manual verification"
    fi
}

main() {
    print_status "Starting HMS Performance Deployment..."

    # Check if running as root for system config
    if [[ "$1" == "--system-config" ]]; then
        check_root
        setup_mysql_config
        setup_supervisor
        setup_cron_jobs
        setup_logrotate
    fi

    # Always run application setup
    create_monitoring_scripts
    run_post_deployment_checks

    print_success "HMS Performance Deployment completed!"
    echo ""
    print_status "Next steps:"
    echo "  1. Review MySQL config: $MYSQL_CONFIG"
    echo "  2. Check supervisor: supervisorctl status"
    echo "  3. Verify cron jobs: crontab -l"
    echo "  4. Monitor logs: tail -f storage/logs/laravel.log"
    echo "  5. Run: ./scripts/monitor-performance.sh"
}

# Run main function with all arguments
main "$@"