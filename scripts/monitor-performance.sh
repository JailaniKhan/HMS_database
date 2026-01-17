#!/bin/bash
# HMS Performance Monitoring Script
# Run this script periodically to monitor system health

PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_PATH/storage/logs/performance-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ===== Starting HMS Performance Monitoring =====" >> "$LOG_FILE"

# Colors for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[MONITOR]${NC} $1"
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

log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# Check if Laravel application is accessible
check_application_health() {
    print_status "Checking application health..."

    if curl -f -s --max-time 10 http://localhost/health-check > /dev/null 2>&1; then
        print_success "Application HTTP health check: PASSED"
        log_message "Application: HEALTHY - HTTP check passed"
    else
        print_error "Application HTTP health check: FAILED"
        log_message "Application: UNHEALTHY - HTTP check failed"
    fi
}

# Check database connectivity and performance
check_database_health() {
    print_status "Checking database health..."

    cd "$PROJECT_PATH" || {
        print_error "Cannot access project directory"
        return 1
    }

    # Test database connection
    if php artisan db:health-check --connections | grep -q "✅ Database connection: Healthy"; then
        print_success "Database connection: HEALTHY"
        log_message "Database: HEALTHY - Connection successful"
    else
        print_error "Database connection: FAILED"
        log_message "Database: UNHEALTHY - Connection failed"
        return 1
    fi

    # Check query performance
    QUERY_COUNT=$(php artisan db:health-check --performance 2>/dev/null | grep -o "Query Count: [0-9]*" | grep -o "[0-9]*" || echo "0")
    SLOW_QUERIES=$(php artisan db:health-check --performance 2>/dev/null | grep -o "Slow Queries: [0-9]*" | grep -o "[0-9]*" || echo "0")

    if [[ "$SLOW_QUERIES" -gt 5 ]]; then
        print_warning "High slow query count detected: $SLOW_QUERIES"
        log_message "Database Performance: WARNING - $SLOW_QUERIES slow queries detected"
    else
        print_success "Database performance: OK (Slow queries: $SLOW_QUERIES)"
        log_message "Database Performance: OK - $SLOW_QUERIES slow queries"
    fi
}

# Check queue system status
check_queue_system() {
    print_status "Checking queue system..."

    if command -v supervisorctl >/dev/null 2>&1; then
        if supervisorctl status hms-queue-worker:* 2>/dev/null | grep -q "RUNNING"; then
            RUNNING_WORKERS=$(supervisorctl status hms-queue-worker:* 2>/dev/null | grep -c "RUNNING")
            print_success "Queue workers: $RUNNING_WORKERS running"
            log_message "Queue System: HEALTHY - $RUNNING_WORKERS workers running"
        else
            print_warning "Queue workers: NOT RUNNING or not configured"
            log_message "Queue System: WARNING - Workers not running"
        fi
    else
        print_warning "Supervisor not available for queue monitoring"
        log_message "Queue System: UNKNOWN - Supervisor not available"
    fi

    # Check for failed jobs
    cd "$PROJECT_PATH" || return 1
    FAILED_COUNT=$(php artisan queue:failed 2>/dev/null | grep -c "failed jobs table\|Failed Jobs" || echo "0")
    if [[ "$FAILED_COUNT" -gt 0 ]]; then
        print_warning "Failed queue jobs detected: $FAILED_COUNT"
        log_message "Queue Jobs: WARNING - $FAILED_COUNT failed jobs"
    else
        log_message "Queue Jobs: OK - No failed jobs"
    fi
}

# Check cache system performance
check_cache_performance() {
    print_status "Checking cache performance..."

    cd "$PROJECT_PATH" || return 1

    # Get cache statistics
    CACHE_STATS=$(php artisan monitor:system-health --cache 2>/dev/null | grep -E "(Cache.*:|\.log)" | head -10 || echo "Cache stats unavailable")

    if echo "$CACHE_STATS" | grep -q "✅ Cached"; then
        print_success "Cache system: OPERATIONAL"
        log_message "Cache System: HEALTHY - Stats collected"
    else
        print_warning "Cache system: ISSUES DETECTED"
        log_message "Cache System: WARNING - Potential issues detected"
    fi

    # Log cache statistics
    echo "$CACHE_STATS" | while read -r line; do
        log_message "Cache: $line"
    done
}

