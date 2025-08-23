# Troubleshooting Guide 🔧

This guide helps you diagnose and resolve common issues with MicroMe.

## 📋 Quick Issue Index

- [Installation Issues](#installation-issues)
- [Authentication Problems](#authentication-problems)
- [Database Connection Issues](#database-connection-issues)
- [Edge Function Errors](#edge-function-errors)
- [Frontend Build Issues](#frontend-build-issues)
- [Pipeline Processing Problems](#pipeline-processing-problems)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)

---

## Installation Issues

### ❓ "Command not found: pnpm"

**Problem**: Package manager not installed

**Solution**:
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

**Alternative**: Use npm instead
```bash
# Replace pnpm commands with npm
npm install
npm run dev
```

### ❓ "Node version incompatible"

**Problem**: Node.js version is too old

**Solution**:
```bash
# Check current version
node --version

# Install Node.js 18+ from https://nodejs.org/
# Or use nvm to manage versions
nvm install 18
nvm use 18
```

### ❓ "Dependency conflicts during install"

**Problem**: Package version conflicts

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install --force

# Or use legacy peer deps
pnpm install --legacy-peer-deps
```

---

## Authentication Problems

### ❓ "Invalid JWT token" / "Authentication failed"

**Symptoms**:
- Login attempts fail silently
- API requests return 401 errors
- User session doesn't persist

**Diagnosis**:
```javascript
// Check current session
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Error:', error)

// Check token validity
if (session?.access_token) {
  const payload = JSON.parse(atob(session.access_token.split('.')[1]))
  console.log('Token expires:', new Date(payload.exp * 1000))
}
```

**Solutions**:

1. **Check Environment Variables**:
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Verify Supabase Project Settings**:
   - Go to Supabase Dashboard → Authentication → Settings
   - Ensure Site URL matches your domain
   - Check redirect URLs are correct

3. **Clear Auth State**:
   ```javascript
   await supabase.auth.signOut()
   localStorage.clear()
   sessionStorage.clear()
   ```

### ❓ "Redirect loop after login"

**Problem**: Authentication callback not configured properly

**Solution**:
1. Check `AuthCallback.tsx` component
2. Verify redirect URLs in Supabase:
   ```
   Development: http://localhost:5173/auth/callback
   Production: https://yourdomain.com/auth/callback
   ```

3. Update environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

---

## Database Connection Issues

### ❓ "Failed to connect to database"

**Symptoms**:
- Database queries timeout
- "Connection refused" errors
- Data not loading in UI

**Diagnosis**:
```bash
# Test Supabase connection
npx supabase projects list

# Check project status
npx supabase status

# Test database connection
psql "postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

**Solutions**:

1. **Verify Project Credentials**:
   - Project URL format: `https://project-id.supabase.co`
   - Anon key starts with `eyJ`
   - Service role key is different from anon key

2. **Check RLS Policies**:
   ```sql
   -- Verify RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   
   -- Check policies exist
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Network Issues**:
   ```bash
   # Test connectivity
   curl -I https://your-project.supabase.co
   
   # Check firewall/proxy settings
   ```

### ❓ "Row Level Security policy violation"

**Problem**: User can't access their own data

**Solution**:
1. **Check User ID in Database**:
   ```sql
   SELECT auth.uid(); -- Should return current user ID
   ```

2. **Verify RLS Policies**:
   ```sql
   -- Example policy check for profiles table
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Debug Policy Logic**:
   ```sql
   -- Test policy manually
   SELECT * FROM profiles WHERE user_id = auth.uid();
   ```

---

## Edge Function Errors

### ❓ "Function deployment failed"

**Symptoms**:
- `supabase functions deploy` returns errors
- Functions not appearing in dashboard
- Deployment timeouts

**Diagnosis**:
```bash
# Check Supabase CLI authentication
npx supabase login

# Verify project link
npx supabase projects list
npx supabase status

# Deploy with debug info
npx supabase functions deploy function-name --debug
```

**Solutions**:

1. **Authentication Issues**:
   ```bash
   # Re-authenticate
   npx supabase logout
   npx supabase login
   
   # Re-link project
   npx supabase link --project-ref your-project-id
   ```

2. **Function Code Issues**:
   ```bash
   # Check for TypeScript errors
   cd supabase/functions/function-name
   deno check index.ts
   
   # Test function locally
   npx supabase functions serve
   ```

3. **Network/Permissions**:
   - Check if you have deploy permissions on the project
   - Verify internet connection
   - Try deploying from different network

### ❓ "Function execution timeout"

**Problem**: Edge functions exceed execution time limit

**Solution**:
1. **Optimize Function Code**:
   ```typescript
   // Use Promise.race for timeouts
   const result = await Promise.race([
     longRunningOperation(),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Timeout')), 25000)
     )
   ]);
   ```

2. **Break Down Complex Operations**:
   - Split large operations into smaller chunks
   - Use database for intermediate results
   - Implement resume capability

### ❓ "Environment variables not accessible"

**Problem**: Functions can't access secrets

**Solution**:
```bash
# Set secrets for functions
npx supabase secrets set SECRET_NAME=secret_value

# List all secrets
npx supabase secrets list

# Access in function code
const secret = Deno.env.get('SECRET_NAME')
```

---

## Frontend Build Issues

### ❓ "TypeScript compilation errors"

**Symptoms**:
- Build fails with TS errors
- Type checking failures
- Missing type definitions

**Diagnosis**:
```bash
# Run type check only
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/components/Component.tsx
```

**Solutions**:

1. **Missing Type Definitions**:
   ```bash
   # Install missing types
   pnpm add -D @types/node @types/react @types/react-dom
   ```

2. **Configuration Issues**:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true,
       "moduleResolution": "node"
     }
   }
   ```

### ❓ "Vite build fails"

**Problem**: Build process errors or hangs

**Solution**:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild with verbose logging
pnpm build --debug

# Check for circular dependencies
npm ls --depth=0
```

### ❓ "Module not found errors"

**Problem**: Import statements fail

**Solution**:
1. **Check file paths**:
   ```typescript
   // Use relative paths correctly
   import { Component } from './Component'
   import { utils } from '../utils/helpers'
   ```

2. **Configure path mapping**:
   ```json
   // vite.config.ts
   export default defineConfig({
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src')
       }
     }
   })
   ```

---

## Pipeline Processing Problems

### ❓ "CSV upload fails"

**Symptoms**:
- File upload doesn't complete
- "Invalid file format" errors
- Processing stuck at ingestion stage

**Diagnosis**:
```bash
# Check file format
head -n 5 your_file.csv

# Verify encoding
file your_file.csv
```

**Solutions**:

1. **File Format Issues**:
   - Ensure CSV has proper headers: `content,engagement,date,hashtags`
   - Use UTF-8 encoding
   - Remove special characters
   - Check for proper escaping of quotes

2. **File Size Limits**:
   ```javascript
   // Check file size before upload
   if (file.size > 10 * 1024 * 1024) { // 10MB limit
     throw new Error('File too large');
   }
   ```

### ❓ "Pipeline stuck in processing"

**Problem**: Pipeline doesn't complete or progress stops

**Diagnosis**:
```javascript
// Check pipeline status in database
const { data } = await supabase
  .from('data_ingestions')
  .select('*')
  .eq('id', ingestionId)
  .single();

console.log('Pipeline status:', data.status);
```

**Solutions**:

1. **Restart Pipeline**:
   ```javascript
   const response = await fetch('/functions/v1/pipeline-orchestrator', {
     method: 'POST',
     body: JSON.stringify({
       ingestionId,
       userId: user.id,
       action: 'restart'
     })
   });
   ```

2. **Check Function Logs**:
   ```bash
   # View function logs in Supabase dashboard
   # Or use CLI
   npx supabase functions logs
   ```

### ❓ "AI analysis produces poor results"

**Problem**: Persona or strategy analysis seems inaccurate

**Solutions**:

1. **Improve Data Quality**:
   - Ensure sufficient data volume (50+ posts recommended)
   - Include diverse content types
   - Verify engagement metrics are accurate

2. **Adjust Analysis Parameters**:
   ```javascript
   // Request deeper analysis
   const response = await fetch('/functions/v1/persona-analyst', {
     method: 'POST',
     body: JSON.stringify({
       ingestionId,
       userId: user.id,
       analysisDepth: 'comprehensive' // instead of 'basic'
     })
   });
   ```

---

## Performance Issues

### ❓ "Application loads slowly"

**Symptoms**:
- Initial page load > 5 seconds
- Component rendering delays
- API requests timeout

**Diagnosis**:
```bash
# Check bundle size
npx vite build
ls -lh dist/assets/

# Run Lighthouse audit
npx lighthouse https://your-app.com
```

**Solutions**:

1. **Bundle Optimization**:
   ```javascript
   // Lazy load components
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   
   // Code splitting
   const LazyComponent = lazy(() => 
     import('./Component').then(module => ({ default: module.Component }))
   );
   ```

2. **Image Optimization**:
   ```javascript
   // Use appropriate image formats and sizes
   <img 
     src="image.webp" 
     alt="Description"
     loading="lazy"
     width="300"
     height="200"
   />
   ```

### ❓ "Database queries are slow"

**Problem**: Data fetching takes too long

**Solutions**:

1. **Add Database Indexes**:
   ```sql
   -- Add index for frequently queried columns
   CREATE INDEX idx_posts_user_date ON linkedin_posts(user_id, created_at);
   CREATE INDEX idx_persona_user ON persona_analysis(user_id);
   ```

2. **Optimize Queries**:
   ```javascript
   // Use selective queries
   const { data } = await supabase
     .from('linkedin_posts')
     .select('id, content, engagement')
     .eq('user_id', userId)
     .order('created_at', { ascending: false })
     .limit(50);
   ```

---

## Deployment Problems

### ❓ "Vercel deployment fails"

**Problem**: Build fails on Vercel but works locally

**Solutions**:

1. **Environment Variables**:
   - Ensure all required env vars are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Verify no extra spaces in values

2. **Build Configuration**:
   ```json
   // vercel.json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": "dist",
     "installCommand": "pnpm install"
   }
   ```

### ❓ "CORS errors in production"

**Problem**: API requests blocked by CORS policy

**Solution**:
1. **Update Supabase Auth Settings**:
   - Add production URL to allowed origins
   - Update redirect URLs

2. **Configure Edge Functions**:
   ```typescript
   // Add CORS headers to functions
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   
   return new Response(JSON.stringify(data), {
     headers: { ...corsHeaders, 'Content-Type': 'application/json' }
   });
   ```

---

## Getting Help

### 🔍 Diagnostic Information to Include

When reporting issues, include:

1. **Environment Details**:
   ```bash
   node --version
   pnpm --version
   npx supabase --version
   ```

2. **Error Messages**:
   - Full error stack traces
   - Console log outputs
   - Network request details

3. **Steps to Reproduce**:
   - Exact sequence of actions
   - Expected vs actual behavior
   - Screenshots or videos

4. **Configuration**:
   - Relevant config files
   - Environment variables (redact secrets)
   - Browser/OS information

### 📞 Support Channels

1. **GitHub Issues**: [Create Issue](https://github.com/Sarobii/microme/issues/new)
2. **Discussions**: [GitHub Discussions](https://github.com/Sarobii/microme/discussions)
3. **Documentation**: [Project Wiki](https://github.com/Sarobii/microme/wiki)

### 🚑 Emergency Issues

For critical production issues:
1. Check [Status Page](https://status.supabase.com) for service outages
2. Review recent deployments for breaking changes
3. Implement temporary workarounds while investigating
4. Document the issue and resolution for future reference

---

**👍 Remember**: Most issues have been encountered before. Search existing issues and discussions first, then provide detailed information when creating new reports.

**Last Updated**: 2025-01-15 📅