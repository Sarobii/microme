# Contributing to MicroMe 🤝

We welcome contributions to MicroMe! This guide will help you get started with contributing to our AI-powered social media analytics platform.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Contribute](#how-to-contribute)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)
9. [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

### Our Pledge
- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome contributors from all backgrounds
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Professional**: Maintain professional communication

### Unacceptable Behavior
- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that violates applicable laws

## How to Contribute

### 🐛 Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template**
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots or videos

### 🚀 Suggesting Features

1. **Check the roadmap** and existing feature requests
2. **Use the feature request template**
3. **Explain the use case** and potential impact
4. **Consider implementation complexity**

### 📝 Documentation

- Fix typos or unclear instructions
- Add examples or use cases
- Improve API documentation
- Translate content (future)

### 💻 Code Contributions

- Bug fixes
- Feature implementations
- Performance improvements
- Test coverage improvements
- Refactoring and code cleanup

## Development Setup

### Prerequisites

```bash
# Required software
node --version    # 18+
pnpm --version    # latest
git --version     # 2.0+
npx supabase --version  # latest
```

### Fork and Clone

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/microme.git
cd microme

# 3. Add upstream remote
git remote add upstream https://github.com/Sarobii/microme.git

# 4. Install dependencies
pnpm install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure your Supabase credentials
# See SETUP.md for detailed instructions
```

### Development Workflow

```bash
# Start development server
pnpm dev

# In another terminal, start Supabase (if working on backend)
npx supabase start

# Run tests
pnpm test

# Check code quality
pnpm lint
```

## Project Structure

### Frontend Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives (buttons, inputs)
│   └── common/         # Complex reusable components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── lib/                # Configuration and setup
```

### Backend Architecture

```
supabase/
├── functions/          # Edge functions (serverless API)
│   ├── pipeline-orchestrator/
│   ├── ingestion-agent/
│   ├── persona-analyst/
│   ├── strategy-planner/
│   ├── ethics-guard/
│   └── simulation-agent/
├── migrations/         # Database schema changes
└── tables/             # Table definitions
```

### Component Guidelines

#### React Components

```typescript
// Component template
import React from 'react';
import { cn } from '@/utils/cn';

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  // ... other props
}

export const Component: React.FC<ComponentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('default-classes', className)} {...props}>
      {children}
    </div>
  );
};

Component.displayName = 'Component';
```

#### Edge Functions

```typescript
// Function template
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Your function logic here
    const result = { success: true, data: 'response' };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types
interface User {
  id: string;
  email: string;
  name: string | null;
}

// Prefer const assertions
const CONFIG = {
  API_URL: 'https://api.example.com',
  TIMEOUT: 5000
} as const;

// Use generic constraints
function processData<T extends { id: string }>(items: T[]): T[] {
  return items.filter(item => item.id.length > 0);
}
```

### React Best Practices

```typescript
// Use custom hooks for logic
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
};

// Prefer composition over inheritance
const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { user } = useAuth();
    if (!user) return <LoginRequired />;
    return <Component {...props} />;
  };
};
```

### CSS/Styling Guidelines

```typescript
// Use TailwindCSS utility classes
const Button = ({ variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  
  return (
    <button 
      className={cn(baseClasses, variantClasses[variant])} 
      {...props} 
    />
  );
};
```

### Database Guidelines

```sql
-- Use descriptive table and column names
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create appropriate policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
```

## Testing Guidelines

### Unit Tests

```typescript
// Component tests
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant styles', () => {
    render(<Button variant="secondary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
  });
});
```

### Integration Tests

```typescript
// API tests
import { supabase } from '@/lib/supabase';

describe('User API', () => {
  it('creates user profile', async () => {
    const userData = { full_name: 'Test User', email: 'test@example.com' };
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(userData)
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data.full_name).toBe('Test User');
  });
});
```

### E2E Tests

```typescript
// Playwright tests
import { test, expect } from '@playwright/test';

test('user can upload CSV and view results', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Upload file
  await page.setInputFiles('[data-testid="csv-upload"]', 'test-data.csv');
  await page.click('[data-testid="upload-button"]');
  
  // Wait for processing
  await page.waitForText('Processing complete');
  
  // Verify results
  await expect(page.locator('[data-testid="persona-results"]')).toBeVisible();
});
```

## Pull Request Process

### Before Submitting

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our guidelines

3. **Test your changes**:
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

4. **Commit with conventional commits**:
   ```bash
   git commit -m "feat: add user profile management"
   git commit -m "fix: resolve authentication redirect issue"
   git commit -m "docs: update API documentation"
   ```

### PR Template

Use this template for your PR description:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested in multiple browsers/devices (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by maintainers
3. **Manual testing** for significant changes
4. **Approval** from at least one maintainer
5. **Merge** using squash and merge

## Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 96.0]
- Node.js: [e.g. 18.0.0]
- Version: [e.g. 1.0.0]

## Additional Context
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Summary
Brief description of the feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How would you like this to be implemented?

## Alternatives Considered
What other approaches have you considered?

## Additional Context
Any other context or screenshots.
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time community chat (coming soon)

### Recognition

We recognize contributors through:
- **Contributors section** in README
- **Release notes** mention
- **Social media** shoutouts
- **Swag** for significant contributions (future)

### Becoming a Maintainer

Interested in becoming a maintainer? We look for:
- **Consistent contributions** over time
- **Code quality** and adherence to guidelines
- **Community involvement** and helping others
- **Technical expertise** in relevant areas

Reach out if you're interested!

## Development Tips

### Local Development

```bash
# Quick start for contributors
git clone https://github.com/YOUR_USERNAME/microme.git
cd microme
pnpm install
cp .env.example .env
# Configure .env with your Supabase credentials
pnpm dev
```

### Useful Commands

```bash
# Database
npx supabase start                 # Start local Supabase
npx supabase db reset              # Reset database
npx supabase migration new name    # Create migration

# Functions
npx supabase functions new name    # Create function
npx supabase functions serve       # Test locally
npx supabase functions deploy      # Deploy functions

# Frontend
pnpm dev                          # Development server
pnpm build                        # Production build
pnpm preview                      # Preview build
pnpm lint                         # Check code quality
pnpm test                         # Run tests
```

### IDE Setup

**VS Code Extensions**:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright"
  ]
}
```

**Settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Thank You! 🙏

Every contribution, no matter how small, helps make MicroMe better. We appreciate your time and effort in improving the project!

Happy coding! 🚀

**Questions?** Feel free to ask in [GitHub Discussions](https://github.com/Sarobii/microme/discussions) or open an issue.

---

**Last Updated**: 2025-01-15