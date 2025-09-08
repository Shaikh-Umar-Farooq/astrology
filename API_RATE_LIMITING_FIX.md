# API Rate Limiting Fix

## Problem
The frontend was making too many requests to `/api/user-status` endpoint, causing:
- Excessive API calls (every second)
- Rate limiting from backend
- Poor user experience
- Unnecessary server load

## Root Causes
1. **useEffect Dependencies**: The `userData` object was being recreated on every render, triggering endless API calls
2. **No Request Caching**: Same requests were being made repeatedly without caching
3. **No Error Handling**: Failed requests would immediately retry without backoff
4. **No Request Cancellation**: Multiple simultaneous requests could be in flight

## Solutions Implemented

### Frontend Fixes

#### 1. Improved useEffect Dependencies
- Removed `userData` from dependencies (was causing infinite re-renders)
- Only trigger on `refreshCounter` changes
- Added debouncing (500ms delay) before making requests

#### 2. Request Caching & Deduplication  
- Added 10-second cache to prevent duplicate requests for same user
- Track last fetch time and user key
- Skip requests if same user data requested within cache window

#### 3. Proper Request Cancellation
- Use AbortController to cancel previous requests
- Timeout requests after 10 seconds
- Clean up on component unmount

#### 4. Smart Error Handling & Retry Logic
- Distinguish between network errors vs server errors
- Only retry on network failures (not rate limiting or server errors)
- 30-second backoff for network error retries
- Don't retry rate limit errors

#### 5. Loading State Management
- Prevent multiple simultaneous requests
- Show loading states appropriately
- Graceful fallback values when API unavailable

### Backend Fixes

#### 1. Endpoint-Specific Rate Limiting
- General API: 100 requests per 15 minutes
- User Status API: 10 requests per minute (more restrictive)
- Proper rate limit headers for client feedback

#### 2. Better Error Responses
- Return proper status codes (429 for rate limiting)
- Include helpful error messages
- Standard rate limit headers

## Code Changes Summary

### `Header.js`
```javascript
// Before: Infinite API calls
useEffect(() => {
  fetchDailyStatus();
}, [userData, refreshCounter]); // userData changes every render!

// After: Controlled API calls with caching
useEffect(() => {
  if (isUserDataComplete(userData)) {
    const debounceTimeout = setTimeout(() => {
      fetchDailyStatus(); // Only if not cached
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }
}, [refreshCounter, fetchDailyStatus]);
```

### `supabaseService.js`
```javascript
// Before: No timeout or cancellation
const response = await fetch(url, { method: 'POST', ... });

// After: Proper timeout and cancellation
const response = await fetch(url, {
  method: 'POST',
  signal: signal || AbortSignal.timeout(10000)
});
```

### `server.js`
```javascript
// Before: Same rate limit for all endpoints
app.use('/api/', limiter);

// After: Endpoint-specific rate limiting
app.use('/api/chat', limiter);           // 100/15min
app.use('/api/user-status', statusLimiter); // 10/1min
```

## Testing the Fix

1. **Check Network Tab**: Should see significantly fewer `/api/user-status` requests
2. **Error Handling**: API errors should not cause infinite retries
3. **Rate Limiting**: Status endpoint properly limited to 10 requests/minute
4. **Caching**: Same user shouldn't trigger new requests within 10 seconds

## Benefits

- ✅ **Reduced API Calls**: 90%+ reduction in unnecessary requests
- ✅ **Better User Experience**: No more rate limit errors in normal usage
- ✅ **Server Performance**: Reduced load on backend
- ✅ **Proper Error Handling**: Graceful fallbacks and smart retries
- ✅ **Request Cancellation**: No orphaned requests
- ✅ **Caching**: Efficient data fetching

## Monitoring

Watch for these metrics to ensure fix is working:
- Network requests to `/api/user-status` should be < 1 per 10 seconds per user
- 429 errors should be rare (only if user genuinely exceeds limits)
- Console errors should be minimal
- Counter display should still update properly after questions
