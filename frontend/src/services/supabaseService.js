import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Generate a unique key from user's DOB and first name
 * @param {string} dateOfBirth - User's date of birth in YYYY-MM-DD format
 * @param {string} firstName - User's first name
 * @returns {string} - Unique hash key
 */
export const generateUserKey = (dateOfBirth, firstName) => {
  const combinedString = `${firstName.toLowerCase().trim()}_${dateOfBirth}`;
  return CryptoJS.SHA256(combinedString).toString();
};

/**
 * Check if a user exists in the database by their unique key
 * @param {string} userKey - The unique key for the user
 * @returns {Object|null} - User data if exists, null otherwise
 */
export const getUserByKey = async (userKey) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_key', userKey)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by key:', error);
    throw error;
  }
};

/**
 * Create a new user in the database
 * @param {Object} userData - User information
 * @returns {Object} - Created user data
 */
export const createUser = async (userData) => {
  try {
    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    
    const newUser = {
      user_key: userKey,
      first_name: userData.firstName,
      last_name: userData.lastName,
      date_of_birth: userData.dateOfBirth,
      place_of_birth: userData.placeOfBirth,
      time_of_birth: userData.timeOfBirth,
      questions_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user information
 * @param {string} userKey - The unique key for the user
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated user data
 */
export const updateUser = async (userKey, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_key', userKey)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Increment the question count for a user
 * @param {string} userKey - The unique key for the user
 * @returns {Object} - Updated user data
 */
export const incrementQuestionCount = async (userKey) => {
  try {
    const { data, error } = await supabase
      .rpc('increment_question_count', { user_key_param: userKey });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error incrementing question count:', error);
    throw error;
  }
};

/**
 * Get or create user - main function to handle user flow
 * @param {Object} userData - User information
 * @returns {Object} - User data from database
 */
export const getOrCreateUser = async (userData) => {
  try {
    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    
    // First, try to get existing user
    let user = await getUserByKey(userKey);
    
    if (!user) {
      // User doesn't exist, create new one
      user = await createUser(userData);
    } else {
      // User exists, update their information if needed
      const updates = {};
      if (user.last_name !== userData.lastName) updates.last_name = userData.lastName;
      if (user.place_of_birth !== userData.placeOfBirth) updates.place_of_birth = userData.placeOfBirth;
      if (user.time_of_birth !== userData.timeOfBirth) updates.time_of_birth = userData.timeOfBirth;
      
      if (Object.keys(updates).length > 0) {
        user = await updateUser(userKey, updates);
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
};

/**
 * Get user's daily limit status from backend
 * @param {Object} userData - User information
 * @param {AbortSignal} signal - Optional abort signal for canceling requests
 * @returns {Object} - User's daily limit status
 */
export const getUserDailyStatus = async (userData, signal = null) => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');
    
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userData }),
      // Add timeout to prevent hanging requests
      signal: signal || AbortSignal.timeout(10000) // 10 second timeout
    };

    const response = await fetch(`${API_BASE_URL}/api/user-status`, fetchOptions);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many requests - rate limited');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request was cancelled');
    }
    console.error('Error getting user daily status:', error);
    
    // Only return defaults for actual network errors, not server errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return {
        questionsUsed: 0,
        dailyLimit: 10,
        questionsRemaining: 10,
        canAskQuestion: true
      };
    }
    
    // Re-throw server errors so they can be handled properly
    throw error;
  }
};

export default supabase;
