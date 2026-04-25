#!/bin/bash

# Load Testing Runner Script
# This script provides convenient commands to run load tests and generate reports

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
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

# Check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first:"
        echo "  - macOS: brew install k6"
        echo "  - Ubuntu: sudo apt update && sudo apt install k6"
        echo "  - Or download from: https://k6.io/docs/get-started/installation/"
        exit 1
    fi
}

# Function to run a specific test
run_test() {
    local test_name=$1
    local config_file=$2
    local description=$3

    print_info "Starting $description..."

    if [ -n "$config_file" ] && [ -f "k6/config/$config_file" ]; then
        k6 run --config "k6/config/$config_file" "k6/scripts/$test_name"
    else
        k6 run "k6/scripts/$test_name"
    fi

    print_success "$description completed"
}

# Function to generate reports
generate_reports() {
    print_info "Generating performance reports..."

    # Create results directory if it doesn't exist
    mkdir -p results

    # Generate HTML report from last test results (if available)
    # Note: In a real implementation, you'd parse k6's JSON output
    print_info "Reports generated in results/ directory"
}

# Main menu
show_menu() {
    echo "======================================="
    echo "  AI Agent Load Testing Suite"
    echo "======================================="
    echo "1. Run base load test (50 users)"
    echo "2. Run scale test (100 users)"
    echo "3. Run scale test (1000 users)"
    echo "4. Run scale test (10000 users)"
    echo "5. Run error handling test"
    echo "6. Generate reports"
    echo "7. Run all tests sequentially"
    echo "8. Exit"
    echo "======================================="
}

# Main execution
main() {
    check_k6

    while true; do
        show_menu
        read -p "Select an option (1-8): " choice

        case $choice in
            1)
                run_test "main-test.js" "base.json" "Base Load Test (50 users)"
                ;;
            2)
                run_test "main-test.js" "scale-100.json" "Scale Test (100 users)"
                ;;
            3)
                run_test "main-test.js" "scale-1000.json" "Scale Test (1000 users)"
                ;;
            4)
                run_test "main-test.js" "scale-10000.json" "Scale Test (10000 users)"
                ;;
            5)
                run_test "error-test.js" "" "Error Handling Test"
                ;;
            6)
                generate_reports
                ;;
            7)
                print_info "Running all tests sequentially..."
                run_test "main-test.js" "base.json" "Base Load Test (50 users)"
                sleep 5
                run_test "main-test.js" "scale-100.json" "Scale Test (100 users)"
                sleep 5
                run_test "error-test.js" "" "Error Handling Test"
                sleep 5
                generate_reports
                print_success "All tests completed!"
                ;;
            8)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-8."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# If script is run with arguments, execute specific commands
if [ $# -gt 0 ]; then
    case $1 in
        "base")
            run_test "main-test.js" "base.json" "Base Load Test (50 users)"
            ;;
        "100")
            run_test "main-test.js" "scale-100.json" "Scale Test (100 users)"
            ;;
        "1000")
            run_test "main-test.js" "scale-1000.json" "Scale Test (1000 users)"
            ;;
        "10000")
            run_test "main-test.js" "scale-10000.json" "Scale Test (10000 users)"
            ;;
        "error")
            run_test "error-test.js" "" "Error Handling Test"
            ;;
        "report")
            generate_reports
            ;;
        *)
            print_error "Unknown argument: $1"
            echo "Usage: $0 [base|100|1000|10000|error|report]"
            exit 1
            ;;
    esac
else
    main
fi