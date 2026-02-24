/**
 * Data Helper Utilities
 * Functions for filtering, validation, formatting, and data manipulation
 */

import { Parcel, ParcelStatus, Station, Shelf, User } from "../types";

/**
 * Normalize phone number: accepts 0XXXXXXXXX or XXXXXXXXX, returns +233XXXXXXXXX
 * Removes leading 0 if present and prepends +233
 * If already in +233 format, returns as-is
 */
export const normalizePhoneNumber = (phone: string): string => {
    // If already in +233 format, return as-is (but ensure it's valid)
    if (phone.startsWith("+233")) {
        const digits = phone.substring(4).replace(/\D/g, "");
        const limited = digits.substring(0, 9);
        return "+233" + limited;
    }
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");
    
    // If starts with 0, remove it
    const cleaned = digits.startsWith("0") ? digits.substring(1) : digits;
    
    // Limit to 9 digits (Ghana phone number format)
    const limited = cleaned.substring(0, 9);
    
    // Return with +233 prefix
    return "+233" + limited;
};

/**
 * Phone number validation (Ghana format: +233, 0XXXXXXXXX, or XXXXXXXXX)
 * Normalizes the phone number first, then validates
 */
export const validatePhoneNumber = (phone: string): boolean => {
    if (!phone || !phone.trim()) return false;
    
    // Normalize the phone number first
    const normalized = normalizePhoneNumber(phone);
    
    // Validate normalized format: +233 followed by 9 digits
    const phoneRegex = /^\+233[0-9]{9}$/;
    return phoneRegex.test(normalized);
};

/**
 * Normalize phone number for search - extracts digits only and normalizes to 9-digit format
 * Handles +233XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX formats
 * Returns the 9 digits after country code (233) or leading zero
 */
export const normalizePhoneForSearch = (phone: string): string => {
    if (!phone) return "";
    // Remove all non-digits (spaces, +, etc.)
    const digits = phone.replace(/\D/g, "");
    
    // If starts with 233, extract the 9 digits after it
    if (digits.startsWith("233") && digits.length >= 12) {
        return digits.substring(3, 12); // Get exactly 9 digits after 233
    }
    // If starts with 233 but shorter, still extract what we can
    if (digits.startsWith("233")) {
        return digits.substring(3);
    }
    // If starts with 0, remove it and get up to 9 digits
    if (digits.startsWith("0") && digits.length >= 10) {
        return digits.substring(1, 10); // Get exactly 9 digits after 0
    }
    // If starts with 0 but shorter, still extract what we can
    if (digits.startsWith("0")) {
        return digits.substring(1);
    }
    // If it's exactly 9 digits, return as is
    if (digits.length === 9) {
        return digits;
    }
    // If longer than 9, take the last 9 digits
    if (digits.length > 9) {
        return digits.substring(digits.length - 9);
    }
    // Otherwise return all digits (partial match for search)
    return digits;
};

/**
 * Check if phone number matches search term (handles various formats)
 * Supports: +233 54 182 4496, +233541824496, +233541 824496, 0541824496, etc.
 */
export const phoneMatchesSearch = (phone: string | undefined, searchTerm: string): boolean => {
    if (!phone || !searchTerm) return false;
    
    // Normalize both to digits only (removing spaces, +, etc.)
    const phoneDigits = phone.replace(/\D/g, "");
    const searchDigits = searchTerm.replace(/\D/g, "");
    
    if (!phoneDigits || !searchDigits) return false;
    
    // Special case: if search is just "233" or starts with "233", match any +233 number
    if (searchDigits === "233" || (searchDigits.startsWith("233") && searchDigits.length <= 3)) {
        return phoneDigits.startsWith("233");
    }
    
    // Normalize both to the 9-digit format (after country code/leading zero)
    const normalizedPhone = normalizePhoneForSearch(phone);
    const normalizedSearch = normalizePhoneForSearch(searchTerm);
    
    // If normalized search is empty (e.g., user searched just "+233"), 
    // check if phone starts with 233
    if (!normalizedSearch && searchDigits.startsWith("233")) {
        return phoneDigits.startsWith("233");
    }
    
    // For partial matches, check if search term is contained in phone or vice versa
    if (normalizedSearch.length <= normalizedPhone.length) {
        return normalizedPhone.includes(normalizedSearch);
    } else {
        return normalizedSearch.includes(normalizedPhone);
    }
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
    if (user.role === "ADMIN") return true;
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

