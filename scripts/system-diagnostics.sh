#!/bin/bash
# HMS System Diagnostics Script
# Comprehensive system health check and diagnostics

PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIAG_FILE="$PROJECT_PATH/storage/logs/system-diagnostics-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ===== HMS SYSTEM DIAGNOSTICS STARTED =====" > "$DIAG_FILE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[DIAG]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_entry() {
    echo "[$TIMESTAMP] $1" >> "$DIAG_FILE"
}

# System Information
check_system_info() {
    print_header "SYSTEM INFORMATION"

    log_entry "=== SYSTEM INFORMATION ==="

    # OS Information
    if [[ -f /etc/os-release ]]; then
        OS_INFO=$(grep -E '^(PRETTY_NAME|VERSION)=' /etc/os-release | tr -d '"' | sed 's/.*=//')
        echo "Operating System: $OS_INFO"
        log_entry "OS: $OS_INFO"
    fi

    # Memory Information
    if command -v free >/dev/null 2>&1; then
        MEM_INFO=$(free -h | grep '^Mem:')
        echo "Memory: $MEM_INFO"
        log_entry "Memory: $MEM_INFO"
    fi

    # Disk Information
    if command -v df >/dev/null 2>&1; then
        DISK_INFO=$(df -h "$PROJECT_PATH" | tail -1)
        echo "Disk Usage (Project): $DISK_INFO"
        log_entry "Disk: $DISK_INFO"
    fi

    # CPU Information
    if [[ -f /proc/cpuinfo ]]; then
        CPU_CORES=$(grep -c '^processor' /proc/cpuinfo)
        CPU_MODEL=$(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^ *//')
        echo "CPU: $CPU_MODEL ($CPU_CORES cores)"
        log_entry "CPU: $CPU_MODEL ($CPU_CORES cores)"
    fi
}

# PHP Environment Check
check_php_environment() {
    print_header "PHP ENVIRONMENT"

    log_entry "=== PHP ENVIRONMENT ==="

    if command -v php >/dev/null 2>&1; then
        PHP_VERSION=$(php -r "echo PHP_VERSION;")
        echo "PHP Version: $PHP_VERSION"
        log_entry "PHP Version: $PHP_VERSION"

        # PHP Extensions
        REQUIRED_EXTS=("pdo" "mbstring" "openssl" "tokenizer" "xml" "ctype" "json" "bcmath")
        MISSING_EXTS=()

        for ext in "${REQUIRED_EXTS[@]}"; do
            if php -m | grep -qi "^$ext$"; then
                echo "Extension $ext: ✓"
            else
                echo "Extension $ext: ✗ MISSING"
                MISSING_EXTS+=("$ext")
            fi
        done

        if [[ ${#MISSING_EXTS[@]} -gt 0 ]]; then
            print_warning "Missing PHP extensions: ${MISSING_EXTS[*]}"
            log_entry "Missing PHP extensions: ${MISSING_EXTS[*]}"
        else
            print_success "All required PHP extensions present"
            log_entry "PHP extensions: OK"
        fi

        # PHP Memory Limit
        PHP_MEMORY=$(php -r "echo ini_get('memory_limit');")
        echo "PHP Memory Limit: $PHP_MEMORY"
        log_entry "PHP Memory Limit: $PHP_MEMORY"

        # PHP Max Execution Time
        PHP_TIME=$(php -r "echo ini_get('max_execution_time');")
        echo "PHP Max Execution Time: ${PHP_TIME}s"
        log_entry "PHP Max Execution Time: ${PHP_TIME}s"

    else
        print_error "PHP not found in PATH"
        log_entry "PHP: NOT FOUND"
    fi
}

# Laravel Application Check
check_laravel_app() {
    print_header "LARAVEL APPLICATION"

    log_entry "=== LARAVEL APPLICATION ==="

    cd "$PROJECT_PATH" || {
        print_error "Cannot access project directory: $PROJECT_PATH"
        log_entry "Project access: FAILED"
        return 1
    }

    # Laravel Version
    if [[ -f "composer.json" ]]; then
        LARAVEL_VERSION=$(php artisan --version 2>/dev/null || echo "Unknown")
        echo "Laravel Version: $LARAVEL_VERSION"
        log_entry "Laravel Version: $LARAVEL_VERSION"
    fi

    # Environment
    ENV_FILE=".env"
    if [[ -f "$ENV_FILE" ]]; then
        print_success ".env file exists"
        log_entry ".env file: EXISTS"

        # Check key environment variables
        ENV_VARS=("APP_NAME" "APP_ENV" "DB_CONNECTION" "CACHE_STORE")
        for var in "${ENV_VARS[@]}"; do
            if grep -q "^$var=" ".env"; then
                echo "Environment variable $var: ✓ Set"
            else
                echo "Environment variable $var: ⚠ Not set"
            fi
        done
    else
        print_error ".env file missing"
        log_entry ".env file: MISSING"
    fi

    # Storage permissions
    STORAGE_DIRS=("storage" "storage/logs" "storage/framework" "storage/framework/cache" "storage/framework/sessions")
    for dir in "${STORAGE_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            if [[ -w "$dir" ]]; then
                echo "Directory $dir: ✓ Writable"
            else
                echo "Directory $dir: ✗ Not writable"
                log_entry "Storage permission issue: $dir"
            fi
        else
            echo "Directory $dir: ⚠ Missing"
        fi
    done
}

# Database Diagnostics
check_database() {
    print_header "DATABASE DIAGNOSTICS"

    log_entry "=== DATABASE DIAGNOSTICS ==="

    cd "$PROJECT_PATH" || return 1

    # Database Connection
    if php artisan db:health-check --connections >> "$DIAG_FILE" 2>&1; then
        if grep -q "✅ Database connection: Healthy" "$DIAG_FILE"; then
            print_success "Database connection: HEALTHY"
            log_entry "Database connection: HEALTHY"
        else
            print_error "Database connection: ISSUES DETECTED"
            log_entry "Database connection: ISSUES"
        fi
    else
        print_error "Cannot check database connection"
        log_entry "Database connection: UNCHECKABLE"
    fi

    # MySQL Version (if applicable)
    if command -v mysql >/dev/null 2>&1; then
        MYSQL_VERSION=$(mysql --version 2>/dev/null | head -1 || echo "Unknown")
        echo "MySQL Version: $MYSQL_VERSION"
        log_entry "MySQL Version: $MYSQL_VERSION"
    fi

    # Database Size
    php artisan db:health-check | grep -E "(Table Sizes|size_mb)" | head -5 >> "$DIAG_FILE" 2>&1 || true
}

# Cache System Check
check_cache_system() {
    print_header "CACHE SYSTEM"

    log_entry "=== CACHE SYSTEM ==="

    cd "$PROJECT_PATH" || return 1

    # Cache Driver
    CACHE_DRIVER=$(php artisan tinker --execute="echo config('cache.default');" 2>/dev/null | tr -d '\n' || echo "unknown")
    echo "Cache Driver: $CACHE_DRIVER"
    log_entry "Cache Driver: $CACHE_DRIVER"

    # Cache Status
    if php artisan cache:warmup | head -3 >> "$DIAG_FILE" 2>&1; then
        print_success "Cache system operational"
        log_entry "Cache system: OPERATIONAL"
    else
        print_error "Cache system issues detected"
        log_entry "Cache system: ISSUES"
    fi

    # Cache Size
    CACHE_SIZE=$(php artisan monitor:system-health --cache 2>/dev/null | grep "Cache Size" | head -1 || echo "Cache Size: Unknown")
    echo "$CACHE_SIZE"
    log_entry "$CACHE_SIZE"
}

# Queue System Check
check_queue_system() {
    print_header "QUEUE SYSTEM"

    log_entry "=== QUEUE SYSTEM ==="

    cd "$PROJECT_PATH" || return 1

    # Queue Driver
    QUEUE_DRIVER=$(php artisan tinker --execute="echo config('queue.default');" 2>/dev/null | tr -d '\n' || echo "unknown")
    echo "Queue Driver: $QUEUE_DRIVER"
    log_entry "Queue Driver: $QUEUE_DRIVER"

    # Supervisor Status
    if command -v supervisorctl >/dev/null 2>&1; then
        if supervisorctl status hms-queue-worker:* >/dev/null 2>&1; then
            WORKER_STATUS=$(supervisorctl status hms-queue-worker:* 2>/dev/null | head -2)
            echo "Supervisor workers: $WORKER_STATUS"
            log_entry "Supervisor workers: $WORKER_STATUS"

            if echo "$WORKER_STATUS" | grep -q "RUNNING"; then
                print_success "Queue workers: RUNNING"
                log_entry "Queue workers: RUNNING"
            else
                print_warning "Queue workers: NOT RUNNING"
                log_entry "Queue workers: NOT RUNNING"
            fi
        else
            print_warning "HMS queue workers not configured in supervisor"
            log_entry "Supervisor: HMS workers not configured"
        fi
    else
        print_warning "Supervisor not installed"
        log_entry "Supervisor: NOT INSTALLED"
    fi

    # Failed Jobs
    FAILED_JOBS=$(php artisan queue:failed 2>/dev/null | grep -c "failed jobs table\|Failed Jobs" || echo "0")
    echo "Failed queue jobs: $FAILED_JOBS"
    log_entry "Failed queue jobs: $FAILED_JOBS"

    if [[ "$FAILED_JOBS" -gt 0 ]]; then
        print_warning "$FAILED_JOBS failed queue jobs detected"
    fi
}

# Performance Metrics
check_performance() {
    print_header "PERFORMANCE METRICS"

    log_entry "=== PERFORMANCE METRICS ==="

    cd "$PROJECT_PATH" || return 1

    # Recent Performance Data
    if php artisan db:health-check --performance >> "$DIAG_FILE" 2>&1; then
        print_success "Performance check completed"
        log_entry "Performance check: COMPLETED"
    else
        print_error "Performance check failed"
        log_entry "Performance check: FAILED"
    fi

    # Memory Usage
    PHP_MEMORY=$(ps aux --no-headers -o pmem -C php 2>/dev/null | awk '{sum+=$1} END {print sum"%"}' || echo "N/A")
    echo "PHP Memory Usage: $PHP_MEMORY"
    log_entry "PHP Memory Usage: $PHP_MEMORY"

    # System Load
    if command -v uptime >/dev/null 2>&1; then
        LOAD_AVERAGE=$(uptime | awk -F'load average:' '{ print $2 }' | sed 's/^ *//')
        echo "System Load Average: $LOAD_AVERAGE"
        log_entry "System Load Average: $LOAD_AVERAGE"
    fi
}

# Recommendations
generate_recommendations() {
    print_header "RECOMMENDATIONS"

    log_entry "=== RECOMMENDATIONS ==="

    # Analyze collected data and provide recommendations
    RECOMMENDATIONS=()

    # Memory recommendations
    if [[ -f "$PROJECT_PATH/.env" ]]; then
        PHP_MEMORY_LIMIT=$(grep "memory_limit" "$PROJECT_PATH/.env" 2>/dev/null | cut -d'=' -f2 || echo "")
        if [[ -n "$PHP_MEMORY_LIMIT" ]] && [[ "$PHP_MEMORY_LIMIT" == "128M" ]] || [[ "$PHP_MEMORY_LIMIT" == "256M" ]]; then
            RECOMMENDATIONS+=("Consider increasing PHP memory_limit to 512M or higher for better performance")
        fi
    fi

    # Queue recommendations
    if ! command -v supervisorctl >/dev/null 2>&1; then
        RECOMMENDATIONS+=("Install Supervisor for proper queue worker management")
    fi

    # Cache recommendations
    CACHE_DRIVER=$(php artisan tinker --execute="echo config('cache.default');" 2>/dev/null | tr -d '\n' 2>/dev/null || echo "file")
    if [[ "$CACHE_DRIVER" == "file" ]]; then
        RECOMMENDATIONS+=("Consider using Redis for better cache performance in production")
    fi

    # Database recommendations
    if command -v mysql >/dev/null 2>&1; then
        MYSQL_CONFIG_STATUS="MySQL performance config not detected"
        if [[ -f "/etc/mysql/mysql.conf.d/z-hms-performance.cnf" ]]; then
            MYSQL_CONFIG_STATUS="MySQL performance config detected"
        else
            RECOMMENDATIONS+=("Install MySQL performance configuration for better database performance")
        fi
        log_entry "MySQL Config: $MYSQL_CONFIG_STATUS"
    fi

    # Display recommendations
    if [[ ${#RECOMMENDATIONS[@]} -gt 0 ]]; then
        print_warning "Recommendations for optimization:"
        for rec in "${RECOMMENDATIONS[@]}"; do
            echo "  • $rec"
            log_entry "Recommendation: $rec"
        done
    else
        print_success "No critical issues found - system configuration looks good"
        log_entry "Recommendations: NONE - System well configured"
    fi
}

# Main execution
main() {
    echo "🏥 HMS System Diagnostics"
    echo "========================"
    echo "Running comprehensive system health check..."
    echo ""

    check_system_info
    check_php_environment
    check_laravel_app
    check_database
    check_cache_system
    check_queue_system
    check_performance
    generate_recommendations

    echo ""
    print_header "DIAGNOSTICS COMPLETE"
    echo "📋 Full report saved to: $DIAG_FILE"
    echo "🔍 Quick summary displayed above"
    echo "📞 Contact system administrator if you see any ✗ or ⚠ indicators"
    echo ""
    echo "Next steps:"
    echo "  • Review recommendations above"
    echo "  • Check full report: $DIAG_FILE"
    echo "  • Run periodic monitoring: ./scripts/monitor-performance.sh"

    log_entry "=== DIAGNOSTICS COMPLETED ==="
    echo "" >> "$DIAG_FILE"
}

# Run diagnostics
main "$@"