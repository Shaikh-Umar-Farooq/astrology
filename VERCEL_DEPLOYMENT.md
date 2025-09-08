# Vercel Deployment Guide

## ✅ ESLint Issues Fixed

The following ESLint errors have been resolved:

1. **Unused variable**: Removed `lastError` state variable
2. **Missing dependencies**: Fixed React hooks dependency arrays
3. **Console logs**: Removed debug console.log statements for production

## Environment Variables Required

### Backend (.env in root)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5001
NODE_ENV=production
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Frontend (Vercel Environment Variables)
Set these in Vercel Dashboard → Settings → Environment Variables:
```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REACT_APP_API_URL=your_backend_url (optional, defaults to production API)
```

## Deployment Steps

### 1. Database Setup
Ensure Supabase database is set up:
```sql
-- Run this in Supabase SQL Editor
-- (Copy from database_setup.sql)
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Fix ESLint errors for production build"
git push origin main
```

### 3. Deploy to Vercel
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Set environment variables
- Deploy

### 4. Verify Deployment
1. **Frontend functionality**:
   - User details modal works
   - Counter displays (X/10 format)
   - Questions can be asked
   - Counter increments after questions

2. **Backend functionality**:
   - `/api/chat` endpoint works
   - `/api/user-status` endpoint works
   - Daily limits enforced
   - Database updates properly

## Build Configuration

### Vercel Settings
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm install`
- **Root Directory**: `./` (project root)

### API Routes
Vercel will automatically detect and deploy:
- `/api/chat.js` → `/api/chat`
- `/api/health.js` → `/api/health`

Backend server.js endpoints will be available as:
- `/api/user-status` (from backend server)

## Testing After Deployment

### 1. Basic Functionality
- [ ] Frontend loads without errors
- [ ] User can enter details
- [ ] Chat interface works
- [ ] Counter displays correctly

### 2. Database Integration
- [ ] Questions increment counter
- [ ] Database records update
- [ ] Daily limits enforced
- [ ] Status API returns correct data

### 3. Error Handling
- [ ] Rate limiting works
- [ ] Limit exceeded messages show
- [ ] Network errors handled gracefully

## Common Issues & Solutions

### Build Fails with ESLint Errors
✅ **Fixed**: All ESLint issues have been resolved

### Environment Variables Not Set
- Check Vercel dashboard environment variables
- Ensure REACT_APP_ prefix for frontend variables
- Redeploy after adding variables

### API Calls Fail in Production
- Check REACT_APP_API_URL is set correctly
- Verify backend is deployed and accessible
- Check CORS settings in backend

### Database Connection Issues
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Check Supabase project is active
- Ensure database table exists

## Production Optimizations Applied

1. **Removed debug console.log statements**
2. **Fixed React hooks dependencies**
3. **Removed unused variables**
4. **Proper error handling without console spam**
5. **Rate limiting configured for production**

## Ready for Deployment! 🚀

Your application is now ready for Vercel deployment with:
- ✅ ESLint errors fixed
- ✅ Production-ready code
- ✅ Environment variables documented
- ✅ Database schema ready
- ✅ Full question counter functionality
