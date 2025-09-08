# Vercel Deployment Debugging Guide

## 🚨 Current Error: 500 Internal Server Error on `/api/user-status`

### Quick Fix Checklist

1. **✅ Environment Variables in Vercel Dashboard**
   
   Go to your Vercel project → Settings → Environment Variables and ensure these are set:

   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   **Important**: 
   - No `REACT_APP_` prefix for serverless functions
   - Use the SERVICE ROLE key, not the anon key
   - Redeploy after adding environment variables

2. **✅ Check Vercel Function Logs**
   
   Go to Vercel Dashboard → Your Project → Functions → Click on failing function to see logs

3. **✅ Test Environment Variables**
   
   Visit: `https://your-app.vercel.app/api/health` 
   Should return: `{"status":"healthy",...}`

### Common Issues & Solutions

#### **Issue 1: Missing Environment Variables**
**Error**: `Server configuration error - missing environment variables`
**Solution**: 
- Add all required env vars in Vercel dashboard
- Redeploy the project
- Wait 2-3 minutes for propagation

#### **Issue 2: Wrong Supabase Keys**
**Error**: `Invalid API key` or `Authentication failed`
**Solution**:
- Use SERVICE ROLE key (starts with `eyJ...` and is very long)
- NOT the anon/public key
- Get it from Supabase Dashboard → Settings → API

#### **Issue 3: Supabase URL Format**
**Error**: `Invalid URL`
**Solution**:
- Format: `https://yourproject.supabase.co`
- No trailing slash
- Must include `https://`

#### **Issue 4: Database Table Missing**
**Error**: `relation "users" does not exist`
**Solution**:
- Run the SQL from `database_setup.sql` in Supabase SQL Editor
- Make sure all columns exist: `daily_questions_count`, `last_question_date`, etc.

### Debugging Steps

#### Step 1: Check Function Logs
1. Go to Vercel Dashboard
2. Your Project → Functions
3. Click on `api/user-status.js`
4. Check Recent Invocations for error details

#### Step 2: Test with curl
```bash
curl -X POST https://your-app.vercel.app/api/user-status \
  -H "Content-Type: application/json" \
  -d '{"userData":{"firstName":"Test","dateOfBirth":"1990-01-01"}}'
```

Should return JSON with `questionsUsed`, `dailyLimit`, etc.

#### Step 3: Check Environment Variables
The API will now log missing variables:
```
[USER-STATUS] Missing environment variables: {hasUrl: false, hasKey: true}
```

#### Step 4: Database Connection Test
Run this in Supabase SQL Editor:
```sql
SELECT * FROM users LIMIT 1;
```
Should return table structure or empty result (not an error).

### Expected Working Response

**Successful API Response:**
```json
{
  "questionsUsed": 0,
  "dailyLimit": 10,
  "questionsRemaining": 10,
  "canAskQuestion": true
}
```

**Error Response (with details):**
```json
{
  "error": "Failed to get user status",
  "details": "relation \"users\" does not exist",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Environment Variables Reminder

Copy these EXACT variable names to Vercel:

| Variable Name | Value | Example |
|---|---|---|
| `GEMINI_API_KEY` | Your Google AI API key | `AIza...` |
| `SUPABASE_URL` | Your Supabase project URL | `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | `eyJhbGc...` (very long) |

### Next Steps After Adding Variables

1. **Redeploy** your Vercel project
2. **Wait 2-3 minutes** for environment variables to propagate
3. **Test the endpoint** again
4. **Check function logs** for any remaining errors
5. **Verify database table** exists in Supabase

### Still Not Working?

If you're still getting 500 errors:

1. **Check the Vercel function logs** for the actual error message
2. **Verify your Supabase project is active** and not paused
3. **Test your Supabase connection** from the Supabase dashboard
4. **Ensure database table exists** by running the setup SQL
5. **Try the health endpoint** first: `/api/health`

The updated code now provides detailed error messages to help identify the exact issue!
