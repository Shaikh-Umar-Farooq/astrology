const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Generate a unique key from user's DOB and first name
 */
const generateUserKey = (dateOfBirth, firstName) => {
  const combinedString = `${firstName.toLowerCase().trim()}_${dateOfBirth}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
};

/**
 * Get user's daily status (questions remaining, can ask, etc.)
 */
const getUserDailyStatus = async (userKey) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_key', userKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!user) {
      // User doesn't exist yet
      return {
        daily_questions_count: 0,
        daily_limit: 10,
        last_question_date: today,
        can_ask_question: true,
        questions_remaining: 10
      };
    }

    // Check if it's a new day
    const isNewDay = user.last_question_date !== today;
    
    if (isNewDay) {
      // Reset count for new day
      return {
        daily_questions_count: 0,
        daily_limit: user.daily_limit,
        last_question_date: today,
        can_ask_question: true,
        questions_remaining: user.daily_limit
      };
    } else {
      // Same day
      return {
        daily_questions_count: user.daily_questions_count,
        daily_limit: user.daily_limit,
        last_question_date: user.last_question_date,
        can_ask_question: user.daily_questions_count < user.daily_limit,
        questions_remaining: user.daily_limit - user.daily_questions_count
      };
    }
  } catch (error) {
    console.error('Error getting user daily status:', error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check environment variables first
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[USER-STATUS] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceRoleKey
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - missing environment variables' 
        })
      };
    }

    const { userData } = JSON.parse(event.body);

    // Validate user data
    if (!userData || !userData.firstName || !userData.dateOfBirth) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'User first name and date of birth are required.' 
        })
      };
    }

    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    console.log('[USER-STATUS API] Getting status for user key:', userKey.substring(0, 8) + '...');
    
    const status = await getUserDailyStatus(userKey);
    console.log('[USER-STATUS API] Raw status from DB:', status);
    
    if (!status) {
      // User doesn't exist yet
      const defaultStatus = {
        questionsUsed: 0,
        dailyLimit: 10,
        questionsRemaining: 10,
        canAskQuestion: true
      };
      console.log('[USER-STATUS API] User not found, returning default:', defaultStatus);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(defaultStatus)
      };
    }

    const responseStatus = {
      questionsUsed: status.daily_questions_count,
      dailyLimit: status.daily_limit,
      questionsRemaining: status.questions_remaining,
      canAskQuestion: status.can_ask_question
    };
    
    console.log('[USER-STATUS API] Returning status:', responseStatus);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseStatus)
    };

  } catch (error) {
    console.error('[USER-STATUS] API Error:', error);
    
    // Return more detailed error information for debugging
    const errorResponse = {
      error: 'Failed to get user status',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    // In development, include more error details
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = error.stack;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};
