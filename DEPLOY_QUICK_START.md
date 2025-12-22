# Netlify Deploy - Quick Start

## ✅ Status
**Deployment is working!** Your admin panel is live at: **https://uat-udaansarathi.netlify.app**

## One-Line Deploy

```bash
source ~/.zshrc && cd portal/agency_research/admin_panel/UdaanSarathi2 && ./scripts/deploy-to-netlify.sh dev
```

## Setup (One-Time)

Your credentials are already configured in `~/.zshrc`:
```bash
export NETLIFY_AUTH_TOKEN='nfp_AYa1EQafBWCSucc7XRyBWxzVFsveJYiiecb1'
export NETLIFY_SITE_ID="3160914a-84c7-40ac-8c30-08e2f0368c0c"
```

## Deploy Commands

### Dev Environment (with validations)
```bash
./scripts/deploy-to-netlify.sh dev
```

### Prod Environment (with validations)
```bash
./scripts/deploy-to-netlify.sh prod
```

### Quick Deploy (skip validations, faster)
```bash
./scripts/quick-deploy.sh dev
```

## What Gets Deployed

| Environment | API URL | Site URL |
|---|---|---|
| **dev** | https://dev.kaha.com.np/job-portal | https://uat-udaansarathi.netlify.app |
| **prod** | https://kaha.com.np/job-portal | https://uat-udaansarathi.netlify.app |

## Deployment Flow

1. **Validate** - MVP checks + translation validation
2. **Build** - Vite builds with environment-specific API URL
3. **Deploy** - Netlify CLI uploads to production
4. **Verify** - Confirms deployment is live

## Logs

All deployments are logged to `logs/deploy_*.log`

View latest deployment:
```bash
tail -f logs/deploy_*.log
```

## Troubleshooting

**"Netlify CLI not found"**
```bash
npm install -g netlify-cli
```

**"NETLIFY_AUTH_TOKEN not set"**
```bash
source ~/.zshrc
```

**Build fails**
```bash
npm install --legacy-peer-deps
npm run build
```

## Next Steps

- Monitor deployment at: https://app.netlify.com/projects/uat-udaansarathi
- Check build logs: https://app.netlify.com/projects/uat-udaansarathi/deploys
- Test the live site: https://uat-udaansarathi.netlify.app