# Monitor system resources
check_system_resources() {
    print_status "Checking system resources..."

    # Memory usage by PHP processes
    PHP_MEMORY=$(ps aux --no-headers -o pmem -C php 2>/dev/null | awk '{sum+=$1} END {print sum"%"}' || echo "N/A")
    if [[ "$PHP_MEMORY" != "N/A" ]]; then
        # Remove % and compare as number
        MEMORY_NUM=$(echo "$PHP_MEMORY" | sed 's/%//')
        if (( $(echo "$MEMORY_NUM > 80" | bc -l 2>/dev/null || echo "0") )); then
            print_warning "High PHP memory usage: $PHP_MEMORY"
            log_message "Memory: WARNING - PHP using $PHP_MEMORY of system memory"
        else
            print_success "PHP memory usage: $PHP_MEMORY"
            log_message "Memory: OK - PHP using $PHP_MEMORY"
        fi
    fi

    # Disk usage for Laravel storage
    STORAGE_USAGE=$(df "$PROJECT_PATH/storage" 2>/dev/null | tail -1 | awk '{print $5}' || echo "N/A")
    if [[ "$STORAGE_USAGE" != "N/A" ]]; then
        USAGE_NUM=$(echo "$STORAGE_USAGE" | sed 's/%//')
        if [[ "$USAGE_NUM" -gt 90 ]]; then
            print_warning "High storage usage: $STORAGE_USAGE"
            log_message "Storage: WARNING - $STORAGE_USAGE used"
        else
            print_success "Storage usage: $STORAGE_USAGE"
            log_message "Storage: OK - $STORAGE_USAGE used"
        fi
    fi

    # Check MySQL connections if available
    if command -v mysql >/dev/null 2>&1; then
        MYSQL_CONNECTIONS=$(mysql -e "SHOW PROCESSLIST" 2>/dev/null | wc -l || echo "0")
        if [[ "$MYSQL_CONNECTIONS" -gt 50 ]]; then
            print_warning "High MySQL connections: $MYSQL_CONNECTIONS"
            log_message "MySQL: WARNING - $MYSQL_CONNECTIONS active connections"
        else
            log_message "MySQL: OK - $MYSQL_CONNECTIONS active connections"
        fi
    fi
}

# Check application logs for errors
check_application_logs() {
    print_status "Checking application logs..."

    LOG_FILE_PATH="$PROJECT_PATH/storage/logs/laravel.log"

    if [[ -f "$LOG_FILE_PATH" ]]; then
        # Count errors in the last hour
        RECENT_ERRORS=$(tail -1000 "$LOG_FILE_PATH" 2>/dev/null | grep -c -i "error\|exception\|critical" || echo "0")

        if [[ "$RECENT_ERRORS" -gt 10 ]]; then
            print_warning "High error count in logs: $RECENT_ERRORS recent errors"
            log_message "Logs: WARNING - $RECENT_ERRORS recent errors detected"
        elif [[ "$RECENT_ERRORS" -gt 0 ]]; then
            print_success "Some errors in logs: $RECENT_ERRORS (monitoring)"
            log_message "Logs: OK - $RECENT_ERRORS errors (within acceptable range)"
        else
            print_success "Application logs: CLEAN"
            log_message "Logs: OK - No recent errors"
        fi

        # Check log file size
        LOG_SIZE=$(stat -f%z "$LOG_FILE_PATH" 2>/dev/null || stat -c%s "$LOG_FILE_PATH" 2>/dev/null || echo "0")
        LOG_SIZE_MB=$(( LOG_SIZE / 1024 / 1024 ))

        if [[ "$LOG_SIZE_MB" -gt 100 ]]; then
            print_warning "Large log file: ${LOG_SIZE_MB}MB - Consider log rotation"
            log_message "Logs: WARNING - Log file size: ${LOG_SIZE_MB}MB"
        fi
    else
        print_warning "Laravel log file not found"
        log_message "Logs: WARNING - Log file not accessible"
    fi
}

# Generate summary report
generate_summary() {
    print_status "Generating monitoring summary..."

    # Count warnings and errors in current run
    WARNINGS=$(grep -c "WARNING" "$LOG_FILE" 2>/dev/null || echo "0")
    ERRORS=$(grep -c "UNHEALTHY\|FAILED" "$LOG_FILE" 2>/dev/null || echo "0")

    echo "" >> "$LOG_FILE"
    echo "[$TIMESTAMP] ===== MONITORING SUMMARY =====" >> "$LOG_FILE"
    echo "[$TIMESTAMP] Warnings: $WARNINGS" >> "$LOG_FILE"
    echo "[$TIMESTAMP] Errors: $ERRORS" >> "$LOG_FILE"

    if [[ "$ERRORS" -gt 0 ]]; then
        print_error "Monitoring completed with $ERRORS errors and $WARNINGS warnings"
        echo "[$TIMESTAMP] Status: CRITICAL - Immediate attention required" >> "$LOG_FILE"
    elif [[ "$WARNINGS" -gt 0 ]]; then
        print_warning "Monitoring completed with $WARNINGS warnings"
        echo "[$TIMESTAMP] Status: WARNING - Review recommended" >> "$LOG_FILE"
    else
        print_success "Monitoring completed successfully - All systems healthy"
        echo "[$TIMESTAMP] Status: HEALTHY - No issues detected" >> "$LOG_FILE"
    fi

    echo "[$TIMESTAMP] ===== End of Monitoring Run =====" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Main execution
main() {
    echo "HMS Performance Monitor - $(date)"
    echo "================================="

    check_application_health
    check_database_health
    check_queue_system
    check_cache_performance
    check_system_resources
    check_application_logs

    generate_summary

    echo ""
    print_status "Monitoring complete. Check $LOG_FILE for detailed logs."
}

# Run main function
main "$@"