#!/bin/bash
# Emergency Cache Clear Script
# Use this script when cache corruption causes application issues

PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_PATH/storage/logs/emergency-cache-clear.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ===== EMERGENCY CACHE CLEAR STARTED =====" >> "$LOG_FILE"
echo "🚨 Emergency Cache Clear - $(date)"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_action() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

print_status() {
    echo -e "${BLUE}[CACHE]${NC} $1"
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

# Safety check - confirm destructive action
confirm_action() {
    if [[ "$1" != "--force" ]]; then
        echo "This will clear ALL caches and restart queue workers."
        read -p "Are you sure? (type 'yes' to confirm): " -r
        if [[ ! "$REPLY" =~ ^yes$ ]]; then
            echo "Operation cancelled."
            exit 0
        fi
    fi
}

# Clear Laravel caches
clear_laravel_caches() {
    print_status "Clearing Laravel caches..."

    cd "$PROJECT_PATH" || {
        print_error "Cannot access project directory: $PROJECT_PATH"
        return 1
    }

    # Clear application caches
    print_status "Clearing application cache..."
    if php artisan cache:clear >> "$LOG_FILE" 2>&1; then
        print_success "Application cache cleared"
        log_action "Application cache: CLEARED"
    else
        print_error "Failed to clear application cache"
        log_action "Application cache: FAILED"
    fi

    # Clear config cache
    print_status "Clearing configuration cache..."
    if php artisan config:clear >> "$LOG_FILE" 2>&1; then
        print_success "Configuration cache cleared"
        log_action "Configuration cache: CLEARED"
    else
        print_error "Failed to clear configuration cache"
        log_action "Configuration cache: FAILED"
    fi

    # Clear route cache
    print_status "Clearing route cache..."
    if php artisan route:clear >> "$LOG_FILE" 2>&1; then
        print_success "Route cache cleared"
        log_action "Route cache: CLEARED"
    else
        print_error "Failed to clear route cache"
        log_action "Route cache: FAILED"
    fi

    # Clear view cache
    print_status "Clearing view cache..."
    if php artisan view:clear >> "$LOG_FILE" 2>&1; then
        print_success "View cache cleared"
        log_action "View cache: CLEARED"
    else
        print_error "Failed to clear view cache"
        log_action "View cache: FAILED"
    fi
}

# Clear file system caches
clear_file_caches() {
    print_status "Clearing file system caches..."

    # Clear framework cache directory
    CACHE_DIR="$PROJECT_PATH/storage/framework/cache"
    if [[ -d "$CACHE_DIR" ]]; then
        print_status "Clearing framework cache directory..."
        if rm -rf "${CACHE_DIR}/data/"* 2>/dev/null; then
            print_success "Framework cache directory cleared"
            log_action "Framework cache directory: CLEARED"
        else
            print_warning "Some files in framework cache directory could not be removed"
            log_action "Framework cache directory: PARTIAL"
        fi
    fi

    # Clear compiled views
    VIEW_DIR="$PROJECT_PATH/storage/framework/views"
    if [[ -d "$VIEW_DIR" ]]; then
        print_status "Clearing compiled views..."
        if rm -rf "${VIEW_DIR}/"* 2>/dev/null; then
            print_success "Compiled views cleared"
            log_action "Compiled views: CLEARED"
        else
            print_warning "Some compiled views could not be removed"
            log_action "Compiled views: PARTIAL"
        fi
    fi
}

# Restart queue workers
restart_queue_workers() {
    print_status "Restarting queue workers..."

    if command -v supervisorctl >/dev/null 2>&1; then
        print_status "Restarting HMS queue workers..."
        if supervisorctl restart hms-queue-worker:* >> "$LOG_FILE" 2>&1; then
            print_success "Queue workers restarted"
            log_action "Queue workers: RESTARTED"
        else
            print_warning "Failed to restart queue workers via supervisor"
            log_action "Queue workers: RESTART_FAILED"
        fi
    else
        print_warning "Supervisor not available - queue workers not restarted"
        log_action "Queue workers: SUPERVISOR_NOT_AVAILABLE"
    fi
}

# Warm critical caches
warm_critical_caches() {
    print_status "Warming critical caches..."

    cd "$PROJECT_PATH" || return 1

    print_status "Warming form caches (departments, doctors)..."
    if php artisan cache:warmup --forms-only >> "$LOG_FILE" 2>&1; then
        print_success "Critical caches warmed"
        log_action "Critical caches: WARMED"
    else
        print_error "Failed to warm critical caches"
        log_action "Critical caches: WARM_FAILED"
    fi
}

# Verify system status after clearing
verify_system() {
    print_status "Verifying system status..."

    cd "$PROJECT_PATH" || return 1

    # Test basic Laravel functionality
    if php artisan --version >> "$LOG_FILE" 2>&1; then
        print_success "Laravel core functionality: OK"
        log_action "Laravel core: OK"
    else
        print_error "Laravel core functionality: FAILED"
        log_action "Laravel core: FAILED"
    fi

    # Test database connection
    if php artisan db:health-check --connections | grep -q "✅ Database connection: Healthy" >> "$LOG_FILE" 2>&1; then
        print_success "Database connection: OK"
        log_action "Database connection: OK"
    else
        print_error "Database connection: FAILED"
        log_action "Database connection: FAILED"
    fi

    # Test cache functionality
    if php artisan cache:warmup | head -5 | grep -q "Cache warmup" >> "$LOG_FILE" 2>&1; then
        print_success "Cache system: OK"
        log_action "Cache system: OK"
    else
        print_error "Cache system: FAILED"
        log_action "Cache system: FAILED"
    fi
}

# Generate recovery report
generate_report() {
    echo "" >> "$LOG_FILE"
    echo "[$TIMESTAMP] ===== EMERGENCY CACHE CLEAR REPORT =====" >> "$LOG_FILE"

    # Count operations
    CLEARED=$(grep -c "CLEARED\|RESTARTED" "$LOG_FILE" 2>/dev/null || echo "0")
    FAILED=$(grep -c "FAILED" "$LOG_FILE" 2>/dev/null || echo "0")

    echo "[$TIMESTAMP] Operations completed: $CLEARED" >> "$LOG_FILE"
    echo "[$TIMESTAMP] Operations failed: $FAILED" >> "$LOG_FILE"

    if [[ "$FAILED" -eq 0 ]]; then
        echo "[$TIMESTAMP] Status: SUCCESS - All operations completed" >> "$LOG_FILE"
        print_success "Emergency cache clear completed successfully"
    else
        echo "[$TIMESTAMP] Status: PARTIAL - Some operations failed" >> "$LOG_FILE"
        print_warning "Emergency cache clear completed with $FAILED failed operations"
    fi

    echo "[$TIMESTAMP] ===== END OF EMERGENCY CACHE CLEAR =====" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Main execution
main() {
    confirm_action "$1"

    log_action "Starting emergency cache clear operation"

    clear_laravel_caches
    echo "" >> "$LOG_FILE"

    clear_file_caches
    echo "" >> "$LOG_FILE"

    restart_queue_workers
    echo "" >> "$LOG_FILE"

    warm_critical_caches
    echo "" >> "$LOG_FILE"

    verify_system
    echo "" >> "$LOG_FILE"

    generate_report

    echo ""
    print_status "Operation complete. Check $LOG_FILE for detailed log."
    echo ""
    print_status "Next steps:"
    echo "  1. Monitor application performance"
    echo "  2. Check logs for any remaining issues"
    echo "  3. Run: ./scripts/monitor-performance.sh"
}

# Run main function
main "$@"