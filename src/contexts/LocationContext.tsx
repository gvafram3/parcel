import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import locationService from "../services/locationService";

interface Station {
    id: string;
    name: string;
    code: string;
    address: string;
    locationName: string;
    managerName: string;
    createdAt: number;
}

interface Location {
    id: string;
    name: string;
    region: string;
    country: string;
    offices: Station[];
}

interface LocationContextType {
    locations: Location[];
    stations: Station[];
    loading: boolean;
    lastFetchTime: number | null;
    refreshLocations: () => Promise<void>;
    invalidateCache: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION = 5 * 60 * 1000;
const STORAGE_KEY_LOCATIONS = 'cached_locations';
const STORAGE_KEY_STATIONS = 'cached_stations';
const STORAGE_KEY_TIMESTAMP = 'cached_locations_timestamp';

// Helper to load from localStorage
const loadFromStorage = () => {
    try {
        const locationsStr = localStorage.getItem(STORAGE_KEY_LOCATIONS);
        const stationsStr = localStorage.getItem(STORAGE_KEY_STATIONS);
        const timestampStr = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
        
        if (locationsStr && stationsStr && timestampStr) {
            const timestamp = parseInt(timestampStr, 10);
            const now = Date.now();
            
            // Check if cache is still valid
            if (now - timestamp < CACHE_DURATION) {
                return {
                    locations: JSON.parse(locationsStr),
                    stations: JSON.parse(stationsStr),
                    timestamp,
                };
            }
        }
    } catch (error) {
        console.error('Failed to load cached locations:', error);
    }
    return null;
};

// Helper to save to localStorage
const saveToStorage = (locations: Location[], stations: Station[], timestamp: number) => {
    try {
        localStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
        localStorage.setItem(STORAGE_KEY_STATIONS, JSON.stringify(stations));
        localStorage.setItem(STORAGE_KEY_TIMESTAMP, timestamp.toString());
    } catch (error) {
        console.error('Failed to cache locations:', error);
    }
};

// Helper to clear cache
const clearStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEY_LOCATIONS);
        localStorage.removeItem(STORAGE_KEY_STATIONS);
        localStorage.removeItem(STORAGE_KEY_TIMESTAMP);
    } catch (error) {
        console.error('Failed to clear cached locations:', error);
    }
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage if available
    const cachedData = loadFromStorage();
    
    const [locations, setLocations] = useState<Location[]>(cachedData?.locations || []);
    const [stations, setStations] = useState<Station[]>(cachedData?.stations || []);
    const [loading, setLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(cachedData?.timestamp || null);

    const loadLocations = useCallback(async (forceRefresh = false) => {
        // Check if we have cached data and it's still valid
        const now = Date.now();
        if (!forceRefresh && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
            // Use cached data
            return;
        }

        setLoading(true);
        try {
            const response = await locationService.getLocations();
            if (response.success && Array.isArray(response.data)) {
                setLocations(response.data);

                // Flatten all stations from all locations
                const allStations: Station[] = [];
                response.data.forEach((location) => {
                    if (location.offices && Array.isArray(location.offices)) {
                        allStations.push(...location.offices);
                    }
                });
                setStations(allStations);
                setLastFetchTime(now);
                
                // Save to localStorage
                saveToStorage(response.data, allStations, now);
            }
        } catch (error) {
            console.error('Failed to load locations:', error);
        } finally {
            setLoading(false);
        }
    }, [lastFetchTime]);

    const refreshLocations = useCallback(async () => {
        await loadLocations(true);
    }, [loadLocations]);

    const invalidateCache = useCallback(() => {
        setLastFetchTime(null);
        clearStorage();
    }, []);

    // Load data on mount if cache is expired or doesn't exist
    useEffect(() => {
        const now = Date.now();
        if (!lastFetchTime || (now - lastFetchTime) >= CACHE_DURATION) {
            loadLocations(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <LocationContext.Provider
            value={{
                locations,
                stations,
                loading,
                lastFetchTime,
                refreshLocations,
                invalidateCache,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};

