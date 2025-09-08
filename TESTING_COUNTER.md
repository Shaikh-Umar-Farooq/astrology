# Testing Question Counter Updates

## How to Test Counter Functionality

### Step 1: Check Initial Setup
1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend
   npm start
   ```

2. **Open browser console** (F12) to see debug logs

### Step 2: Test Counter Display
1. **Enter user details** in the modal (if not already done)
2. **Check header** - should show counter like "0/10" next to user icon
3. **Look for console logs**:
   - `Getting status for user key: [hash]`
   - `Updated daily status: {questionsUsed: 0, dailyLimit: 10, ...}`

### Step 3: Test Question Increment
1. **Ask a question** in the chat
2. **Watch for console logs**:
   
   **Backend logs:**
   ```
   Processing question for user: [FirstName]
   User limit info after processing: {daily_questions_count: 1, ...}
   Sending limit info to frontend: {questionsUsed: 1, ...}
   ```
   
   **Frontend logs:**
   ```
   Question answered successfully, updating counter...
   User limit info: {questionsUsed: 1, dailyLimit: 10, ...}
   Updated daily status: {questionsUsed: 1, dailyLimit: 10, ...}
   ```

3. **Check counter update** - should change from "0/10" to "1/10"

### Step 4: Test Multiple Questions
1. **Ask 2-3 more questions**
2. **Verify counter increments**: "1/10" → "2/10" → "3/10"
3. **Check database** in Supabase dashboard:
   - Go to Table Editor → users
   - Find your user record
   - Verify `questions_count` and `daily_questions_count` are incrementing

### Step 5: Test Daily Limit (Optional)
1. **Ask 10 questions total**
2. **Try 11th question** - should get limit exceeded message
3. **Counter should show "10/10"**
4. **Red warning message** should appear in chat

## Expected Behavior

### ✅ Working Correctly
- Counter displays current usage (e.g., "3/10")
- Counter increments after each question
- Backend logs show question processing
- Frontend logs show counter updates
- Database records update properly

### ❌ Problems to Look For
- Counter stuck at "0/10" after questions
- No backend logs for question processing
- Database not updating
- Frontend not receiving limit info
- Console errors in browser or terminal

## Debugging Common Issues

### Counter Not Updating
**Check:**
1. **Backend logs** - Is `handleUserQuestion` being called?
2. **Database connection** - Any Supabase errors?
3. **Frontend logs** - Is `refreshCounter` being incremented?
4. **Network tab** - Are API calls succeeding?

### Database Not Updating
**Check:**
1. **Environment variables** - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set?
2. **Database migration** - Run the SQL from `database_setup.sql`?
3. **Table structure** - Does users table have new columns?

### Counter Shows Wrong Numbers
**Check:**
1. **Browser cache** - Try hard refresh (Ctrl+F5)
2. **Multiple browser tabs** - Close extra tabs
3. **Database state** - Check actual values in Supabase

## Manual Database Check

If counter seems wrong, check database directly:

1. **Go to Supabase Dashboard**
2. **Table Editor → users**
3. **Find your user** (search by first_name)
4. **Check values**:
   - `questions_count` (total questions ever)
   - `daily_questions_count` (questions today)
   - `last_question_date` (should be today's date)
   - `daily_limit` (should be 10)

## Reset for Testing

To reset counter for testing:

```sql
-- In Supabase SQL Editor
UPDATE users 
SET daily_questions_count = 0, 
    last_question_date = CURRENT_DATE - INTERVAL '1 day'
WHERE user_key = 'your_user_key_here';
```

This will reset daily count and make the system think it's a new day.

## Success Criteria

✅ **Counter increments from 0/10 to 1/10 after first question**
✅ **Each subsequent question increments counter**  
✅ **Backend logs show proper question tracking**
✅ **Database records update correctly**
✅ **Limit exceeded works at 10 questions**
✅ **No console errors or failed API calls**
