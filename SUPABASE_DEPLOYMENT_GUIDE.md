# Supabase Setup and Deployment Guide

## 📋 Prerequisites
- Supabase account and project
- Node.js 18+
- pnpm package manager

## 🚀 Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 1.2 Run Database Setup
1. Go to your Supabase project's SQL Editor
2. Run the contents of `supabase-setup.sql`
3. This creates all necessary tables, RLS policies, and sample data

### 1.3 Deploy Edge Functions
```bash
# Install Supabase CLI
npm install supabase --save-dev

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
npx supabase functions deploy remix-api
```

## 🔧 Step 2: Environment Configuration

### Main App (.env.local)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (if using external APIs)
VITE_MUAPI_URL=https://api.muapi.ai
```

### Remix-Go App (apps/remix-go/.env.local)
```bash
# Supabase Configuration (same as main app)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🏗️ Step 3: Build and Deploy

### 3.1 Build the Application
```bash
# Install dependencies
pnpm install

# Build both main app and remix-go
pnpm run build:all

# This will:
# 1. Build remix-go app
# 2. Copy to public/apps/remix-go/
# 3. Build main app
```

### 3.2 Deploy Options

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

#### Option C: Manual Static Hosting
```bash
# Build the app
pnpm run build:all

# Upload the 'dist' folder to your hosting provider
# Make sure to set environment variables
```

## 📊 Step 4: Database Structure

### Tables Created:
- **templates**: Stores video templates with content, metadata
- **template_categories**: Organizes templates by category
- **projects**: User projects based on templates
- **media_assets**: Uploaded videos, images, audio files

### Row Level Security (RLS):
- Templates: Public read, authenticated users can create
- Projects: Users can only see/modify their own projects
- Media Assets: Users can only access their own files

### Sample Data:
The setup script includes sample template categories and templates to get you started.

## 🔗 Step 5: API Endpoints

### Supabase Edge Functions:
- `POST /functions/v1/remix-api` - Main API endpoint

### Available Endpoints:
- `GET /api/templates` - Get all public templates
- `GET /api/template-categories` - Get template categories
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project

## 🎯 Step 6: Testing

### Test Authentication:
1. Try logging in/registering
2. Check if user data loads correctly

### Test Templates:
1. Check if templates load on the Getting Started page
2. Try creating a project from a template

### Test Media Upload:
1. Try uploading a video/image
2. Check if it appears in media assets

### Test Projects:
1. Create a new project
2. Edit and save project
3. Check project list updates

## 🐛 Troubleshooting

### Common Issues:

1. **Authentication not working**
   - Check Supabase URL and anon key
   - Verify RLS policies are enabled

2. **Templates not loading**
   - Check if Edge Function is deployed
   - Verify database has sample data

3. **Upload failing**
   - Check Supabase Storage bucket exists
   - Verify Storage policies allow uploads

4. **Build failing**
   - Ensure all environment variables are set
   - Check for missing dependencies

### Debug Commands:
```bash
# Check Supabase connection
npx supabase status

# View function logs
npx supabase functions logs remix-api

# Test database connection
npx supabase db reset
```

## 📍 Template Storage Clarification

**Templates are now stored in Supabase, not static files:**

### Database Storage:
- **Table**: `templates`
- **Content**: JSON string with Popcorn.js video data
- **Metadata**: Title, description, thumbnail, category, tags
- **Access**: Public read, authenticated users can create

### File Structure:
```
supabase/
├── setup.sql              # Database schema and sample data
└── functions/
    └── remix-api/
        └── index.ts       # Edge Function API
```

### Migration from MongoDB:
- **Old**: `remix-api` with MongoDB "Make" collection
- **New**: Supabase `templates` table with PostgreSQL
- **Compatibility**: API responses maintain same structure

**Templates are now fully managed through Supabase with real database persistence, RLS security, and cloud storage for assets.**