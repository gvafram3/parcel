import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import frontdeskService, { ParcelResponse, ParcelSearchFilters, PageableRequest } from "../services/frontdeskService";
import authService from "../services/authService";

/** Prefetched next-page data for instant "Next" navigation */
interface NextPageCache {
    page: number;
    size: number;
    filtersKey: string;
    parcels: ParcelResponse[];
    totalElements: number;
    totalPages: number;
}

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
    /** Start loading the next page in the background so "Next" is instant. Safe to call repeatedly. */
    prefetchNextPageIfPossible: () => void;
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
    const [nextPageCache, setNextPageCache] = useState<NextPageCache | null>(null);
    const prefetchAbortRef = useRef<AbortController | null>(null);

    /** Prefetch the next page in the background (no loading UI). */
    const prefetchNextPage = useCallback(async (filters: ParcelSearchFilters, page: number, size: number) => {
        prefetchAbortRef.current?.abort();
        prefetchAbortRef.current = new AbortController();
        const signal = prefetchAbortRef.current.signal;
        try {
            const response = await frontdeskService.searchParcels(filters, { page, size });
            if (signal.aborted) return;
            if (response.success && response.data) {
                let fetchedParcels = response.data.content || [];
                const userData = authService.getUser();
                const userRole = (userData as any)?.role;
                const userOfficeId = (userData as any)?.office?.id;
                if (userRole !== "ADMIN" && userOfficeId) {
                    fetchedParcels = fetchedParcels.filter((p: ParcelResponse) => {
                        const parcelOfficeId = typeof p.officeId === "string" ? p.officeId : p.officeId?.id;
                        return parcelOfficeId === userOfficeId;
                    });
                }
                setNextPageCache({
                    page,
                    size,
                    filtersKey: JSON.stringify(filters),
                    parcels: fetchedParcels,
                    totalElements: response.data.totalElements ?? 0,
                    totalPages: response.data.totalPages ?? 0,
                });
            }
        } catch (err) {
            if (signal.aborted) return;
            // Prefetch failure is silent; next "Next" click will fetch normally
        }
    }, []);

    const loadParcels = useCallback(async (
        filters: ParcelSearchFilters = {},
        page: number = 0,
        size: number = 1000,
        forceRefresh = false,
        showLoading = true
    ) => {
        const now = Date.now();
        const filtersKey = JSON.stringify(filters);

        // Use prefetched next page if we're navigating to it (instant)
        if (
            !forceRefresh &&
            nextPageCache &&
            nextPageCache.page === page &&
            nextPageCache.size === size &&
            nextPageCache.filtersKey === filtersKey
        ) {
            setParcels(nextPageCache.parcels);
            setPagination({
                page: nextPageCache.page,
                size: nextPageCache.size,
                totalElements: nextPageCache.totalElements,
                totalPages: nextPageCache.totalPages,
            });
            setCurrentFilters(filters);
            setCurrentPageable({ page, size });
            setLastFetchTime(now);
            setNextPageCache(null);
            // Prefetch the page after this one
            if (page + 1 < nextPageCache.totalPages) {
                prefetchNextPage(filters, page + 1, size);
            }
            return;
        }

        // Check if we have cached data for this exact page and it's still valid
        const filtersMatch = filtersKey === JSON.stringify(currentFilters);
        const pageableMatch = page === currentPageable.page && size === currentPageable.size;
        if (
            !forceRefresh &&
            lastFetchTime &&
            (now - lastFetchTime) < CACHE_DURATION &&
            pageableMatch &&
            filtersMatch &&
            parcels.length > 0
        ) {
            // Still prefetch next page in background so "Next" feels instant
            const hasNextPage = pagination.totalPages > 0 && page + 1 < pagination.totalPages;
            const nextNotCached = !nextPageCache || nextPageCache.page !== page + 1 || nextPageCache.filtersKey !== filtersKey;
            if (hasNextPage && nextNotCached) {
                prefetchNextPage(filters, page + 1, size);
            }
            return;
        }

        if (showLoading) {
            setLoading(true);
        } else {
            setBackgroundLoading(true);
        }

        try {
            const response = await frontdeskService.searchParcels(filters, { page, size });

            if (response.success && response.data) {
                let fetchedParcels = response.data.content || [];

                const userData = authService.getUser();
                const userRole = (userData as any)?.role;
                const userOfficeId = (userData as any)?.office?.id;
                if (userRole !== "ADMIN" && userOfficeId) {
                    fetchedParcels = fetchedParcels.filter((p: ParcelResponse) => {
                        const parcelOfficeId = typeof p.officeId === "string" ? p.officeId : p.officeId?.id;
                        return parcelOfficeId === userOfficeId;
                    });
                }

                const totalPages = response.data.totalPages ?? 0;
                const totalElements = response.data.totalElements ?? 0;

                setParcels(fetchedParcels);
                setPagination({
                    page: response.data.number ?? page,
                    size: response.data.size ?? size,
                    totalElements,
                    totalPages,
                });
                setCurrentFilters(filters);
                setCurrentPageable({ page, size });
                setLastFetchTime(now);

                // Prefetch next page as soon as this load is done so "Next" feels instant
                const hasNextByTotal = totalPages > 0 && page + 1 < totalPages;
                const mightHaveMore = fetchedParcels.length >= size; // full page => likely more
                if (hasNextByTotal || mightHaveMore) {
                    prefetchNextPage(filters, page + 1, size);
                }
            }
        } catch (error) {
            console.error("Failed to load parcels:", error);
        } finally {
            if (showLoading) {
                setLoading(false);
            } else {
                setBackgroundLoading(false);
            }
        }
    }, [lastFetchTime, currentFilters, currentPageable, parcels.length, nextPageCache, prefetchNextPage]);

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
        setNextPageCache(null);
        prefetchAbortRef.current?.abort();
    }, []);

    /** Start prefetching the next page in the background when current page has loaded. Call from UI when loading is done. */
    const prefetchNextPageIfPossible = useCallback(() => {
        const nextPage = pagination.page + 1;
        if (pagination.totalPages <= 0 || nextPage >= pagination.totalPages) return;
        if (nextPageCache?.page === nextPage && nextPageCache.filtersKey === JSON.stringify(currentFilters)) return;
        prefetchNextPage(currentFilters, nextPage, pagination.size);
    }, [pagination.page, pagination.size, pagination.totalPages, currentFilters, nextPageCache, prefetchNextPage]);

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
                prefetchNextPageIfPossible,
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

