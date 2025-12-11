import React, { createContext, useContext, useState } from "react";

export type UserRole = "admin" | "station-manager" | "front-desk" | "call-center" | "rider";

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
    stationId: string;
}

interface StationContextType {
    currentStation: Station | null;
    currentUser: User | null;
    setStation: (station: Station) => void;
    setUser: (user: User) => void;
    logout: () => void;
    canAccessStation: (stationId: string) => boolean;
    userRole: UserRole | null;
    isAuthenticated: boolean;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize with null - user must login
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const setStation = (station: Station) => {
        setCurrentStation(station);
    };

    const setUser = (user: User) => {
        setCurrentUser(user);
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentStation(null);
    };

    const canAccessStation = (stationId: string) => {
        if (!currentUser) return false;
        if (currentUser.role === "admin") return true;
        return currentUser.stationId === stationId;
    };

    return (
        <StationContext.Provider
            value={{
                currentStation,
                currentUser,
                setStation,
                setUser,
                logout,
                canAccessStation,
                userRole: currentUser?.role || null,
                isAuthenticated: currentUser !== null,
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
