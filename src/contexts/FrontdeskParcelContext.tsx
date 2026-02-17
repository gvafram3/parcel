import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import frontdeskService, { ParcelResponse, ParcelSearchFilters, PageableRequest } from "../services/frontdeskService";
import authService from "../services/authService";

interface FrontdeskParcelContextType {
    parcels: ParcelResponse[];
    loading: boolean;
    backgroundLoading: boolean; // For background refresh without showing loading UI
    lastFetchTime: number | null;
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
    currentFilters: ParcelSearchFilters;
    currentPageable: PageableRequest;
    loadParcelsIfNeeded: (filters?: ParcelSearchFilters, page?: number, size?: number, showLoading?: boolean) => Promise<void>;
    refreshParcels: (filters?: ParcelSearchFilters, page?: number, size?: number) => Promise<void>;
    invalidateCache: () => void;
}

const FrontdeskParcelContext = createContext<FrontdeskParcelContextType | undefined>(undefined);

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION = 5 * 60 * 1000;

export const FrontdeskParcelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [parcels, setParcels] = useState<ParcelResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 1000,
        totalElements: 0,
        totalPages: 0,
    });
    const [currentFilters, setCurrentFilters] = useState<ParcelSearchFilters>({});
    const [currentPageable, setCurrentPageable] = useState<PageableRequest>({ page: 0, size: 1000 });

    const loadParcels = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 1000,
        forceRefresh = false,
        showLoading = true
    ) => {
        // Check if we have cached data and it's still valid
        const now = Date.now();
        const filtersMatch = JSON.stringify(filters) === JSON.stringify(currentFilters);
        const pageableMatch = page === currentPageable.page && size === currentPageable.size;
        
        if (!forceRefresh && 
            lastFetchTime && 
            (now - lastFetchTime) < CACHE_DURATION && 
            pageableMatch &&
            filtersMatch &&
            parcels.length > 0) {
            // Use cached data - no need to fetch
            return;
        }

        // Set loading state based on showLoading flag
        if (showLoading) {
            setLoading(true);
        } else {
            setBackgroundLoading(true);
        }

        try {
            const response = await frontdeskService.searchParcels(filters, { page, size });
            
            if (response.success && response.data) {
                let fetchedParcels = response.data.content || [];
                
                // Filter by office if not admin (get from user data)
                const userData = authService.getUser();
                const userRole = (userData as any)?.role;
                const userOfficeId = (userData as any)?.office?.id;
                
                if (userRole !== "ADMIN" && userOfficeId) {
                    fetchedParcels = fetchedParcels.filter((p: ParcelResponse) => {
                        const parcelOfficeId = typeof p.officeId === 'string' ? p.officeId : p.officeId?.id;
                        return parcelOfficeId === userOfficeId;
                    });
                }
                
                setParcels(fetchedParcels);
                setPagination({
                    page: response.data.number || 0,
                    size: response.data.size || size,
                    totalElements: response.data.totalElements || 0,
                    totalPages: response.data.totalPages || 0,
                });
                setCurrentFilters(filters);
                setCurrentPageable({ page, size });
                setLastFetchTime(now);
            }
        } catch (error) {
            console.error('Failed to load parcels:', error);
        } finally {
            if (showLoading) {
                setLoading(false);
            } else {
                setBackgroundLoading(false);
            }
        }
    }, [lastFetchTime, currentFilters, currentPageable, parcels.length]);

    const loadParcelsIfNeeded = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 1000,
        showLoading = true
    ) => {
        await loadParcels(filters, page, size, false, showLoading);
    }, [loadParcels]);

    const refreshParcels = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 1000
    ) => {
        await loadParcels(filters, page, size, true, true);
    }, [loadParcels]);

    const invalidateCache = useCallback(() => {
        setLastFetchTime(null);
    }, []);

    // Background refresh on mount if cache exists but might be stale
    useEffect(() => {
        const now = Date.now();
        if (lastFetchTime && (now - lastFetchTime) < CACHE_DURATION && parcels.length > 0) {
            // Cache is still valid - no need to fetch, data is already available
            // Optionally refresh in background for next time (silently)
            setTimeout(() => {
                loadParcels(currentFilters, currentPageable.page, currentPageable.size, false, false);
            }, 1000); // Small delay to not interfere with initial render
        } else if (!lastFetchTime || (now - lastFetchTime) >= CACHE_DURATION) {
            // No cache or expired - load with loading UI
            loadParcels({}, 0, 1000, false, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <FrontdeskParcelContext.Provider
            value={{
                parcels,
                loading,
                backgroundLoading,
                lastFetchTime,
                pagination,
                currentFilters,
                currentPageable,
                loadParcelsIfNeeded,
                refreshParcels,
                invalidateCache,
            }}
        >
            {children}
        </FrontdeskParcelContext.Provider>
    );
};

export const useFrontdeskParcel = () => {
    const context = useContext(FrontdeskParcelContext);
    if (context === undefined) {
        throw new Error("useFrontdeskParcel must be used within a FrontdeskParcelProvider");
    }
    return context;
};

