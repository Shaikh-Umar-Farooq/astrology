// User data management with localStorage and Supabase

import { getOrCreateUser, generateUserKey } from '../services/supabaseService';

const USER_DATA_KEY = 'astro_chat_user_data';

export const defaultUserData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  placeOfBirth: '',
  timeOfBirth: ''
};

// Get user data from localStorage
export const getUserData = () => {
  try {
    const stored = localStorage.getItem(USER_DATA_KEY);
    if (stored) {
      return { ...defaultUserData, ...JSON.parse(stored) };
    }
    return defaultUserData;
  } catch (error) {
    console.error('Error reading user data from localStorage:', error);
    return defaultUserData;
  }
};

// Save user data to localStorage and Supabase
export const saveUserData = async (userData) => {
  try {
    // Save to localStorage first for immediate access
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
    // Then save to Supabase
    if (isUserDataComplete(userData)) {
      try {
        const supabaseUser = await getOrCreateUser(userData);
        console.log('User saved to Supabase:', supabaseUser);
        
        // Store the user key in localStorage for future reference
        const userDataWithKey = {
          ...userData,
          userKey: generateUserKey(userData.dateOfBirth, userData.firstName),
          questionsCount: supabaseUser.questions_count
        };
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userDataWithKey));
        
        return { success: true, supabaseUser };
      } catch (supabaseError) {
        console.error('Error saving to Supabase:', supabaseError);
        // Still return success since localStorage worked
        return { success: true, supabaseError };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
    return { success: false, error };
  }
};

// Check if all required fields are filled
export const isUserDataComplete = (userData = null) => {
  const data = userData || getUserData();
  return !!(
    data.firstName?.trim() &&
    data.lastName?.trim() &&
    data.dateOfBirth?.trim() &&
    data.placeOfBirth?.trim() &&
    data.timeOfBirth?.trim()
  );
};

// Get user initials
export const getUserInitials = (userData = null) => {
  const data = userData || getUserData();
  if (data.firstName?.trim()) {
    return data.firstName.charAt(0).toUpperCase();
  }
  return 'U'; // Default fallback
};

// Get user's unique key
export const getUserKey = (userData = null) => {
  const data = userData || getUserData();
  if (data.userKey) {
    return data.userKey;
  }
  if (isUserDataComplete(data)) {
    return generateUserKey(data.dateOfBirth, data.firstName);
  }
  return null;
};

// Get user's questions count
export const getQuestionsCount = (userData = null) => {
  const data = userData || getUserData();
  return data.questionsCount || 0;
};

// Clear user data (for testing or reset purposes)
export const clearUserData = () => {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};
