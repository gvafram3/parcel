/**
 * Data Helper Utilities
 * Functions for filtering, validation, formatting, and data manipulation
 */

import { Parcel, ParcelStatus, Station, Shelf, User } from "../types";

/**
 * Phone number validation (Ghana format: +233)
 */
export const validatePhoneNumber = (phone: string): boolean => {
    // Ghana phone format: +233 followed by 9 digits
    const phoneRegex = /^\+233[0-9]{9}$/;
    return phoneRegex.test(phone);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
    // Format: +233 XX XXX XXXX
    if (phone.startsWith("+233") && phone.length === 13) {
        return `${phone.slice(0, 4)} ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
};

/**
 * Generate unique parcel ID
 */
export const generateParcelId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAK-${timestamp}-${random}`;
};

/**
 * Check if shelf can be deleted (no parcels assigned)
 */
export const canDeleteShelf = (shelfName: string, stationId: string, parcels: Parcel[]): boolean => {
    const parcelsOnShelf = parcels.filter(
        (p) => p.shelfLocation === shelfName && p.stationId === stationId
    );
    return parcelsOnShelf.length === 0;
};

/**
 * Get shelf parcel count
 */
export const getShelfParcelCount = (shelfName: string, stationId: string, parcels: Parcel[]): number => {
    return parcels.filter(
        (p) => p.shelfLocation === shelfName && p.stationId === stationId
    ).length;
};

/**
 * Check if status transition is valid
 */
export const isValidStatusTransition = (
    currentStatus: ParcelStatus,
    newStatus: ParcelStatus
): boolean => {
    // Direct transitions from requirements
    const validTransitions: Record<ParcelStatus, ParcelStatus[]> = {
        registered: ["contacted"],
        contacted: ["ready-for-delivery"],
        "ready-for-delivery": ["assigned"],
        assigned: ["picked-up"],
        "picked-up": ["out-for-delivery"],
        "out-for-delivery": ["delivered", "delivery-failed"],
        delivered: [],
        "delivery-failed": ["assigned", "ready-for-delivery"],
        collected: [],
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Calculate total amount to collect from customer
 */
export const calculateTotalAmount = (
    itemValue: number,
    deliveryFee: number,
    deliveryPreference: "pickup" | "delivery"
): number => {
    if (deliveryPreference === "pickup") {
        return itemValue;
    }
    return itemValue + deliveryFee;
};

/**
 * Format currency (GHC)
 */
export const formatCurrency = (amount: number): string => {
    return `GHC ${amount.toFixed(2)}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/**
 * Format date and time for display
 */
export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/**
 * Get status label
 */
export const getStatusLabel = (status: ParcelStatus): string => {
    const labels: Record<ParcelStatus, string> = {
        registered: "Registered",
        contacted: "Customer Contacted",
        "ready-for-delivery": "Ready for Delivery",
        assigned: "Assigned to Rider",
        "picked-up": "Picked Up",
        "out-for-delivery": "Out for Delivery",
        delivered: "Delivered",
        "delivery-failed": "Delivery Failed",
        collected: "Collected",
    };
    return labels[status] || status;
};

/**
 * Search parcels by multiple criteria
 */
export interface ParcelSearchCriteria {
    parcelId?: string;
    recipientName?: string;
    phoneNumber?: string;
    shelfLocation?: string;
    driverName?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: ParcelStatus;
    stationId?: string;
}

export const searchParcels = (parcels: Parcel[], criteria: ParcelSearchCriteria): Parcel[] => {
    let results = [...parcels];
    
    // Filter by station first
    if (criteria.stationId) {
        results = results.filter((p) => p.stationId === criteria.stationId);
    }
    
    // Filter by parcel ID
    if (criteria.parcelId) {
        const searchTerm = criteria.parcelId.toLowerCase();
        results = results.filter((p) => p.id.toLowerCase().includes(searchTerm));
    }
    
    // Filter by recipient name
    if (criteria.recipientName) {
        const searchTerm = criteria.recipientName.toLowerCase();
        results = results.filter((p) =>
            p.recipientName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by phone number
    if (criteria.phoneNumber) {
        const searchTerm = criteria.phoneNumber.replace(/\s+/g, "");
        results = results.filter((p) =>
            p.recipientPhone.replace(/\s+/g, "").includes(searchTerm)
        );
    }
    
    // Filter by shelf location
    if (criteria.shelfLocation) {
        results = results.filter((p) => p.shelfLocation === criteria.shelfLocation);
    }
    
    // Filter by driver name
    if (criteria.driverName) {
        const searchTerm = criteria.driverName.toLowerCase();
        results = results.filter((p) =>
            p.driverName?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by status
    if (criteria.status) {
        results = results.filter((p) => p.status === criteria.status);
    }
    
    // Filter by date range
    if (criteria.dateFrom) {
        const fromDate = new Date(criteria.dateFrom);
        results = results.filter((p) => new Date(p.registeredDate) >= fromDate);
    }
    
    if (criteria.dateTo) {
        const toDate = new Date(criteria.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        results = results.filter((p) => new Date(p.registeredDate) <= toDate);
    }
    
    return results;
};

/**
 * Check if user can access station
 */
export const canAccessStation = (user: User, stationId: string): boolean => {
    if (user.role === "admin") return true;
    return user.stationId === stationId;
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: User): string => {
    return user.name;
};

/**
 * Get station name by ID
 */
export const getStationName = (stationId: string, stations: Station[]): string => {
    const station = stations.find((s) => s.id === stationId);
    return station?.name || stationId;
};

/**
 * Get shelf name by ID
 */
export const getShelfName = (shelfId: string, shelves: Shelf[]): string => {
    const shelf = shelves.find((s) => s.id === shelfId);
    return shelf?.name || shelfId;
};

/**
 * Calculate days since date
 */
export const daysSince = (dateString: string): number => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Get status color class
 */
export const getStatusColor = (status: ParcelStatus): string => {
    const colors: Record<ParcelStatus, string> = {
        registered: "bg-gray-100 text-gray-800",
        contacted: "bg-blue-100 text-blue-800",
        "ready-for-delivery": "bg-yellow-100 text-yellow-800",
        assigned: "bg-purple-100 text-purple-800",
        "picked-up": "bg-orange-100 text-orange-800",
        "out-for-delivery": "bg-indigo-100 text-indigo-800",
        delivered: "bg-green-100 text-green-800",
        "delivery-failed": "bg-red-100 text-red-800",
        collected: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
};

