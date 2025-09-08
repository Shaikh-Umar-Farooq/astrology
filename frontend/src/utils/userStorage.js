// User data management with localStorage

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

// Save user data to localStorage
export const saveUserData = (userData) => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
    return false;
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
