# Supabase Integration Setup Guide

This guide will help you set up Supabase integration for your Astro Chat application.

## Prerequisites

1. A Supabase account and project
2. Your Supabase project URL and service role key

## Database Setup

1. **Create the Database Table**
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and run the SQL from `database_setup.sql` file in the project root

2. **Environment Variables**

   ### Backend (.env file in /backend directory)
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   ### Frontend (.env file in /frontend directory)
   **Important**: React environment variables must start with `REACT_APP_`
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   **Note**: Create a `.env` file in the `/frontend` directory (not `.env.local`). React will automatically load environment variables that start with `REACT_APP_`.

## How it Works

### User Flow
1. **First Time User**: When a user enters their birth details:
   - A unique key is generated using SHA256 hash of `firstName + dateOfBirth`
   - User data is stored in both localStorage and Supabase
   - `questions_count` is initialized to 0

2. **Returning User**: When an existing user asks questions:
   - The system checks if the generated key exists in Supabase
   - If exists, `questions_count` is incremented by 1
   - User data is updated if any details changed

3. **Question Tracking**: Every time a user asks a question via the chat:
   - The backend automatically increments the user's question count
   - This happens asynchronously without affecting chat response time

### Key Features
- **Unique User Identification**: Uses SHA256 hash of DOB + firstName
- **Dual Storage**: Data stored in both localStorage (immediate access) and Supabase (persistent)
- **Question Counting**: Automatic tracking of how many questions each user has asked
- **Daily Limits**: Users can ask maximum 10 questions per day, automatically resets daily
- **Counter Display**: Shows current usage (e.g., "3/10") next to user icon
- **Limit Messages**: Special warning messages when daily limit is reached
- **Error Resilience**: App continues to work even if Supabase is unavailable (falls back to localStorage)

### Database Schema

The `users` table contains:
- `id`: Primary key (auto-generated)
- `user_key`: Unique SHA256 hash of firstName + dateOfBirth
- `first_name`: User's first name
- `last_name`: User's last name
- `date_of_birth`: Birth date
- `place_of_birth`: Birth location
- `time_of_birth`: Birth time
- `questions_count`: Total number of questions asked (auto-incremented)
- `daily_questions_count`: Questions asked today (resets daily)
- `last_question_date`: Date of last question (for daily reset logic)
- `daily_limit`: Daily question limit (default: 10)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Security
- Row Level Security (RLS) is enabled
- Service role has full access for backend operations
- Regular users can only read their own data

## Testing

1. **Test User Creation**:
   - Enter user details in the app
   - Check Supabase dashboard to see if user was created
   - Check browser console for any errors

2. **Test Question Counting & Daily Limits**:
   - Ask questions in the chat
   - Check if counter shows "1/10", "2/10", etc. next to user icon
   - Verify `daily_questions_count` increments in the database
   - Try asking 11 questions to test the limit (should show warning message)

3. **Test Daily Reset**:
   - Manually update `last_question_date` to yesterday in database
   - Ask a question and verify counter resets to "1/10"

4. **Test Existing User**:
   - Clear localStorage
   - Re-enter the same user details
   - Verify it finds the existing user instead of creating a duplicate

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Make sure both backend and frontend .env files are created
   - Restart both servers after adding environment variables

2. **Database Connection Errors**
   - Verify your Supabase URL and service role key
   - Check if the database table was created correctly

3. **CORS Issues**
   - Ensure your domain is added to Supabase allowed origins
   - Check Supabase project settings

4. **Function Not Found Errors**
   - Make sure the `increment_question_count` function was created
   - Run the complete SQL setup script from `database_setup.sql`

### Debug Mode
- Check browser console for frontend errors
- Check backend logs for Supabase integration issues
- Monitor the Supabase dashboard for database activity

## Migration from localStorage Only

If you have existing users with data only in localStorage:
1. The app will automatically sync their data to Supabase when they next visit
2. Their question count will start from 0 (historical count not preserved)
3. No data loss occurs - localStorage continues to work as fallback
