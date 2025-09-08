# Netlify Deployment Guide for Astro Chat

## 🚀 Overview

This guide will help you deploy your Astro Chat application to Netlify with serverless functions, which should resolve the internal server errors you're experiencing with Vercel.

## 📁 Project Structure (Netlify Ready)

```
astro-chat/
├── netlify.toml                    # Netlify configuration
├── netlify/
│   └── functions/                  # Serverless functions
│       ├── package.json           # Function dependencies
│       ├── chat.js                # Chat API endpoint
│       ├── user-status.js         # User status API endpoint
│       └── health.js              # Health check endpoint
├── frontend/                      # React frontend
│   ├── build/                     # Built assets (generated)
│   ├── src/
│   └── package.json
└── database_setup.sql             # Supabase setup
```

## 🔧 Pre-deployment Setup

### 1. Environment Variables

You'll need these environment variables in Netlify (set in Netlify dashboard):

**For Backend Serverless Functions:**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=production
```

**For Frontend (React App):**
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REACT_APP_API_URL=https://your-site.netlify.app
```

**Note**: Both sets of variables are needed because:
- Frontend React code needs `REACT_APP_` prefixed variables (for client-side Supabase connection)
- Backend serverless functions need non-prefixed variables (for server-side operations)

### 2. Database Setup

Ensure your Supabase database is set up by running the SQL from `database_setup.sql`:

```sql
-- Creates users table with question tracking
-- Run this in Supabase SQL Editor if not already done
```

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

First, ensure all your changes are committed:

```bash
git add .
git commit -m "Add Netlify configuration and serverless functions"
git push origin main
```

### Step 2: Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose your GitHub repository
4. Select the branch (usually `main`)

### Step 3: Configure Build Settings

Netlify should auto-detect these settings from `netlify.toml`, but verify:

- **Build command**: `cd frontend && npm install && npm run build`
- **Publish directory**: `frontend/build`
- **Functions directory**: `netlify/functions`

### Step 4: Set Environment Variables

In Netlify dashboard:
1. Go to Site settings → Environment variables
2. Add the following variables:

| Variable Name | Value | Example |
|---|---|---|
| `GEMINI_API_KEY` | Your Google AI API key | `AIza...` |
| `SUPABASE_URL` | Your Supabase project URL | `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | `eyJhbGc...` (very long) |
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | `https://abc.supabase.co` |
| `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` | Your service role key | `eyJhbGc...` (very long) |
| `REACT_APP_API_URL` | Your Netlify site URL | `https://your-site.netlify.app` |
| `NODE_ENV` | production | `production` |

### Step 5: Deploy

1. Click "Deploy site"
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be available at a Netlify URL like `https://amazing-name-123456.netlify.app`

## 🔍 Testing Your Deployment

### 1. Check Health Endpoint

Visit: `https://your-site.netlify.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Astro Chat API (Netlify)",
  "environment": {
    "hasGeminiKey": true,
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "nodeEnv": "production",
    "platform": "netlify"
  }
}
```

### 2. Test Frontend Functionality

1. **User Details Modal**: Should open and accept birth details
2. **Question Counter**: Should display current usage (e.g., "1/10")
3. **Chat Functionality**: Should send/receive messages
4. **Daily Limits**: Should track and enforce 10 questions per day

### 3. Test API Endpoints

Using curl or Postman:

**User Status:**
```bash
curl -X POST https://your-site.netlify.app/api/user-status \
  -H "Content-Type: application/json" \
  -d '{"userData":{"firstName":"Test","dateOfBirth":"1990-01-01"}}'
```

**Chat:**
```bash
curl -X POST https://your-site.netlify.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What does my future hold?",
    "userData": {
      "firstName": "Test",
      "lastName": "User", 
      "dateOfBirth": "1990-01-01",
      "placeOfBirth": "Mumbai",
      "timeOfBirth": "10:30"
    }
  }'
```

## 🐛 Troubleshooting

### Build Failures

**Problem**: Build fails with dependency errors
**Solution**: 
- Check that `netlify/functions/package.json` exists
- Ensure all dependencies are listed correctly
- Clear cache and retry: Site settings → Build & deploy → Clear cache

### Environment Variables Not Working

**Problem**: Functions can't access environment variables
**Solution**:
- Verify variable names are exact (case-sensitive)
- Redeploy after adding variables
- Check function logs in Netlify dashboard

### Database Connection Issues

**Problem**: 500 errors on API calls
**Solution**:
- Verify Supabase URL format: `https://project.supabase.co`
- Use SERVICE ROLE key, not anon key
- Check Supabase project is active (not paused)
- Ensure database table exists

### Function Timeout

**Problem**: Functions timing out
**Solution**:
- Netlify functions have a 10-second timeout limit
- Optimize database queries
- Add proper error handling

## 📊 Monitoring & Logs

### Netlify Function Logs

1. Go to Netlify dashboard
2. Site overview → Functions
3. Click on specific function to view logs
4. Monitor for errors and performance

### Real-time Monitoring

Monitor your deployment:
- **Site**: Check uptime and performance
- **Functions**: Monitor execution time and errors  
- **Database**: Check Supabase metrics

## 🔧 Environment Variables Clarification

**Why do you need both sets of variables?**

1. **Frontend (React) variables** with `REACT_APP_` prefix:
   - Used by React code running in the browser
   - Needed for client-side Supabase operations
   - Embedded into the built JavaScript bundle

2. **Backend (Functions) variables** without prefix:
   - Used by serverless functions running on Netlify servers  
   - Needed for server-side Supabase and Gemini AI operations
   - Not accessible from browser code

**Complete Environment Variables List:**

```bash
# Backend Serverless Functions
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=production

# Frontend React App
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REACT_APP_API_URL=https://your-site.netlify.app
```

## ⚡ Performance Optimizations

### 1. Function Cold Starts

Netlify functions may have cold starts. To minimize:
- Keep functions lightweight
- Use connection pooling for database
- Implement proper caching

### 2. Build Optimization

Your `netlify.toml` includes:
- Static asset caching (1 year)
- Gzip compression
- Security headers

### 3. Database Optimization

- Use database indexes on user_key column
- Implement connection pooling
- Cache frequent queries

## 🔐 Security

Your deployment includes:
- CORS headers for API access
- Security headers (XSS protection, etc.)
- Environment variable encryption
- Supabase RLS (Row Level Security)

## 🎯 Advantages of Netlify vs Vercel

**Why Netlify might work better:**

1. **Better serverless function handling**: More reliable cold starts
2. **Superior build optimization**: Better caching and CDN
3. **Enhanced error logging**: More detailed function logs
4. **Simpler configuration**: Single `netlify.toml` file
5. **Better environment variable handling**: More reliable variable injection

## 📝 Custom Domain (Optional)

To use your own domain:

1. In Netlify dashboard: Site settings → Domain management
2. Add custom domain
3. Update DNS records as instructed
4. SSL certificate is auto-generated

## ✅ Post-Deployment Checklist

- [ ] Health endpoint returns "healthy"
- [ ] Frontend loads without errors
- [ ] User can enter birth details
- [ ] Chat functionality works
- [ ] Question counter increments correctly
- [ ] Daily limits are enforced
- [ ] Database records are created/updated
- [ ] All environment variables are set
- [ ] Function logs show no errors

## 🆘 Need Help?

If you encounter issues:

1. Check Netlify function logs first
2. Verify all environment variables are set
3. Test health endpoint
4. Check Supabase dashboard for database issues
5. Review build logs for any errors

Your Astro Chat application should now be running smoothly on Netlify with much better reliability than the Vercel deployment!
