#!/bin/bash

# MicroMe Deployment Script
# Automates production deployment to various platforms

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_NAME="microme"
BUILD_DIR="dist"
SUPABASE_PROJECT_ID=""
DEPLOY_PLATFORM="vercel"  # vercel, netlify, or docker

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            DEPLOY_PLATFORM="$2"
            shift 2
            ;;
        --supabase-project)
            SUPABASE_PROJECT_ID="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --platform PLATFORM    Deployment platform (vercel|netlify|docker)"
            echo "  --supabase-project ID   Supabase project ID"
            echo "  --help                  Show this help message"
            exit 0
            ;;
        *)
            echo_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo_info "Starting MicroMe deployment..."
echo_info "Platform: $DEPLOY_PLATFORM"

# Pre-deployment checks
echo_info "Running pre-deployment checks..."

# Check required tools
command -v node >/dev/null 2>&1 || { echo_error "Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo_error "pnpm is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo_error "Git is required but not installed."; exit 1; }

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q '"name": "microme"' package.json; then
    echo_error "Please run this script from the MicroMe project root directory."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo_warning "You have uncommitted changes. Consider committing them before deployment."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Environment setup
echo_info "Setting up environment..."

if [ ! -f ".env" ]; then
    echo_warning "No .env file found. Creating from template..."
    cp .env.example .env
    echo_error "Please configure your .env file before continuing."
    exit 1
fi

# Install dependencies
echo_info "Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
echo_info "Running tests..."
if command -v npm run test >/dev/null 2>&1; then
    npm run test
fi

# Lint code
echo_info "Linting code..."
pnpm lint

# Build project
echo_info "Building project..."
pnpm build

if [ ! -d "$BUILD_DIR" ]; then
    echo_error "Build failed - $BUILD_DIR directory not found."
    exit 1
fi

echo_success "Build completed successfully."

# Deploy Supabase functions (if project ID provided)
if [ -n "$SUPABASE_PROJECT_ID" ]; then
    echo_info "Deploying Supabase functions..."
    
    # Check if Supabase CLI is available
    if command -v supabase >/dev/null 2>&1; then
        # Link to project
        npx supabase link --project-ref "$SUPABASE_PROJECT_ID"
        
        # Deploy functions
        npx supabase functions deploy
        
        # Apply migrations
        npx supabase db push
        
        echo_success "Supabase deployment completed."
    else
        echo_warning "Supabase CLI not found. Skipping backend deployment."
    fi
fi

# Platform-specific deployment
case $DEPLOY_PLATFORM in
    "vercel")
        echo_info "Deploying to Vercel..."
        
        if ! command -v vercel >/dev/null 2>&1; then
            echo_info "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        # Deploy
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo_success "Successfully deployed to Vercel!"
        else
            echo_error "Vercel deployment failed."
            exit 1
        fi
        ;;
    
    "netlify")
        echo_info "Deploying to Netlify..."
        
        if ! command -v netlify >/dev/null 2>&1; then
            echo_info "Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        
        # Deploy
        netlify deploy --prod --dir=$BUILD_DIR
        
        if [ $? -eq 0 ]; then
            echo_success "Successfully deployed to Netlify!"
        else
            echo_error "Netlify deployment failed."
            exit 1
        fi
        ;;
    
    "docker")
        echo_info "Building Docker image..."
        
        if ! command -v docker >/dev/null 2>&1; then
            echo_error "Docker is required but not installed."
            exit 1
        fi
        
        # Create Dockerfile if it doesn't exist
        if [ ! -f "Dockerfile" ]; then
            cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
            echo_info "Created Dockerfile for static hosting."
        fi
        
        # Build image
        docker build -t $PROJECT_NAME:latest .
        
        if [ $? -eq 0 ]; then
            echo_success "Docker image built successfully!"
            echo_info "To run the container:"
            echo "  docker run -p 80:80 $PROJECT_NAME:latest"
        else
            echo_error "Docker build failed."
            exit 1
        fi
        ;;
    
    *)
        echo_error "Unsupported deployment platform: $DEPLOY_PLATFORM"
        echo_info "Supported platforms: vercel, netlify, docker"
        exit 1
        ;;
esac

# Post-deployment tasks
echo_info "Running post-deployment tasks..."

# Verify deployment (basic check)
if [ "$DEPLOY_PLATFORM" != "docker" ]; then
    echo_info "Deployment completed! Please verify your application is working correctly."
    echo_info "Don't forget to:"
    echo "  - Update Supabase Auth redirect URLs if needed"
    echo "  - Test the complete user flow"
    echo "  - Monitor for any errors"
fi

# Cleanup
echo_info "Cleaning up..."
rm -rf node_modules/.cache 2>/dev/null || true

echo_success "Deployment process completed successfully! 🚀"
echo_info "Project: $PROJECT_NAME"
echo_info "Platform: $DEPLOY_PLATFORM"
echo_info "Build: $BUILD_DIR"
echo_info "Timestamp: $(date)"

# Generate deployment summary
cat > deployment-summary.md << EOF
# Deployment Summary

**Project**: $PROJECT_NAME  
**Platform**: $DEPLOY_PLATFORM  
**Date**: $(date)  
**Git Commit**: $(git rev-parse HEAD)  
**Branch**: $(git branch --show-current)  

## Deployment Details

- Build Directory: $BUILD_DIR
- Supabase Project: ${SUPABASE_PROJECT_ID:-"Not specified"}
- Node.js Version: $(node --version)
- pnpm Version: $(pnpm --version)

## Next Steps

1. Test the deployed application
2. Verify all features are working
3. Update documentation if needed
4. Monitor for any issues

---
*Generated by MicroMe deployment script*
EOF

echo_info "Deployment summary saved to deployment-summary.md"

exit 0