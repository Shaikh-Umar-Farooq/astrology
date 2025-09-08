const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

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

/**
 * Increment the question count for a user with daily limit check
 * @param {string} userKey - The unique key for the user
 * @returns {Object} - Updated user data with limit info
 */
const incrementQuestionCount = async (userKey) => {
  try {
    const { data, error } = await supabase
      .rpc('increment_question_count', { user_key_param: userKey });

    if (error) {
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error incrementing question count:', error);
    throw error;
  }
};

/**
 * Get or create user and check/increment question count with daily limits
 * Uses direct database queries instead of functions for better reliability
 * @param {Object} userData - User information
 * @returns {Object} - User data from database with updated question count and limit info
 */
const handleUserQuestion = async (userData) => {
  try {
    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_key', userKey)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let user;
    
    if (!existingUser) {
      // User doesn't exist, create new one
      const newUser = {
        user_key: userKey,
        first_name: userData.firstName,
        last_name: userData.lastName,
        date_of_birth: userData.dateOfBirth,
        place_of_birth: userData.placeOfBirth,
        time_of_birth: userData.timeOfBirth,
        questions_count: 1, // First question
        daily_questions_count: 1, // First daily question
        last_question_date: today,
        daily_limit: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      user = {
        ...createdUser,
        can_ask_question: true,
        questions_remaining: 9
      };
    } else {
      // User exists - check if we need to reset daily count
      const isNewDay = existingUser.last_question_date !== today;
      
      if (isNewDay) {
        // Reset daily count for new day
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            daily_questions_count: 1,
            last_question_date: today,
            questions_count: existingUser.questions_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_key', userKey)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        user = {
          ...updatedUser,
          can_ask_question: true,
          questions_remaining: updatedUser.daily_limit - 1
        };
      } else {
        // Same day - check daily limit
        if (existingUser.daily_questions_count >= existingUser.daily_limit) {
          // Limit exceeded
          user = {
            ...existingUser,
            can_ask_question: false,
            questions_remaining: 0
          };
        } else {
          // Increment counters
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              daily_questions_count: existingUser.daily_questions_count + 1,
              questions_count: existingUser.questions_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_key', userKey)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          user = {
            ...updatedUser,
            can_ask_question: updatedUser.daily_questions_count < updatedUser.daily_limit,
            questions_remaining: updatedUser.daily_limit - updatedUser.daily_questions_count
          };
        }
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error in handleUserQuestion:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  generateUserKey,
  getUserDailyStatus,
  incrementQuestionCount,
  handleUserQuestion
};
