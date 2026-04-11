# Quick Reference Guide

## Accessing User Office Information

```typescript
import { useStation } from '../contexts/StationContext';

const MyComponent = () => {
  const { 
    currentUser,      // Full user object
    userOfficeId,     // office.id or stationId
    userOfficeName,   // office.name
  } = useStation();

  return (
    <div>
      <p>Office: {userOfficeName || 'No office assigned'}</p>
      <p>Office ID: {userOfficeId || 'N/A'}</p>
    </div>
  );
};
```

## Accessing Cached Stations

```typescript
import { useLocation } from '../contexts/LocationContext';

const MyComponent = () => {
  const { 
    stations,           // Array of all stations (cached)
    loading,            // false if using cache
    refreshLocations,   // Force refresh from API
    invalidateCache,    // Clear cache and refetch
  } = useLocation();

  return (
    <select>
      {stations.map(station => (
        <option key={station.id} value={station.id}>
          {station.name}
        </option>
      ))}
    </select>
  );
};
```

## Filtering Out Current User's Station

```typescript
import { useStation } from '../contexts/StationContext';
import { useLocation } from '../contexts/LocationContext';

const MyComponent = () => {
  const { userOfficeId } = useStation();
  const { stations } = useLocation();

  // Filter out current user's station
  const otherStations = stations.filter(
    station => station.id !== userOfficeId
  );

  return (
    <select>
      {otherStations.map(station => (
        <option key={station.id} value={station.id}>
          {station.name}
        </option>
      ))}
    </select>
  );
};
```

## Call Center Service Usage

```typescript
import callCenterService from '../services/callCenterService';

// Get post-delivery parcels for a specific station
const response = await callCenterService.getDeliveredUncalled({
  page: 0,
  size: 20,
  officeId: userOfficeId,
  followUpStatus: 'PENDING',
});

// Record call outcome
const result = await callCenterService.updateCallOutcome(
  parcelId,
  'REACHED', // or 'UNREACHABLE' or 'DELIVERED'
  'Optional remark text'
);
```

## Checking User Office in Components

```typescript
import { useStation } from '../contexts/StationContext';

const MyComponent = () => {
  const { currentUser } = useStation();

  // Check if user has office assigned
  if (currentUser?.office) {
    console.log('Office Name:', currentUser.office.name);
    console.log('Office Code:', currentUser.office.code);
    console.log('Office Address:', currentUser.office.address);
    console.log('Location:', currentUser.office.location?.name);
  }

  return <div>...</div>;
};
```

## Cache Management

```typescript
import { useLocation } from '../contexts/LocationContext';

const MyComponent = () => {
  const { refreshLocations, invalidateCache } = useLocation();

  // Force refresh (ignores cache)
  const handleRefresh = async () => {
    await refreshLocations();
  };

  // Clear cache and trigger refetch
  const handleClearCache = () => {
    invalidateCache();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Stations</button>
      <button onClick={handleClearCache}>Clear Cache</button>
    </div>
  );
};
```

## TypeScript Types

```typescript
// Office type
interface Office {
  id: string;
  name: string;
  code: string;
  address?: string;
  phoneNumber?: string | null;
  location?: {
    id: string;
    name: string;
    region: string;
    country: string;
  };
}

// User type
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stationId?: string;
  office?: Office;
}

// Station type
interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  locationName: string;
  managerName: string;
  createdAt: number;
}
```

## Common Patterns

### Station Selector with Current Office Filter
```typescript
const StationSelector = () => {
  const { userOfficeId } = useStation();
  const { stations, loading } = useLocation();
  const [selectedStation, setSelectedStation] = useState('');

  const availableStations = stations.filter(s => s.id !== userOfficeId);

  return (
    <select 
      value={selectedStation}
      onChange={e => setSelectedStation(e.target.value)}
      disabled={loading}
    >
      <option value="">Select a station</option>
      {availableStations.map(station => (
        <option key={station.id} value={station.id}>
          {station.name} - {station.locationName}
        </option>
      ))}
    </select>
  );
};
```

### Display Office Name in Header
```typescript
const Header = () => {
  const { currentUser, userOfficeName } = useStation();

  return (
    <div>
      <p>{currentUser?.name}</p>
      <p className="text-sm text-gray-500">
        {userOfficeName || getRoleLabel(currentUser?.role)}
      </p>
    </div>
  );
};
```

### Check Cache Status
```typescript
const CacheStatus = () => {
  const { lastFetchTime } = useLocation();

  const cacheAge = lastFetchTime 
    ? Math.floor((Date.now() - lastFetchTime) / 1000) 
    : null;

  return (
    <div>
      {cacheAge !== null ? (
        <p>Cache age: {cacheAge} seconds</p>
      ) : (
        <p>No cache</p>
      )}
    </div>
  );
};
```

## localStorage Keys Reference

```
Auth:
- auth_token
- refresh_token
- user_data

Stations Cache:
- cached_locations
- cached_stations
- cached_locations_timestamp

Other:
- rememberMe
- loginType
- rememberedEmail
- rememberedPhone
- parcelTransferDraft
```

## Debugging Tips

```typescript
// Check what's in localStorage
console.log('User:', localStorage.getItem('user_data'));
console.log('Stations:', localStorage.getItem('cached_stations'));
console.log('Cache Time:', localStorage.getItem('cached_locations_timestamp'));

// Check context values
const { currentUser, userOfficeId, userOfficeName } = useStation();
console.log('Current User:', currentUser);
console.log('Office ID:', userOfficeId);
console.log('Office Name:', userOfficeName);

// Check station cache
const { stations, lastFetchTime } = useLocation();
console.log('Stations:', stations);
console.log('Last Fetch:', new Date(lastFetchTime || 0));
```
