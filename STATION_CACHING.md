# Station Caching Implementation

## Overview
Stations and locations are now cached in localStorage to improve performance and reduce API calls.

## Implementation Details

### 1. LocationContext Updates (`LocationContext.tsx`)

**Cache Configuration:**
- **Cache Duration:** 5 minutes (300,000 ms)
- **Storage Keys:**
  - `cached_locations` - Stores location data
  - `cached_stations` - Stores flattened station list
  - `cached_locations_timestamp` - Stores last fetch timestamp

**New Helper Functions:**
```typescript
loadFromStorage()    // Loads cached data from localStorage
saveToStorage()      // Saves data to localStorage
clearStorage()       // Clears all cached data
```

**Behavior:**
- On mount: Loads from localStorage if cache is valid
- On fetch: Saves to localStorage after successful API call
- On invalidate: Clears both state and localStorage
- Auto-refresh: Fetches new data if cache is older than 5 minutes

### 2. Auth Service Updates (`authService.ts`)

**Logout Enhancement:**
- Now clears station cache along with user data
- Ensures fresh data on next login
- Prevents stale data across different user sessions

```typescript
logout(): void {
    // Clear auth data
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    
    // Clear cached stations/locations
    localStorage.removeItem('cached_locations');
    localStorage.removeItem('cached_stations');
    localStorage.removeItem('cached_locations_timestamp');
}
```

## Benefits

1. **Performance:**
   - Instant station list availability on page load
   - Reduced API calls (only refreshes every 5 minutes)
   - Faster dropdown rendering

2. **User Experience:**
   - No loading delay when switching between pages
   - Consistent data across components
   - Works offline (for cached duration)

3. **Network Efficiency:**
   - Reduces server load
   - Saves bandwidth
   - Fewer redundant requests

## Usage

The caching is transparent to components using `useLocation()`:

```typescript
const { stations, loading, refreshLocations, invalidateCache } = useLocation();

// stations array is automatically populated from cache or API
// loading is false if using cached data
// refreshLocations() forces a fresh fetch
// invalidateCache() clears cache and triggers refetch
```

## Cache Lifecycle

```
User Login
    ↓
LocationContext Initializes
    ↓
Check localStorage
    ↓
    ├─ Cache Valid? → Use Cached Data (instant)
    ↓
    └─ Cache Invalid/Missing? → Fetch from API → Save to localStorage
    ↓
Components Use Stations
    ↓
5 Minutes Pass
    ↓
Next Access → Fetch Fresh Data → Update Cache
    ↓
User Logout → Clear All Cache
```

## Testing

To verify caching is working:

1. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - Look for `cached_locations`, `cached_stations`, `cached_locations_timestamp`

2. **Check Network:**
   - Open DevTools → Network
   - Navigate between pages
   - Should only see one `/locations` API call per 5 minutes

3. **Test Cache Invalidation:**
   - Call `invalidateCache()` from any component
   - Verify localStorage is cleared
   - Verify new API call is made

4. **Test Logout:**
   - Login → Navigate → Logout
   - Check localStorage is cleared
   - Login again → Verify fresh data is fetched

## Notes

- Cache is shared across all tabs (same origin)
- Cache survives page refresh
- Cache is cleared on logout
- Cache expires after 5 minutes of inactivity
- Failed API calls don't clear existing cache
