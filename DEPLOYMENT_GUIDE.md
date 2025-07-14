# Employee Check-in App - AWS Amplify Deployment Guide

## Prerequisites
- AWS Account
- GitHub repository with your code
- Node.js 18+ locally

## Step 1: Prepare Your Application

### 1.1 Update next.config.ts for production
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static optimization where possible
  output: 'standalone',
  
  // Optimize images
  images: {
    unoptimized: true, // Required for some deployment platforms
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 1.2 Create amplify.yml build configuration
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Step 2: Push to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit for AWS Amplify deployment"
```

2. Create GitHub repository and push:
```bash
git remote add origin https://github.com/yourusername/employee-checkin.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy with AWS Amplify

### 3.1 Access AWS Amplify Console
1. Go to AWS Console → Amplify
2. Click "Create App" → "Host web app"
3. Choose "GitHub" as source

### 3.2 Configure Repository
1. Authorize GitHub connection
2. Select your repository: `employee-checkin`
3. Select branch: `main`

### 3.3 Configure Build Settings
1. App name: `employee-checkin`
2. Environment: `production`
3. Build settings will auto-detect Next.js
4. Review and deploy

### 3.4 Environment Variables (if needed)
Add any environment variables in Amplify Console:
- Go to App Settings → Environment variables
- Add variables like API keys, database URLs, etc.

## Step 4: Configure Custom Domain (Optional)

1. In Amplify Console → Domain management
2. Add your custom domain
3. Amplify will handle SSL certificates automatically

## Step 5: Set up Continuous Deployment

Amplify automatically sets up:
- Auto-deploy on git push to main branch
- Preview deployments for pull requests
- Build logs and monitoring

## Cost Estimation

AWS Amplify pricing for small app:
- Build minutes: $0.01 per minute
- Data transfer: $0.15 per GB
- Storage: $0.023 per GB/month
- **Estimated monthly cost: $1-5 for small apps**

## Monitoring and Maintenance

1. **Build Logs**: Check in Amplify Console
2. **Performance**: Use AWS CloudWatch
3. **Errors**: Monitor via Amplify Console
4. **Updates**: Push to GitHub → Auto-deploy

## Troubleshooting Common Issues

1. **Build Failures**: Check Node.js version compatibility
2. **API Errors**: Verify environment variables
3. **CORS Issues**: Check next.config.ts headers
4. **Image Issues**: Set `unoptimized: true` in next.config.ts

## Alternative: Quick Vercel Deployment

If AWS Amplify seems complex, Vercel is easier:

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Follow prompts

Vercel automatically handles Next.js optimization and API routes.
