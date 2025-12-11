/**
 * Standardized TypeScript interfaces for Parcel Management System
 */

export type UserRole = "admin" | "station-manager" | "front-desk" | "call-center" | "rider";

export type ParcelStatus =
    | "registered"
    | "contacted"
    | "ready-for-delivery"
    | "assigned"
    | "picked-up"
    | "out-for-delivery"
    | "delivered"
    | "delivery-failed"
    | "collected";

export type DeliveryPreference = "pickup" | "delivery";

export type PaymentStatus = "paid" | "partial" | "pending";

export interface Station {
    id: string;
    name: string;
    code: string;
    location: string;
    status: "active" | "inactive";
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    stationId: string;
    status: "active" | "disabled";
    lastLogin?: string;
    createdAt: string;
}

export interface Shelf {
    id: string;
    name: string;
    stationId: string;
    parcelCount: number;
    createdBy: string;
    createdAt: string;
}

export interface Rider {
    id: string;
    name: string;
    location: string;
    phone: string;
    stationId: string;
    status: "available" | "busy" | "offline";
    deliveriesCompleted: number;
    rating: number;
    totalEarned: number;
    amountPaid: number;
    outstandingBalance: number;
    paymentStatus: PaymentStatus;
    lastPaymentDate?: string;
}

export interface Parcel {
    id: string;
    stationId: string;

    // Registration data
    recipientName: string;
    recipientPhone: string;
    itemDescription?: string;
    itemValue: number;
    shelfLocation: string;
    registeredDate: string;
    registeredBy: string;

    // Driver/Vehicle info (for bulk entries)
    driverName?: string;
    vehicleNumber?: string;

    // Status
    status: ParcelStatus;

    // Call center data
    customerContacted?: boolean;
    contactedDate?: string;
    contactedBy?: string;
    deliveryPreference?: DeliveryPreference;
    deliveryAddress?: string;
    deliveryFee?: number;
    preferredDeliveryDate?: string;
    callNotes?: string;

    // Assignment data
    assignedRiderId?: string;
    assignedRiderName?: string;
    assignedDate?: string;

    // Delivery tracking
    pickedUpDate?: string;
    outForDeliveryDate?: string;
    deliveredDate?: string;
    deliveryFailedDate?: string;
    failureReason?: string;
    collectedDate?: string;

    // Financial
    amountCollected?: number;
    deliveryFeeCollected?: number;
    itemValueCollected?: number;

    // Audit
    updatedAt: string;
    updatedBy?: string;
}

export interface BulkEntrySession {
    id: string;
    stationId: string;
    driverName: string;
    vehicleNumber: string;
    entryDate: string;
    enteredBy: string;
    parcels: Omit<Parcel, "id" | "stationId" | "registeredDate" | "status" | "updatedAt">[];
}

export interface FinancialSummary {
    stationId?: string; // undefined for system-wide
    totalDeliveryEarnings: number;
    totalItemCollections: number;
    totalDriverPayments: number;
    pendingPayments: number;
    netRevenue: number;
    dateRange?: {
        from: string;
        to: string;
    };
}

export interface DriverFinancial {
    driverId: string;
    driverName: string;
    stationId: string;
    deliveriesCompleted: number;
    totalEarned: number;
    amountPaid: number;
    outstandingBalance: number;
    paymentStatus: PaymentStatus;
    lastPaymentDate?: string;
}

// Status transition configuration
export const STATUS_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
    registered: ["contacted"],
    contacted: ["ready-for-delivery"],
    "ready-for-delivery": ["assigned"],
    assigned: ["picked-up"],
    "picked-up": ["out-for-delivery"],
    "out-for-delivery": ["delivered", "delivery-failed"],
    delivered: [],
    "delivery-failed": ["assigned", "ready-for-delivery"], // Can reassign or retry
    collected: [],
};

// Status display configuration
export const STATUS_CONFIG: Record<
    ParcelStatus,
    { label: string; color: string; bgColor: string }
> = {
    registered: {
        label: "Registered",
        color: "bg-gray-100 text-gray-800",
        bgColor: "bg-gray-50",
    },
    contacted: {
        label: "Customer Contacted",
        color: "bg-blue-100 text-blue-800",
        bgColor: "bg-blue-50",
    },
    "ready-for-delivery": {
        label: "Ready for Delivery",
        color: "bg-yellow-100 text-yellow-800",
        bgColor: "bg-yellow-50",
    },
    assigned: {
        label: "Assigned to Rider",
        color: "bg-purple-100 text-purple-800",
        bgColor: "bg-purple-50",
    },
    "picked-up": {
        label: "Picked Up",
        color: "bg-orange-100 text-orange-800",
        bgColor: "bg-orange-50",
    },
    "out-for-delivery": {
        label: "Out for Delivery",
        color: "bg-indigo-100 text-indigo-800",
        bgColor: "bg-indigo-50",
    },
    delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800",
        bgColor: "bg-green-50",
    },
    "delivery-failed": {
        label: "Delivery Failed",
        color: "bg-red-100 text-red-800",
        bgColor: "bg-red-50",
    },
    collected: {
        label: "Collected",
        color: "bg-green-100 text-green-800",
        bgColor: "bg-green-50",
    },
};

