const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Generate a unique key from user's DOB and first name
 * @param {string} dateOfBirth - User's date of birth in YYYY-MM-DD format
 * @param {string} firstName - User's first name
 * @returns {string} - Unique hash key
 */
const generateUserKey = (dateOfBirth, firstName) => {
  const combinedString = `${firstName.toLowerCase().trim()}_${dateOfBirth}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
};

/**
 * Get user's daily status (questions remaining, can ask, etc.)
 * Uses direct database queries for better reliability
 * @param {string} userKey - The unique key for the user
 * @returns {Object} - User's daily limit status
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userData } = req.body;

    // Validate user data
    if (!userData || !userData.firstName || !userData.dateOfBirth) {
      return res.status(400).json({ 
        error: 'User first name and date of birth are required.' 
      });
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
      return res.json(defaultStatus);
    }

    const responseStatus = {
      questionsUsed: status.daily_questions_count,
      dailyLimit: status.daily_limit,
      questionsRemaining: status.questions_remaining,
      canAskQuestion: status.can_ask_question
    };
    
    console.log('[USER-STATUS API] Returning status:', responseStatus);
    res.json(responseStatus);

  } catch (error) {
    console.error('User status API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get user status' 
    });
  }
}
