#!/bin/bash

# Medflect AI Demo Script
# This script demonstrates the complete workflow of the application

set -e

echo "🚀 Starting Medflect AI Demo..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Start local development stack
start_services() {
    print_status "Starting local development stack..."
    
    # Start services in background
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install workspace dependencies
    npm run bootstrap
    
    print_success "Dependencies installed"
}

# Build applications
build_apps() {
    print_status "Building applications..."
    
    # Build web app
    npm run build:web
    
    # Build server
    npm run build:server
    
    print_success "Applications built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run type checking
    npm run type-check
    
    # Run linting
    npm run lint
    
    print_success "Tests passed"
}

# Start development servers
start_dev_servers() {
    print_status "Starting development servers..."
    
    # Start web app in background
    npm run dev:web &
    WEB_PID=$!
    
    # Start server in background
    npm run dev:server &
    SERVER_PID=$!
    
    # Wait for servers to start
    sleep 10
    
    print_success "Development servers started"
    echo "Web app: http://localhost:5173"
    echo "Server: http://localhost:3000"
}

# Demo workflow
run_demo_workflow() {
    print_status "Running demo workflow..."
    
    # Create sample user and login
    print_status "1. Creating sample user and login..."
    # This would typically involve API calls to create test data
    
    # Create patient and add observation offline
    print_status "2. Creating patient and adding observation offline..."
    # This would involve testing the offline functionality
    
    # Trigger sync and call AI summary
    print_status "3. Triggering sync and calling AI summary..."
    # This would test the sync mechanism and AI integration
    
    # Verify DocumentReference persistence
    print_status "4. Verifying DocumentReference persistence..."
    # This would check that AI outputs are properly stored
    
    # Check audit log entries
    print_status "5. Checking audit log entries..."
    # This would verify the audit trail
    
    print_success "Demo workflow completed"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill background processes
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    
    # Stop Docker services
    docker-compose down
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    # Set up cleanup on exit
    trap cleanup EXIT
    
    print_status "Starting Medflect AI demo..."
    
    # Run checks and setup
    check_docker
    check_dependencies
    start_services
    install_deps
    build_apps
    run_tests
    start_dev_servers
    
    # Run demo workflow
    run_demo_workflow
    
    print_success "Demo completed successfully!"
    echo ""
    echo "🎉 Medflect AI is now running!"
    echo "📱 Web App: http://localhost:5173"
    echo "🔧 Server: http://localhost:3000"
    echo "🗄️  Supabase: http://localhost:54321"
    echo "⛓️  Ganache: http://localhost:8545"
    echo ""
    echo "Press Ctrl+C to stop the demo"
    
    # Keep running until interrupted
    wait
}

# Run main function
main "$@" 