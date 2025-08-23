# MicroMe Setup Guide 🛠️

This comprehensive guide will walk you through setting up MicroMe from development to production deployment.

## 📝 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Edge Functions Deployment](#edge-functions-deployment)
7. [Frontend Development](#frontend-development)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - Fast, disk space efficient package manager
- **Git** - Version control system
- **Supabase CLI** - For database and function management

### Installation Commands

```bash
# Install Node.js (if not already installed)
# Visit https://nodejs.org/ and download the LTS version

# Install pnpm globally
npm install -g pnpm

# Install Supabase CLI
npm install -g supabase

# Verify installations
node --version    # Should be 18+
pnpm --version    # Should be latest
supabase --version # Should be latest
```

## Local Development Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/Sarobii/microme.git
cd microme

# Verify project structure
ls -la
```

### 2. Install Dependencies

```bash
# Install all project dependencies
pnpm install

# This will install:
# - React and related packages
# - TypeScript and build tools
# - TailwindCSS and UI components
# - Supabase client library
```

## Supabase Configuration

### 1. Create Supabase Project

1. Visit [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `microme` (or your preferred name)
   - **Database Password**: Generate a secure password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

### 2. Get Project Credentials

Once your project is ready:

1. Go to **Settings → API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon (public) key**: `eyJ...` (starts with eyJ)
   - **Service role key**: `eyJ...` (different from anon key)

### 3. Configure Authentication

1. Go to **Authentication → Settings**
2. Configure **Site URL** for production:
   ```
   https://your-domain.com
   ```
3. Add **Redirect URLs** for development:
   ```
   http://localhost:5173/auth/callback
   ```
4. Enable **Email** provider (enabled by default)

## Environment Variables

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### 2. Configure Variables

Edit `.env` file with your Supabase credentials:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Service Role Key (Required for edge functions)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
VITE_APP_TITLE=MicroMe
VITE_APP_DESCRIPTION=AI-Powered Social Media Analytics Platform

# Development Environment
VITE_ENV=development
```

### 3. Validate Configuration

```bash
# Test Supabase connection
npx supabase projects list

# Should show your project if correctly configured
```

## Database Setup

### 1. Link Project to Supabase CLI

```bash
# Initialize Supabase in your project
npx supabase init

# Link to your remote project
npx supabase link --project-ref your-project-id

# Enter your database password when prompted
```

### 2. Apply Database Migrations

```bash
# Apply all migrations to create tables
npx supabase db push

# Alternatively, apply migrations one by one
npx supabase migration up
```

### 3. Verify Database Schema

Tables that should be created:
- `profiles` - User profile information
- `data_ingestions` - CSV upload tracking
- `persona_analysis` - AI-generated persona data
- `content_strategies` - Content recommendations
- `simulations` - Content performance simulations
- `transparency_cards` - AI transparency information
- `linkedin_posts` - Processed social media posts

### 4. Set up Row Level Security (RLS)

RLS policies are automatically applied through migrations to ensure:
- Users can only access their own data
- Proper authentication is enforced
- Data privacy is maintained

## Edge Functions Deployment

### 1. Deploy All Functions

```bash
# Deploy all edge functions at once
npx supabase functions deploy

# Or deploy individual functions
npx supabase functions deploy pipeline-orchestrator
npx supabase functions deploy ingestion-agent
npx supabase functions deploy persona-analyst
npx supabase functions deploy strategy-planner
npx supabase functions deploy ethics-guard
npx supabase functions deploy simulation-agent
npx supabase functions deploy create-admin-user
```

### 2. Set Function Environment Variables

```bash
# Set service role key for all functions
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Verify secrets are set
npx supabase secrets list
```

### 3. Test Functions

```bash
# Test a function locally (optional)
npx supabase functions serve

# In another terminal, test the function
curl -X POST 'http://localhost:54321/functions/v1/pipeline-orchestrator' \
  -H 'Authorization: Bearer your_anon_key' \
  -H 'Content-Type: application/json' \
  -d '{"test": true}'
```

## Frontend Development

### 1. Start Development Server

```bash
# Start the development server
pnpm dev

# Server will start at http://localhost:5173
# Hot reload is enabled for fast development
```

### 2. Development Workflow

```bash
# Run linting
pnpm lint

# Build for production (to test)
pnpm build

# Preview production build
pnpm preview
```

### 3. Project Structure Understanding

- **`src/components/`** - Reusable UI components
- **`src/pages/`** - Main application pages
- **`src/hooks/`** - Custom React hooks
- **`src/contexts/`** - React context providers
- **`src/lib/`** - Configuration and utilities
- **`src/utils/`** - Helper functions

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   # Login to Vercel
   vercel login
   
   # Deploy from project root
   vercel
   
   # Follow prompts to configure project
   ```

3. **Configure Environment Variables**:
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add all variables from your `.env` file
   - Make sure to use `VITE_` prefix for client-side variables

4. **Update Supabase Redirect URLs**:
   - Add your Vercel URL to Supabase Auth settings
   - Format: `https://your-app.vercel.app/auth/callback`

### Option 2: Netlify

1. **Build the project**:
   ```bash
   pnpm build
   ```

2. **Deploy via Netlify CLI**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login and deploy
   netlify login
   netlify deploy --prod --dir=dist
   ```

3. **Configure Environment Variables**:
   - Go to Netlify dashboard → Site Settings → Environment Variables
   - Add your Supabase credentials

### Option 3: Self-Hosted with Docker

1. **Create Dockerfile** (if not present):
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "run", "preview"]
   ```

2. **Build and run**:
   ```bash
   # Build Docker image
   docker build -t microme .
   
   # Run container
   docker run -p 3000:3000 --env-file .env microme
   ```

## Post-Deployment Checklist

### ✅ Verification Steps

1. **Authentication**:
   - [ ] Can create new account
   - [ ] Can login with existing account
   - [ ] Proper redirect after auth

2. **Data Upload**:
   - [ ] CSV file upload works
   - [ ] File validation is working
   - [ ] Error handling for invalid files

3. **AI Pipeline**:
   - [ ] Pipeline starts after upload
   - [ ] Progress updates in real-time
   - [ ] All stages complete successfully

4. **Results Display**:
   - [ ] Persona analysis loads
   - [ ] Content strategy generates
   - [ ] Simulation results appear
   - [ ] Transparency cards work

5. **Performance**:
   - [ ] Page load times < 3 seconds
   - [ ] No console errors
   - [ ] Responsive design works

## Troubleshooting

### Common Issues

#### 1. **"Cannot connect to Supabase"**
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify Supabase project is running
npx supabase projects list
```

#### 2. **"Edge function deployment failed"**
```bash
# Check Supabase CLI authentication
npx supabase login

# Verify project link
npx supabase status

# Re-deploy specific function
npx supabase functions deploy function-name --debug
```

#### 3. **"Build errors in production"**
```bash
# Clear cache and rebuild
rm -rf node_modules .vite dist
pnpm install
pnpm build

# Check for TypeScript errors
npx tsc --noEmit
```

#### 4. **"Authentication redirect not working"**
- Verify redirect URLs in Supabase Auth settings
- Check that URLs match exactly (including protocol)
- Ensure environment variables are set correctly

### Performance Optimization

1. **Bundle Size**:
   ```bash
   # Analyze bundle size
   npx vite-bundle-analyzer
   ```

2. **Database Queries**:
   - Monitor slow queries in Supabase dashboard
   - Add indexes for frequently queried fields
   - Use proper RLS policies

3. **Edge Functions**:
   - Monitor function execution time
   - Optimize cold start performance
   - Use appropriate memory allocation

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Search [GitHub Issues](https://github.com/Sarobii/microme/issues)
3. Create a new issue with:
   - Environment details (Node version, OS, etc.)
   - Steps to reproduce
   - Error messages and logs
   - Screenshots if applicable

## Next Steps

Once setup is complete:

1. **Explore the Application**:
   - Upload sample LinkedIn posts CSV
   - Run through the complete pipeline
   - Review generated insights

2. **Customize for Your Needs**:
   - Modify persona analysis parameters
   - Adjust content strategy algorithms
   - Add custom transparency cards

3. **Scale and Optimize**:
   - Monitor performance metrics
   - Implement additional features
   - Optimize for your specific use case

---

**🎉 Congratulations!** You now have MicroMe running successfully. Start exploring the power of AI-driven social media analytics!

For additional help, see our [Documentation](docs/) or reach out through [GitHub Issues](https://github.com/Sarobii/microme/issues).