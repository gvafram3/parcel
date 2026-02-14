import React, { createContext, useContext, useState } from "react";
import authService from "../services/authService";

export type UserRole = "ADMIN" | "MANAGER" | "FRONTDESK" | "RIDER" | "CALLER";

interface Station {
    id: string;
    name: string;
    location: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    stationId?: string; // Optional for admin users
}

interface StationContextType {
    currentStation: Station | null;
    currentUser: User | null;
    setStation: (station: Station | null) => void;
    setUser: (user: User) => void;
    logout: () => void;
    canAccessStation: (stationId: string) => boolean;
    userRole: UserRole | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

// Helper to normalize role
const normalizeRole = (role: string): UserRole => {
    const roleUpper = role?.toUpperCase().trim();
    const validRoles: UserRole[] = ["ADMIN", "MANAGER", "FRONTDESK", "RIDER", "CALLER"];

    // Map old role names to new ones for backward compatibility
    const roleMapping: Record<string, UserRole> = {
        'ADMIN': 'ADMIN',
        'admin': 'ADMIN',
        'MANAGER': 'MANAGER',
        'manager': 'MANAGER',
        'STATION-MANAGER': 'MANAGER',
        'station-manager': 'MANAGER',
        'FRONTDESK': 'FRONTDESK',
        'frontdesk': 'FRONTDESK',
        'FRONT-DESK': 'FRONTDESK',
        'front-desk': 'FRONTDESK',
        'RIDER': 'RIDER',
        'rider': 'RIDER',
        'CALLER': 'CALLER',
        'caller': 'CALLER',
        'CALL-CENTER': 'CALLER',
        'call-center': 'CALLER',
    };

    // Check if role exists in mapping
    if (roleMapping[roleUpper] || roleMapping[role]) {
        return roleMapping[roleUpper] || roleMapping[role];
    }

    // Check if it's already a valid role
    if (validRoles.includes(roleUpper as UserRole)) {
        return roleUpper as UserRole;
    }

    console.warn(`Invalid role "${role}", defaulting to "FRONTDESK"`);
    return "FRONTDESK";
};

// Initialize user from storage synchronously so route persists on refresh
const getInitialUser = (): User | null => {
    try {
        const userData = authService.getUser();
        if (userData) {
            return {
                ...userData,
                role: normalizeRole(userData.role),
            };
        }
    } catch {
        // ignore parse errors
    }
    return null;
};

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);

    const handleSetStation = (station: Station | null) => {
        setCurrentStation(station);
    };

    const handleSetUser = (user: User) => {
        console.log("Setting user with role:", user.role);
        const normalizedUser: User = {
            ...user,
            role: normalizeRole(user.role),
        };
        setCurrentUser(normalizedUser);
    };

    const handleLogout = () => {
        authService.logout();
        setCurrentUser(null);
        setCurrentStation(null);
    };

    const canAccessStation = (stationId: string) => {
        if (!currentUser) return false;
        // Admin can access all stations
        if (currentUser.role === "ADMIN") return true;
        // Others can only access their assigned station
        return currentUser.stationId === stationId;
    };

    const isAdmin = currentUser?.role === "ADMIN";

    return (
        <StationContext.Provider
            value={{
                currentStation,
                currentUser,
                setStation: handleSetStation,
                setUser: handleSetUser,
                logout: handleLogout,
                canAccessStation,
                userRole: currentUser?.role || null,
                isAuthenticated: currentUser !== null,
                isAdmin,
            }}
        >
            {children}
        </StationContext.Provider>
    );
};

export const useStation = () => {
    const context = useContext(StationContext);
    if (context === undefined) {
        throw new Error("useStation must be used within a StationProvider");
    }
    return context;
};
