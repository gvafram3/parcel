import React, { createContext, useContext, useState, useCallback } from "react";
import userService, { ApiUser } from "../services/userService";

interface UserContextType {
    users: ApiUser[];
    loading: boolean;
    lastFetchTime: number | null;
    pagination: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
    refreshUsers: (page?: number, size?: number) => Promise<void>;
    invalidateCache: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION = 5 * 60 * 1000;

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 50,
        totalElements: 0,
        totalPages: 0,
    });

    const loadUsers = useCallback(async (page: number = 0, size: number = 50, forceRefresh = false) => {
        // Check if we have cached data and it's still valid
        const now = Date.now();
        if (!forceRefresh && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION && page === pagination.page && size === pagination.size) {
            // Use cached data if same page and size
            return;
        }

        setLoading(true);
        try {
            const response = await userService.getUsers({ page, size });
            if (response.success && response.data) {
                setUsers(response.data.content);
                setPagination({
                    page: response.data.number,
                    size: response.data.size,
                    totalElements: response.data.totalElements,
                    totalPages: response.data.totalPages,
                });
                setLastFetchTime(now);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    }, [lastFetchTime, pagination.page, pagination.size]);

    const refreshUsers = useCallback(async (page: number = 0, size: number = 50) => {
        await loadUsers(page, size, true);
    }, [loadUsers]);

    const invalidateCache = useCallback(() => {
        setLastFetchTime(null);
    }, []);

    // Removed automatic loading on mount to prevent unnecessary API calls
    // Components that need user data (like UserManagement) should call refreshUsers() on mount

    return (
        <UserContext.Provider
            value={{
                users,
                loading,
                lastFetchTime,
                pagination,
                refreshUsers,
                invalidateCache,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};


