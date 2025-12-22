# Netlify Auto-Deploy Setup Guide

## Overview

This guide walks you through setting up automated deployment to Netlify for the UdaanSarathi Admin Panel. The setup uses Netlify CLI for manual deployments and GitHub Actions for CI/CD.

---

## Prerequisites

1. **Netlify Account** - Create one at https://netlify.com
2. **Netlify CLI** - Install globally:
   ```bash
   npm install -g netlify-cli
   ```
3. **Netlify Auth Token** - Generate from Netlify dashboard
4. **Site ID** - Get from your Netlify site settings

---

## Step 1: Get Your Netlify Credentials

### Get Site ID
1. Go to https://app.netlify.com
2. Select your site (or create a new one)
3. Go to **Site Settings** → **General**
4. Copy the **Site ID**

### Get Auth Token
1. Go to https://app.netlify.com/user/applications/personal
2. Click **New access token**
3. Name it (e.g., "UdaanSarathi Deploy")
4. Copy the token immediately (you won't see it again)

---

## Step 2: Configure Environment Variables

### Option A: Local Development (Manual Deploys)

```bash
# Set environment variables in your shell
export NETLIFY_AUTH_TOKEN="your_token_here"
export NETLIFY_SITE_ID="your_site_id_here"

# Verify they're set
echo $NETLIFY_AUTH_TOKEN
echo $NETLIFY_SITE_ID
```

To make these persistent, add to your shell profile (~/.zshrc or ~/.bash_profile):
```bash
export NETLIFY_AUTH_TOKEN="your_token_here"
export NETLIFY_SITE_ID="your_site_id_here"
```

### Option B: GitHub Actions (CI/CD)

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:
   - `NETLIFY_AUTH_TOKEN` = your token
   - `NETLIFY_SITE_ID` = your site ID

---

## Step 3: Manual Deployment

### Full Deploy (with validations)
```bash
cd portal/agency_research/admin_panel/UdaanSarathi2

# Deploy to dev environment
./scripts/deploy-to-netlify.sh dev

# Deploy to prod environment
./scripts/deploy-to-netlify.sh prod
```

### Quick Deploy (skip validations)
```bash
# Faster for development iterations
./scripts/quick-deploy.sh dev
```

### Make scripts executable
```bash
chmod +x scripts/deploy-to-netlify.sh
chmod +x scripts/quick-deploy.sh
```

---

## Environment-Specific URLs

The scripts automatically set the correct API base URL:

| Environment | API URL |
|-------------|---------|
| dev | https://dev.kaha.com.np/job-portal |
| prod | https://kaha.com.np/job-portal |

---

## Auto-Deploy Feasibility Analysis

### ✅ What Works Well
- **Netlify CLI** - Reliable, no git required
- **Environment variables** - Easy to manage secrets
- **Build process** - Vite builds are fast (~30-60s)
- **Multiple environments** - dev/prod URLs handled automatically
- **Logging** - Full deployment logs saved locally

### ⚠️ Considerations
- **No git-based deploys** - Uses CLI instead (as requested)
- **Manual trigger** - Requires running script or GitHub Actions
- **Token security** - Keep auth token safe, use GitHub Secrets for CI/CD
- **Build time** - Validations add ~1-2 minutes to full deploy

### 🚀 Recommended Workflow

**Development:**
```bash
./scripts/quick-deploy.sh dev  # Fast iterations
```

**Staging/Production:**
```bash
./scripts/deploy-to-netlify.sh prod  # Full validation
```

---

## Next Steps

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Get credentials from Netlify dashboard
3. Set environment variables
4. Test: `./scripts/quick-deploy.sh dev`
