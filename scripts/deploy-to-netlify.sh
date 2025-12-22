#!/bin/bash

################################################################################
# Netlify Auto-Deploy Script for UdaanSarathi Admin Panel
# 
# Usage:
#   ./scripts/deploy-to-netlify.sh [environment] [site-id]
#
# Arguments:
#   environment  - 'dev' or 'prod' (default: dev)
#   site-id      - Netlify site ID (optional, uses NETLIFY_SITE_ID env var)
#
# Environment Variables:
#   NETLIFY_AUTH_TOKEN  - Required for authentication
#   NETLIFY_SITE_ID     - Site ID (can be passed as argument)
#   VITE_API_BASE_URL   - API base URL (auto-set based on environment)
#
# Examples:
#   ./scripts/deploy-to-netlify.sh dev
#   ./scripts/deploy-to-netlify.sh prod my-site-id
#   NETLIFY_AUTH_TOKEN=xxx ./scripts/deploy-to-netlify.sh dev
#
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-dev}"
SITE_ID="${2:-${NETLIFY_SITE_ID}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/dist"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$PROJECT_ROOT/logs/deploy_${TIMESTAMP}.log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
  exit 1
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Validate environment
validate_environment() {
  log "Validating deployment environment..."
  
  # Check if environment is valid
  if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'dev' or 'prod'"
  fi
  
  # Check for Netlify CLI
  if ! command -v netlify &> /dev/null; then
    error "Netlify CLI not found. Install it with: npm install -g netlify-cli"
  fi
  
  # Check for auth token
  if [[ -z "$NETLIFY_AUTH_TOKEN" ]]; then
    error "NETLIFY_AUTH_TOKEN environment variable not set. Set it with: export NETLIFY_AUTH_TOKEN=your_token"
  fi
  
  # Check for site ID
  if [[ -z "$SITE_ID" ]]; then
    error "Site ID not provided. Pass as argument or set NETLIFY_SITE_ID environment variable"
  fi
  
  log "Environment validation passed ✓"
}

# Set API base URL based on environment
set_api_url() {
  case "$ENVIRONMENT" in
    dev)
      export VITE_API_BASE_URL="https://dev.kaha.com.np/job-portal"
      log "API URL set to: $VITE_API_BASE_URL (dev)"
      ;;
    prod)
      export VITE_API_BASE_URL="https://kaha.com.np/job-portal"
      log "API URL set to: $VITE_API_BASE_URL (prod)"
      ;;
  esac
}

# Clean previous build
clean_build() {
  log "Cleaning previous build..."
  if [[ -d "$BUILD_DIR" ]]; then
    rm -rf "$BUILD_DIR"
    log "Build directory cleaned ✓"
  fi
}

# Install dependencies
install_deps() {
  log "Installing dependencies..."
  cd "$PROJECT_ROOT"
  npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
  log "Dependencies installed ✓"
}

# Run validations
run_validations() {
  log "Running pre-build validations..."
  
  cd "$PROJECT_ROOT"
  
  # Validate MVP
  if [[ -f "validate-mvp.js" ]]; then
    log "Running MVP validation..."
    node validate-mvp.js 2>&1 | tee -a "$LOG_FILE" || warning "MVP validation had warnings"
  fi
  
  # Validate translations
  if [[ -f "src/utils/validateTranslations.js" ]]; then
    log "Running translation validation..."
    npm run validate-translations 2>&1 | tee -a "$LOG_FILE" || warning "Translation validation had warnings"
  fi
  
  log "Validations completed ✓"
}

# Build the project
build_project() {
  log "Building project for $ENVIRONMENT environment..."
  cd "$PROJECT_ROOT"
  
  npm run build 2>&1 | tee -a "$LOG_FILE"
  
  if [[ ! -d "$BUILD_DIR" ]]; then
    error "Build failed: dist directory not created"
  fi
  
  log "Build completed successfully ✓"
}

# Verify build output
verify_build() {
  log "Verifying build output..."
  
  if [[ ! -f "$BUILD_DIR/index.html" ]]; then
    error "Build verification failed: index.html not found in dist"
  fi
  
  local file_count=$(find "$BUILD_DIR" -type f | wc -l)
  log "Build contains $file_count files ✓"
}

# Deploy to Netlify
deploy_to_netlify() {
  log "Deploying to Netlify (Site ID: $SITE_ID)..."
  
  cd "$PROJECT_ROOT"
  
  # Deploy with Netlify CLI
  netlify deploy \
    --site "$SITE_ID" \
    --auth "$NETLIFY_AUTH_TOKEN" \
    --dir "$BUILD_DIR" \
    --prod \
    2>&1 | tee -a "$LOG_FILE"
  
  if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
    log "Deployment to Netlify completed ✓"
  else
    error "Netlify deployment failed"
  fi
}

# Get deployment info
get_deployment_info() {
  log "Retrieving deployment information..."
  
  netlify sites:list --auth "$NETLIFY_AUTH_TOKEN" 2>&1 | grep -A 5 "$SITE_ID" | tee -a "$LOG_FILE" || true
}

# Main execution
main() {
  log "=========================================="
  log "UdaanSarathi Admin Panel - Netlify Deploy"
  log "=========================================="
  log "Environment: $ENVIRONMENT"
  log "Site ID: $SITE_ID"
  log "Timestamp: $TIMESTAMP"
  log "Log file: $LOG_FILE"
  log ""
  
  validate_environment
  set_api_url
  clean_build
  install_deps
  run_validations
  build_project
  verify_build
  deploy_to_netlify
  get_deployment_info
  
  log ""
  success "Deployment completed successfully!"
  log "=========================================="
}

# Run main function
main "$@"
