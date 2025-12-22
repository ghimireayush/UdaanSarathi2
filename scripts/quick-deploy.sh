#!/bin/bash

################################################################################
# Quick Deploy Script - Minimal build and deploy
# 
# Usage:
#   ./scripts/quick-deploy.sh [environment]
#
# This script skips validations for faster deployment during development
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-dev}"
SITE_ID="${NETLIFY_SITE_ID}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }

[[ -z "$NETLIFY_AUTH_TOKEN" ]] && error "NETLIFY_AUTH_TOKEN not set"
[[ -z "$SITE_ID" ]] && error "NETLIFY_SITE_ID not set"

log "Quick deploy to $ENVIRONMENT..."

# Set API URL
case "$ENVIRONMENT" in
  dev) export VITE_API_BASE_URL="https://dev.kaha.com.np/job-portal" ;;
  prod) export VITE_API_BASE_URL="https://kaha.com.np/job-portal" ;;
  *) error "Invalid environment: $ENVIRONMENT" ;;
esac

cd "$PROJECT_ROOT"

log "Building..."
npm run build > /dev/null 2>&1 || error "Build failed"
success "Build complete"

log "Deploying..."
netlify deploy \
  --site "$SITE_ID" \
  --auth "$NETLIFY_AUTH_TOKEN" \
  --dir dist \
  --prod > /dev/null 2>&1 || error "Deploy failed"

success "Deployed to $ENVIRONMENT!"
