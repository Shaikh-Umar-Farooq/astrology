import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getUserInitials, getUserData, isUserDataComplete } from '../utils/userStorage';
import { getUserDailyStatus } from '../services/supabaseService';

const Header = ({ onUserIconClick, refreshCounter }) => {
  const userInitials = getUserInitials();
  const userData = getUserData();
  const userName = userData.firstName ? `${userData.firstName} ${userData.lastName}`.trim() : 'User';
  
  const [dailyStatus, setDailyStatus] = useState({
    questionsUsed: 0,
    dailyLimit: 10,
    questionsRemaining: 10,
    canAskQuestion: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const lastUserKeyRef = useRef(null);

  const fetchDailyStatus = useCallback(async () => {
    // Don't fetch if already loading or if user data is incomplete
    if (isLoading || !isUserDataComplete(userData)) {
      return;
    }

    // Create user key for caching
    const currentUserKey = `${userData.firstName}_${userData.dateOfBirth}`;
    const now = Date.now();
    
    // Avoid duplicate requests for the same user within 10 seconds
    if (
      lastUserKeyRef.current === currentUserKey && 
      now - lastFetchTimeRef.current < 10000
    ) {
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update cache references
    lastFetchTimeRef.current = now;
    lastUserKeyRef.current = currentUserKey;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setLastError(null);

    try {
      const status = await getUserDailyStatus(userData, abortControllerRef.current.signal);
      console.log('Updated daily status:', status);
      setDailyStatus(status);
      setLastError(null);
    } catch (error) {
      // Don't log or handle errors for cancelled requests
      if (error.message === 'Request was cancelled') {
        return;
      }
      
      console.error('Error fetching daily status:', error);
      setLastError(error.message);
      
      // Only retry on network errors, not server errors or rate limiting
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        timeoutRef.current = setTimeout(() => {
          fetchDailyStatus();
        }, 30000); // 30 second retry delay
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [userData]);

  // Only fetch when refreshCounter changes or component mounts
  useEffect(() => {
    if (isUserDataComplete(userData)) {
      // Debounce the call - wait 500ms before making the request
      const debounceTimeout = setTimeout(() => {
        fetchDailyStatus();
      }, 500);

      return () => clearTimeout(debounceTimeout);
    }
  }, [refreshCounter, fetchDailyStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="px-5 py-2 border-b border-border-gray bg-white flex justify-between items-center flex-shrink-0 border-l border-r border-gray">
      <div className="text-lg font-semibold text-gray-darker">
        AstroPandit
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm text-gray-darker font-medium">{userName}</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Message Counter */}
          {isUserDataComplete(userData) && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 font-medium">
                {dailyStatus.questionsUsed}/{dailyStatus.dailyLimit}
              </span>
              <div className="w-2 h-2 rounded-full bg-primary opacity-60"></div>
            </div>
          )}
          <button
            onClick={onUserIconClick}
            className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm hover:bg-primary-hover transition-colors cursor-pointer relative"
            title="Edit your details"
          >
            {userInitials}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
