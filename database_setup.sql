-- Supabase Database Setup for Astro Chat Application
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    user_key VARCHAR(64) UNIQUE NOT NULL, -- SHA256 hash of firstName + dateOfBirth
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth VARCHAR(200) NOT NULL,
    time_of_birth TIME NOT NULL,
    questions_count INTEGER DEFAULT 0,
    daily_questions_count INTEGER DEFAULT 0,
    last_question_date DATE DEFAULT CURRENT_DATE,
    daily_limit INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_user_key ON users(user_key);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create function to increment question count with daily limit check
CREATE OR REPLACE FUNCTION increment_question_count(user_key_param VARCHAR(64))
RETURNS TABLE(
    id BIGINT,
    user_key VARCHAR(64),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    place_of_birth VARCHAR(200),
    time_of_birth TIME,
    questions_count INTEGER,
    daily_questions_count INTEGER,
    last_question_date DATE,
    daily_limit INTEGER,
    can_ask_question BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    current_date_val DATE := CURRENT_DATE;
    user_record RECORD;
BEGIN
    -- Get current user data
    SELECT * INTO user_record FROM users WHERE users.user_key = user_key_param;
    
    -- Reset daily count if it's a new day
    IF user_record.last_question_date < current_date_val THEN
        UPDATE users 
        SET 
            daily_questions_count = 1,
            last_question_date = current_date_val,
            questions_count = questions_count + 1,
            updated_at = NOW()
        WHERE users.user_key = user_key_param;
    ELSE
        -- Same day - check if limit exceeded
        IF user_record.daily_questions_count < user_record.daily_limit THEN
            UPDATE users 
            SET 
                daily_questions_count = daily_questions_count + 1,
                questions_count = questions_count + 1,
                updated_at = NOW()
            WHERE users.user_key = user_key_param;
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT users.id, users.user_key, users.first_name, users.last_name, 
           users.date_of_birth, users.place_of_birth, users.time_of_birth,
           users.questions_count, users.daily_questions_count, users.last_question_date,
           users.daily_limit, 
           (users.daily_questions_count < users.daily_limit OR users.last_question_date < current_date_val) as can_ask_question,
           users.created_at, users.updated_at
    FROM users 
    WHERE users.user_key = user_key_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to check user's daily limit status
CREATE OR REPLACE FUNCTION get_user_daily_status(user_key_param VARCHAR(64))
RETURNS TABLE(
    daily_questions_count INTEGER,
    daily_limit INTEGER,
    last_question_date DATE,
    can_ask_question BOOLEAN,
    questions_remaining INTEGER
) AS $$
DECLARE
    current_date_val DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN users.last_question_date < current_date_val THEN 0
            ELSE users.daily_questions_count
        END as daily_questions_count,
        users.daily_limit,
        users.last_question_date,
        (users.last_question_date < current_date_val OR users.daily_questions_count < users.daily_limit) as can_ask_question,
        CASE 
            WHEN users.last_question_date < current_date_val THEN users.daily_limit
            ELSE (users.daily_limit - users.daily_questions_count)
        END as questions_remaining
    FROM users 
    WHERE users.user_key = user_key_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role can do everything" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users (read their own data)
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (true); -- You can restrict this based on your needs

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT USAGE ON SEQUENCE users_id_seq TO service_role;

-- Migration for existing users (if you have existing data)
-- This adds the new columns to existing users if they don't exist
DO $$
BEGIN
    -- Add daily_questions_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'daily_questions_count'
    ) THEN
        ALTER TABLE users ADD COLUMN daily_questions_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add last_question_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_question_date'
    ) THEN
        ALTER TABLE users ADD COLUMN last_question_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add daily_limit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'daily_limit'
    ) THEN
        ALTER TABLE users ADD COLUMN daily_limit INTEGER DEFAULT 10;
    END IF;
END $$;
