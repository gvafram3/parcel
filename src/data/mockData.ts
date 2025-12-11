/**
 * Centralized Mock Data Store
 * This file contains all sample data for the Parcel Management System
 * In production, this will be replaced with API calls
 */

import {
    Station,
    User,
    Shelf,
    Rider,
    Parcel,
    FinancialSummary,
    DriverFinancial,
} from "../types";

// ============================================================================
// STATIONS
// ============================================================================
export let mockStations: Station[] = [
    {
        id: "STATION-001",
        name: "Accra Central Station",
        code: "ACC-001",
        location: "Accra, Ghana",
        status: "active",
        createdAt: "2024-01-01",
    },
    {
        id: "STATION-002",
        name: "Kumasi Hub",
        code: "KUM-001",
        location: "Kumasi, Ghana",
        status: "active",
        createdAt: "2024-01-05",
    },
    {
        id: "STATION-003",
        name: "Tema Port Station",
        code: "TEM-001",
        location: "Tema, Ghana",
        status: "active",
        createdAt: "2024-01-10",
    },
    {
        id: "STATION-004",
        name: "Takoradi West",
        code: "TAK-001",
        location: "Takoradi, Ghana",
        status: "active",
        createdAt: "2024-01-12",
    },
];

// ============================================================================
// USERS
// ============================================================================
export let mockUsers: User[] = [
    // Admin
    {
        id: "USER-ADMIN-001",
        name: "System Administrator",
        email: "admin@parcel.com",
        phone: "+233 555 000 001",
        role: "admin",
        stationId: "STATION-001", // Admin can access all, but assigned to main station
        status: "active",
        lastLogin: "2024-01-20 14:30",
        createdAt: "2024-01-01",
    },
    
    // Station Managers
    {
        id: "USER-SM-001",
        name: "Kwame Asante",
        email: "kwame@parcel.com",
        phone: "+233 555 100 001",
        role: "station-manager",
        stationId: "STATION-001",
        status: "active",
        lastLogin: "2024-01-20 10:15",
        createdAt: "2024-01-02",
    },
    {
        id: "USER-SM-002",
        name: "Ama Mensah",
        email: "ama@parcel.com",
        phone: "+233 555 100 002",
        role: "station-manager",
        stationId: "STATION-002",
        status: "active",
        lastLogin: "2024-01-19 16:45",
        createdAt: "2024-01-06",
    },
    
    // Front Desk Staff
    {
        id: "USER-FD-001",
        name: "Adams Godfred",
        email: "adams@parcel.com",
        phone: "+233 555 200 001",
        role: "front-desk",
        stationId: "STATION-001",
        status: "active",
        lastLogin: "2024-01-20 08:00",
        createdAt: "2024-01-02",
    },
    {
        id: "USER-FD-002",
        name: "John Kofi",
        email: "john@parcel.com",
        phone: "+233 555 200 002",
        role: "front-desk",
        stationId: "STATION-001",
        status: "active",
        lastLogin: "2024-01-20 09:30",
        createdAt: "2024-01-03",
    },
    {
        id: "USER-FD-003",
        name: "Mary Osei",
        email: "mary@parcel.com",
        phone: "+233 555 200 003",
        role: "front-desk",
        stationId: "STATION-002",
        status: "active",
        lastLogin: "2024-01-19 15:20",
        createdAt: "2024-01-07",
    },
    
    // Call Center Staff
    {
        id: "USER-CC-001",
        name: "Grace Adjei",
        email: "grace@parcel.com",
        phone: "+233 555 300 001",
        role: "call-center",
        stationId: "STATION-001",
        status: "active",
        lastLogin: "2024-01-20 11:00",
        createdAt: "2024-01-02",
    },
    {
        id: "USER-CC-002",
        name: "Kofi Boateng",
        email: "kofi@parcel.com",
        phone: "+233 555 300 002",
        role: "call-center",
        stationId: "STATION-002",
        status: "active",
        lastLogin: "2024-01-19 14:15",
        createdAt: "2024-01-07",
    },
    
    // Riders
    {
        id: "USER-RIDER-001",
        name: "John Mensah",
        email: "john.mensah@parcel.com",
        phone: "+233 555 400 001",
        role: "rider",
        stationId: "STATION-001",
        status: "active",
        lastLogin: "2024-01-20 07:30",
        createdAt: "2024-01-03",
    },
    {
        id: "USER-RIDER-002",
        name: "Kwame Asante",
        email: "kwame.rider@parcel.com",
        phone: "+233 555 400 002",
        role: "rider",
        stationId: "STATION-001",
        status: "active",
        lastLogin: "2024-01-20 08:00",
        createdAt: "2024-01-03",
    },
    {
        id: "USER-RIDER-003",
        name: "Ama Kofi",
        email: "ama.rider@parcel.com",
        phone: "+233 555 400 003",
        role: "rider",
        stationId: "STATION-002",
        status: "active",
        lastLogin: "2024-01-19 16:00",
        createdAt: "2024-01-08",
    },
];

// ============================================================================
// SHELVES
// ============================================================================
export const mockShelves: Shelf[] = [
    // Station 001 - Accra Central
    {
        id: "SHELF-001",
        name: "A1",
        stationId: "STATION-001",
        parcelCount: 5,
        createdBy: "USER-SM-001",
        createdAt: "2024-01-15",
    },
    {
        id: "SHELF-002",
        name: "A2",
        stationId: "STATION-001",
        parcelCount: 3,
        createdBy: "USER-SM-001",
        createdAt: "2024-01-15",
    },
    {
        id: "SHELF-003",
        name: "B1",
        stationId: "STATION-001",
        parcelCount: 8,
        createdBy: "USER-SM-001",
        createdAt: "2024-01-16",
    },
    {
        id: "SHELF-004",
        name: "B2",
        stationId: "STATION-001",
        parcelCount: 2,
        createdBy: "USER-SM-001",
        createdAt: "2024-01-16",
    },
    {
        id: "SHELF-005",
        name: "Ground-Left",
        stationId: "STATION-001",
        parcelCount: 0,
        createdBy: "USER-SM-001",
        createdAt: "2024-01-17",
    },
    
    // Station 002 - Kumasi Hub
    {
        id: "SHELF-006",
        name: "A1",
        stationId: "STATION-002",
        parcelCount: 4,
        createdBy: "USER-SM-002",
        createdAt: "2024-01-10",
    },
    {
        id: "SHELF-007",
        name: "A2",
        stationId: "STATION-002",
        parcelCount: 6,
        createdBy: "USER-SM-002",
        createdAt: "2024-01-10",
    },
    {
        id: "SHELF-008",
        name: "B1",
        stationId: "STATION-002",
        parcelCount: 1,
        createdBy: "USER-SM-002",
        createdAt: "2024-01-11",
    },
];

// ============================================================================
// RIDERS/DRIVERS
// ============================================================================
export const mockRiders: Rider[] = [
    {
        id: "USER-RIDER-001",
        name: "John Mensah",
        phone: "+233 555 400 001",
        stationId: "STATION-001",
        status: "available",
        deliveriesCompleted: 24,
        rating: 4.8,
        totalEarned: 1200.0,
        amountPaid: 1200.0,
        outstandingBalance: 0.0,
        paymentStatus: "paid",
        lastPaymentDate: "2024-01-18",
    },
    {
        id: "USER-RIDER-002",
        name: "Kwame Asante",
        phone: "+233 555 400 002",
        stationId: "STATION-001",
        status: "available",
        deliveriesCompleted: 18,
        rating: 4.9,
        totalEarned: 950.0,
        amountPaid: 650.0,
        outstandingBalance: 300.0,
        paymentStatus: "partial",
        lastPaymentDate: "2024-01-15",
    },
    {
        id: "USER-RIDER-003",
        name: "Ama Kofi",
        phone: "+233 555 400 003",
        stationId: "STATION-002",
        status: "busy",
        deliveriesCompleted: 15,
        rating: 4.7,
        totalEarned: 850.0,
        amountPaid: 0.0,
        outstandingBalance: 850.0,
        paymentStatus: "pending",
    },
    {
        id: "USER-RIDER-004",
        name: "Kofi Boateng",
        phone: "+233 555 400 004",
        stationId: "STATION-001",
        status: "available",
        deliveriesCompleted: 20,
        rating: 4.6,
        totalEarned: 1100.0,
        amountPaid: 1100.0,
        outstandingBalance: 0.0,
        paymentStatus: "paid",
        lastPaymentDate: "2024-01-19",
    },
];

// ============================================================================
// PARCELS
// ============================================================================
export let mockParcels: Parcel[] = [
    // Station 001 - Accra Central
    {
        id: "PAK-001",
        stationId: "STATION-001",
        recipientName: "John Smith",
        recipientPhone: "+233 555 123 456",
        itemDescription: "Electronics Package",
        itemValue: 500.0,
        shelfLocation: "A1",
        registeredDate: "2024-01-15T08:30:00",
        registeredBy: "USER-FD-001",
        driverName: "John Mensah",
        vehicleNumber: "GR-123-24",
        status: "delivered",
        customerContacted: true,
        contactedDate: "2024-01-15T10:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "45 Main Street, Accra",
        deliveryFee: 15.0,
        assignedRiderId: "USER-RIDER-001",
        assignedRiderName: "John Mensah",
        assignedDate: "2024-01-15T11:00:00",
        pickedUpDate: "2024-01-15T11:30:00",
        outForDeliveryDate: "2024-01-15T12:00:00",
        deliveredDate: "2024-01-15T14:30:00",
        amountCollected: 515.0,
        deliveryFeeCollected: 15.0,
        itemValueCollected: 500.0,
        updatedAt: "2024-01-15T14:30:00",
        updatedBy: "USER-RIDER-001",
    },
    {
        id: "PAK-002",
        stationId: "STATION-001",
        recipientName: "Jane Doe",
        recipientPhone: "+233 555 234 567",
        itemDescription: "Documents",
        itemValue: 0.0,
        shelfLocation: "B2",
        registeredDate: "2024-01-16T09:15:00",
        registeredBy: "USER-FD-001",
        driverName: "Kwame Asante",
        vehicleNumber: "GR-456-24",
        status: "out-for-delivery",
        customerContacted: true,
        contactedDate: "2024-01-16T10:30:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "78 Market Circle, Kumasi",
        deliveryFee: 20.0,
        assignedRiderId: "USER-RIDER-002",
        assignedRiderName: "Kwame Asante",
        assignedDate: "2024-01-16T11:00:00",
        pickedUpDate: "2024-01-16T11:45:00",
        outForDeliveryDate: "2024-01-16T12:15:00",
        updatedAt: "2024-01-16T12:15:00",
        updatedBy: "USER-RIDER-002",
    },
    {
        id: "PAK-003",
        stationId: "STATION-001",
        recipientName: "Bob Wilson",
        recipientPhone: "+233 555 345 678",
        itemDescription: "Clothing",
        itemValue: 150.0,
        shelfLocation: "C1",
        registeredDate: "2024-01-17T08:00:00",
        registeredBy: "USER-FD-002",
        status: "ready-for-delivery",
        customerContacted: true,
        contactedDate: "2024-01-17T10:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "12 Airport Road, Tema",
        deliveryFee: 15.0,
        updatedAt: "2024-01-17T10:00:00",
        updatedBy: "USER-CC-001",
    },
    {
        id: "PAK-004",
        stationId: "STATION-001",
        recipientName: "Alice Johnson",
        recipientPhone: "+233 555 456 789",
        itemDescription: "Books",
        itemValue: 75.0,
        shelfLocation: "A2",
        registeredDate: "2024-01-18T09:30:00",
        registeredBy: "USER-FD-001",
        status: "contacted",
        customerContacted: true,
        contactedDate: "2024-01-18T11:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "pickup",
        updatedAt: "2024-01-18T11:00:00",
        updatedBy: "USER-CC-001",
    },
    {
        id: "PAK-005",
        stationId: "STATION-001",
        recipientName: "Charlie Brown",
        recipientPhone: "+233 555 567 890",
        itemDescription: "Food Items",
        itemValue: 200.0,
        shelfLocation: "B1",
        registeredDate: "2024-01-19T08:45:00",
        registeredBy: "USER-FD-001",
        driverName: "John Mensah",
        vehicleNumber: "GR-123-24",
        status: "registered",
        updatedAt: "2024-01-19T08:45:00",
        updatedBy: "USER-FD-001",
    },
    {
        id: "PAK-006",
        stationId: "STATION-001",
        recipientName: "Diana Prince",
        recipientPhone: "+233 555 678 901",
        itemDescription: "Cosmetics",
        itemValue: 120.0,
        shelfLocation: "C2",
        registeredDate: "2024-01-20T09:00:00",
        registeredBy: "USER-FD-002",
        status: "assigned",
        customerContacted: true,
        contactedDate: "2024-01-20T10:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "34 Tower Road, Cape Coast",
        deliveryFee: 25.0,
        assignedRiderId: "USER-RIDER-004",
        assignedRiderName: "Kofi Boateng",
        assignedDate: "2024-01-20T11:00:00",
        updatedAt: "2024-01-20T11:00:00",
        updatedBy: "USER-SM-001",
    },
    
    // Station 002 - Kumasi Hub
    {
        id: "PAK-007",
        stationId: "STATION-002",
        recipientName: "Michael Osei",
        recipientPhone: "+233 555 789 012",
        itemDescription: "Electronics",
        itemValue: 800.0,
        shelfLocation: "A1",
        registeredDate: "2024-01-16T10:00:00",
        registeredBy: "USER-FD-003",
        status: "delivered",
        customerContacted: true,
        contactedDate: "2024-01-16T11:00:00",
        contactedBy: "USER-CC-002",
        deliveryPreference: "delivery",
        deliveryAddress: "56 High Street, Kumasi",
        deliveryFee: 18.0,
        assignedRiderId: "USER-RIDER-003",
        assignedRiderName: "Ama Kofi",
        assignedDate: "2024-01-16T12:00:00",
        pickedUpDate: "2024-01-16T12:30:00",
        outForDeliveryDate: "2024-01-16T13:00:00",
        deliveredDate: "2024-01-16T15:00:00",
        amountCollected: 818.0,
        deliveryFeeCollected: 18.0,
        itemValueCollected: 800.0,
        updatedAt: "2024-01-16T15:00:00",
        updatedBy: "USER-RIDER-003",
    },
    {
        id: "PAK-008",
        stationId: "STATION-002",
        recipientName: "Sarah Adjei",
        recipientPhone: "+233 555 890 123",
        itemDescription: "Clothing",
        itemValue: 250.0,
        shelfLocation: "A2",
        registeredDate: "2024-01-17T09:00:00",
        registeredBy: "USER-FD-003",
        status: "ready-for-delivery",
        customerContacted: true,
        contactedDate: "2024-01-17T11:00:00",
        contactedBy: "USER-CC-002",
        deliveryPreference: "delivery",
        deliveryAddress: "90 Independence Ave, Kumasi",
        deliveryFee: 15.0,
        updatedAt: "2024-01-17T11:00:00",
        updatedBy: "USER-CC-002",
    },
    {
        id: "PAK-009",
        stationId: "STATION-001",
        recipientName: "Emmanuel Ofori",
        recipientPhone: "+233 555 901 234",
        itemDescription: "Mobile Phone",
        itemValue: 1200.0,
        shelfLocation: "B1",
        registeredDate: "2024-01-18T10:00:00",
        registeredBy: "USER-FD-001",
        driverName: "Kofi Boateng",
        vehicleNumber: "GR-789-24",
        status: "delivered",
        customerContacted: true,
        contactedDate: "2024-01-18T11:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "23 Ring Road, Accra",
        deliveryFee: 20.0,
        assignedRiderId: "USER-RIDER-004",
        assignedRiderName: "Kofi Boateng",
        assignedDate: "2024-01-18T12:00:00",
        pickedUpDate: "2024-01-18T12:30:00",
        outForDeliveryDate: "2024-01-18T13:00:00",
        deliveredDate: "2024-01-18T15:30:00",
        amountCollected: 1220.0,
        deliveryFeeCollected: 20.0,
        itemValueCollected: 1200.0,
        updatedAt: "2024-01-18T15:30:00",
        updatedBy: "USER-RIDER-004",
    },
    {
        id: "PAK-010",
        stationId: "STATION-001",
        recipientName: "Patricia Owusu",
        recipientPhone: "+233 555 012 345",
        itemDescription: "Laptop",
        itemValue: 2500.0,
        shelfLocation: "A1",
        registeredDate: "2024-01-19T08:00:00",
        registeredBy: "USER-FD-002",
        status: "picked-up",
        customerContacted: true,
        contactedDate: "2024-01-19T09:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "67 Cantonments Road, Accra",
        deliveryFee: 25.0,
        assignedRiderId: "USER-RIDER-001",
        assignedRiderName: "John Mensah",
        assignedDate: "2024-01-19T10:00:00",
        pickedUpDate: "2024-01-19T10:45:00",
        updatedAt: "2024-01-19T10:45:00",
        updatedBy: "USER-RIDER-001",
    },
    {
        id: "PAK-011",
        stationId: "STATION-001",
        recipientName: "David Ampofo",
        recipientPhone: "+233 555 123 456",
        itemDescription: "Shoes",
        itemValue: 80.0,
        shelfLocation: "C1",
        registeredDate: "2024-01-19T09:30:00",
        registeredBy: "USER-FD-001",
        status: "registered",
        updatedAt: "2024-01-19T09:30:00",
        updatedBy: "USER-FD-001",
    },
    {
        id: "PAK-012",
        stationId: "STATION-001",
        recipientName: "Gloria Mensah",
        recipientPhone: "+233 555 234 567",
        itemDescription: "Perfume",
        itemValue: 95.0,
        shelfLocation: "A2",
        registeredDate: "2024-01-19T11:00:00",
        registeredBy: "USER-FD-001",
        driverName: "John Mensah",
        vehicleNumber: "GR-123-24",
        status: "contacted",
        customerContacted: true,
        contactedDate: "2024-01-19T12:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "pickup",
        updatedAt: "2024-01-19T12:00:00",
        updatedBy: "USER-CC-001",
    },
    {
        id: "PAK-013",
        stationId: "STATION-002",
        recipientName: "Richard Asante",
        recipientPhone: "+233 555 345 678",
        itemDescription: "Tablet",
        itemValue: 600.0,
        shelfLocation: "B1",
        registeredDate: "2024-01-18T08:30:00",
        registeredBy: "USER-FD-003",
        status: "delivered",
        customerContacted: true,
        contactedDate: "2024-01-18T09:30:00",
        contactedBy: "USER-CC-002",
        deliveryPreference: "delivery",
        deliveryAddress: "45 Adum Street, Kumasi",
        deliveryFee: 18.0,
        assignedRiderId: "USER-RIDER-003",
        assignedRiderName: "Ama Kofi",
        assignedDate: "2024-01-18T10:00:00",
        pickedUpDate: "2024-01-18T10:30:00",
        outForDeliveryDate: "2024-01-18T11:00:00",
        deliveredDate: "2024-01-18T13:00:00",
        amountCollected: 618.0,
        deliveryFeeCollected: 18.0,
        itemValueCollected: 600.0,
        updatedAt: "2024-01-18T13:00:00",
        updatedBy: "USER-RIDER-003",
    },
    {
        id: "PAK-014",
        stationId: "STATION-002",
        recipientName: "Cynthia Boateng",
        recipientPhone: "+233 555 456 789",
        itemDescription: "Jewelry",
        itemValue: 350.0,
        shelfLocation: "A1",
        registeredDate: "2024-01-19T09:00:00",
        registeredBy: "USER-FD-003",
        status: "assigned",
        customerContacted: true,
        contactedDate: "2024-01-19T10:00:00",
        contactedBy: "USER-CC-002",
        deliveryPreference: "delivery",
        deliveryAddress: "12 Kejetia Market, Kumasi",
        deliveryFee: 15.0,
        assignedRiderId: "USER-RIDER-003",
        assignedRiderName: "Ama Kofi",
        assignedDate: "2024-01-19T11:00:00",
        updatedAt: "2024-01-19T11:00:00",
        updatedBy: "USER-SM-002",
    },
    {
        id: "PAK-015",
        stationId: "STATION-001",
        recipientName: "Franklin Tetteh",
        recipientPhone: "+233 555 567 890",
        itemDescription: "Camera",
        itemValue: 900.0,
        shelfLocation: "B2",
        registeredDate: "2024-01-20T08:00:00",
        registeredBy: "USER-FD-001",
        status: "ready-for-delivery",
        customerContacted: true,
        contactedDate: "2024-01-20T09:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "89 Labone Road, Accra",
        deliveryFee: 20.0,
        updatedAt: "2024-01-20T09:00:00",
        updatedBy: "USER-CC-001",
    },
    {
        id: "PAK-016",
        stationId: "STATION-001",
        recipientName: "Hannah Osei",
        recipientPhone: "+233 555 678 901",
        itemDescription: "Watch",
        itemValue: 180.0,
        shelfLocation: "C2",
        registeredDate: "2024-01-20T09:30:00",
        registeredBy: "USER-FD-002",
        driverName: "Kwame Asante",
        vehicleNumber: "GR-456-24",
        status: "delivery-failed",
        customerContacted: true,
        contactedDate: "2024-01-20T10:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "34 Osu Road, Accra",
        deliveryFee: 15.0,
        assignedRiderId: "USER-RIDER-002",
        assignedRiderName: "Kwame Asante",
        assignedDate: "2024-01-20T11:00:00",
        pickedUpDate: "2024-01-20T11:30:00",
        outForDeliveryDate: "2024-01-20T12:00:00",
        // failedDate: "2024-01-20T14:00:00",
        failureReason: "Recipient not available",
        updatedAt: "2024-01-20T14:00:00",
        updatedBy: "USER-RIDER-002",
    },
    {
        id: "PAK-017",
        stationId: "STATION-002",
        recipientName: "Isaac Appiah",
        recipientPhone: "+233 555 789 012",
        itemDescription: "Headphones",
        itemValue: 150.0,
        shelfLocation: "A2",
        registeredDate: "2024-01-20T08:30:00",
        registeredBy: "USER-FD-003",
        status: "registered",
        updatedAt: "2024-01-20T08:30:00",
        updatedBy: "USER-FD-003",
    },
    {
        id: "PAK-018",
        stationId: "STATION-001",
        recipientName: "Joyce Adjei",
        recipientPhone: "+233 555 890 123",
        itemDescription: "Bag",
        itemValue: 120.0,
        shelfLocation: "Ground-Left",
        registeredDate: "2024-01-20T10:00:00",
        registeredBy: "USER-FD-001",
        status: "collected",
        customerContacted: true,
        contactedDate: "2024-01-20T11:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "pickup",
        collectedDate: "2024-01-20T13:00:00",
        // collectedBy: "USER-FD-001",
        updatedAt: "2024-01-20T13:00:00",
        updatedBy: "USER-FD-001",
    },
    {
        id: "PAK-019",
        stationId: "STATION-001",
        recipientName: "Kofi Mensah",
        recipientPhone: "+233 555 901 234",
        itemDescription: "Gaming Console",
        itemValue: 1800.0,
        shelfLocation: "B1",
        registeredDate: "2024-01-20T11:00:00",
        registeredBy: "USER-FD-002",
        status: "out-for-delivery",
        customerContacted: true,
        contactedDate: "2024-01-20T12:00:00",
        contactedBy: "USER-CC-001",
        deliveryPreference: "delivery",
        deliveryAddress: "56 Spintex Road, Accra",
        deliveryFee: 30.0,
        assignedRiderId: "USER-RIDER-001",
        assignedRiderName: "John Mensah",
        assignedDate: "2024-01-20T13:00:00",
        pickedUpDate: "2024-01-20T13:30:00",
        outForDeliveryDate: "2024-01-20T14:00:00",
        updatedAt: "2024-01-20T14:00:00",
        updatedBy: "USER-RIDER-001",
    },
    {
        id: "PAK-020",
        stationId: "STATION-002",
        recipientName: "Linda Ofori",
        recipientPhone: "+233 555 012 345",
        itemDescription: "Sunglasses",
        itemValue: 65.0,
        shelfLocation: "B1",
        registeredDate: "2024-01-20T09:00:00",
        registeredBy: "USER-FD-003",
        status: "contacted",
        customerContacted: true,
        contactedDate: "2024-01-20T10:00:00",
        contactedBy: "USER-CC-002",
        deliveryPreference: "pickup",
        updatedAt: "2024-01-20T10:00:00",
        updatedBy: "USER-CC-002",
    },
];

// ============================================================================
// DATA ACCESS FUNCTIONS
// ============================================================================

/**
 * Get all parcels for a specific station
 */
export const getParcelsByStation = (stationId: string): Parcel[] => {
    return mockParcels.filter((p) => p.stationId === stationId);
};

/**
 * Get all shelves for a specific station
 */
export const getShelvesByStation = (stationId: string): Shelf[] => {
    return mockShelves.filter((s) => s.stationId === stationId);
};

/**
 * Add a new shelf
 */
export const addShelf = (shelfName: string, stationId: string, createdBy: string): Shelf => {
    const newShelf: Shelf = {
        id: `SHELF-${Date.now()}`,
        name: shelfName.trim(),
        stationId,
        parcelCount: 0,
        createdBy,
        createdAt: new Date().toISOString().split("T")[0],
    };
    mockShelves.push(newShelf);
    return newShelf;
};

/**
 * Delete a shelf (only if no parcels assigned)
 */
export const deleteShelf = (shelfId: string, stationId: string): boolean => {
    const shelf = mockShelves.find((s) => s.id === shelfId && s.stationId === stationId);
    if (!shelf) {
        return false;
    }
    
    // Check if shelf has parcels
    if (shelf.parcelCount > 0) {
        return false; // Cannot delete shelf with parcels
    }
    
    const index = mockShelves.findIndex((s) => s.id === shelfId);
    if (index > -1) {
        mockShelves.splice(index, 1);
        return true;
    }
    return false;
};

/**
 * Update shelf parcel count (called when parcels are added/removed)
 */
export const updateShelfParcelCount = (shelfName: string, stationId: string): void => {
    const shelf = mockShelves.find((s) => s.name === shelfName && s.stationId === stationId);
    if (shelf) {
        // Count actual parcels on this shelf
        const count = mockParcels.filter(
            (p) => p.shelfLocation === shelfName && p.stationId === stationId
        ).length;
        shelf.parcelCount = count;
    }
};

/**
 * Get all users for a specific station
 */
export const getUsersByStation = (stationId: string): User[] => {
    return mockUsers.filter((u) => u.stationId === stationId);
};

/**
 * Get all riders for a specific station
 */
export const getRidersByStation = (stationId: string): Rider[] => {
    return mockRiders.filter((r) => r.stationId === stationId);
};

/**
 * Get parcels by status
 */
export const getParcelsByStatus = (status: Parcel["status"], stationId?: string): Parcel[] => {
    let parcels = mockParcels.filter((p) => p.status === status);
    if (stationId) {
        parcels = parcels.filter((p) => p.stationId === stationId);
    }
    return parcels;
};

/**
 * Get uncontacted parcels (registered but not contacted)
 */
export const getUncontactedParcels = (stationId?: string): Parcel[] => {
    let parcels = mockParcels.filter(
        (p) => p.status === "registered" && !p.customerContacted
    );
    if (stationId) {
        parcels = parcels.filter((p) => p.stationId === stationId);
    }
    return parcels;
};

/**
 * Get parcels ready for assignment
 */
export const getReadyForAssignmentParcels = (stationId?: string): Parcel[] => {
    return getParcelsByStatus("ready-for-delivery", stationId);
};

/**
 * Get assigned parcels for a rider
 */
export const getAssignedParcelsForRider = (riderId: string): Parcel[] => {
    return mockParcels.filter(
        (p) =>
            p.assignedRiderId === riderId &&
            (p.status === "assigned" ||
                p.status === "picked-up" ||
                p.status === "out-for-delivery")
    );
};

/**
 * Get all active deliveries (for managers/admins)
 */
export const getAllActiveDeliveries = (stationId?: string): Parcel[] => {
    let parcels = mockParcels.filter(
        (p) =>
            p.assignedRiderId &&
            (p.status === "assigned" ||
                p.status === "picked-up" ||
                p.status === "out-for-delivery")
    );
    
    if (stationId) {
        parcels = parcels.filter((p) => p.stationId === stationId);
    }
    
    return parcels;
};

/**
 * Add a new parcel
 */
export const addParcel = (parcel: Parcel): void => {
    mockParcels.push(parcel);
    // Update shelf count
    const shelf = mockShelves.find((s) => s.name === parcel.shelfLocation && s.stationId === parcel.stationId);
    if (shelf) {
        shelf.parcelCount += 1;
    }
};

/**
 * Assign parcels to a rider
 */
export const assignParcelsToRider = (
    parcelIds: string[],
    riderId: string,
    updatedBy: string
): void => {
    const rider = mockRiders.find((r) => r.id === riderId);
    if (!rider) {
        throw new Error(`Rider with ID ${riderId} not found`);
    }

    const now = new Date().toISOString();
    
    parcelIds.forEach((parcelId) => {
        const parcel = mockParcels.find((p) => p.id === parcelId);
        if (parcel) {
            parcel.status = "assigned";
            parcel.assignedRiderId = riderId;
            parcel.assignedRiderName = rider.name;
            parcel.assignedDate = now;
            parcel.updatedAt = now;
            parcel.updatedBy = updatedBy;
        }
    });
};

/**
 * Update parcel status
 */
export const updateParcelStatus = (
    parcelId: string,
    status: Parcel["status"],
    updatedBy: string,
    additionalData?: Partial<Parcel>
): void => {
    const parcel = mockParcels.find((p) => p.id === parcelId);
    if (parcel) {
        parcel.status = status;
        parcel.updatedAt = new Date().toISOString();
        parcel.updatedBy = updatedBy;
        
        if (additionalData) {
            Object.assign(parcel, additionalData);
        }
        
        // Update timestamps based on status
        const now = new Date().toISOString();
        switch (status) {
            case "contacted":
                parcel.contactedDate = now;
                break;
            case "assigned":
                parcel.assignedDate = now;
                break;
            case "picked-up":
                parcel.pickedUpDate = now;
                break;
            case "out-for-delivery":
                parcel.outForDeliveryDate = now;
                break;
            case "delivered":
                parcel.deliveredDate = now;
                break;
            case "delivery-failed":
                parcel.deliveryFailedDate = now;
                break;
            case "collected":
                parcel.collectedDate = now;
                break;
        }
    }
};

/**
 * Calculate financial summary for a station or system-wide
 */
export const calculateFinancialSummary = (
    stationId?: string,
    dateRange?: { from: string; to: string }
): FinancialSummary => {
    let parcels = stationId
        ? getParcelsByStation(stationId)
        : mockParcels;
    
    if (dateRange) {
        parcels = parcels.filter((p) => {
            const parcelDate = new Date(p.registeredDate);
            return (
                parcelDate >= new Date(dateRange.from) &&
                parcelDate <= new Date(dateRange.to)
            );
        });
    }
    
    const deliveredParcels = parcels.filter((p) => p.status === "delivered");
    
    const totalDeliveryEarnings = deliveredParcels.reduce(
        (sum, p) => sum + (p.deliveryFeeCollected || 0),
        0
    );
    
    const totalItemCollections = deliveredParcels.reduce(
        (sum, p) => sum + (p.itemValueCollected || 0),
        0
    );
    
    // Calculate driver payments (delivery fees go to drivers)
    const totalDriverPayments = totalDeliveryEarnings;
    
    // Calculate pending payments (outstanding driver balances)
    const riders = stationId
        ? getRidersByStation(stationId)
        : mockRiders;
    const pendingPayments = riders.reduce(
        (sum, r) => sum + r.outstandingBalance,
        0
    );
    
    const netRevenue = totalDeliveryEarnings + totalItemCollections - totalDriverPayments;
    
    return {
        stationId,
        totalDeliveryEarnings,
        totalItemCollections,
        totalDriverPayments,
        pendingPayments,
        netRevenue,
        dateRange,
    };
};

/**
 * Get driver financial data
 */
export const getDriverFinancials = (stationId?: string): DriverFinancial[] => {
    const riders = stationId ? getRidersByStation(stationId) : mockRiders;
    
    return riders.map((rider) => {
        const deliveries = mockParcels.filter(
            (p) =>
                p.assignedRiderId === rider.id && p.status === "delivered"
        );
        
        return {
            driverId: rider.id,
            driverName: rider.name,
            stationId: rider.stationId,
            deliveriesCompleted: deliveries.length,
            totalEarned: rider.totalEarned,
            amountPaid: rider.amountPaid,
            outstandingBalance: rider.outstandingBalance,
            paymentStatus: rider.paymentStatus,
            lastPaymentDate: rider.lastPaymentDate,
        };
    });
};

/**
 * Get remittance items (delivered parcels not yet collected/reconciled)
 */
export interface RemittanceItem {
    id: string;
    parcelId: string;
    riderId: string;
    riderName: string;
    recipientName: string;
    recipientPhone: string;
    deliveryAddress?: string;
    totalAmount: number;
    itemValue: number;
    deliveryFee: number;
    amountCollected?: number;
    deliveredDate?: string;
}

export const getRemittanceItems = (stationId?: string): RemittanceItem[] => {
    // Get delivered parcels that haven't been collected yet
    let deliveredParcels = mockParcels.filter(
        (p) => p.status === "delivered" && p.assignedRiderId
    );
    
    if (stationId) {
        deliveredParcels = deliveredParcels.filter((p) => p.stationId === stationId);
    }
    
    return deliveredParcels.map((parcel) => {
        // Calculate expected total amount
        const itemValue = parcel.itemValue || 0;
        const deliveryFee = parcel.deliveryFee || 0;
        const totalAmount = itemValue + deliveryFee;
        
        return {
            id: parcel.id,
            parcelId: parcel.id,
            riderId: parcel.assignedRiderId || "",
            riderName: parcel.assignedRiderName || "Unknown Rider",
            recipientName: parcel.recipientName,
            recipientPhone: parcel.recipientPhone,
            deliveryAddress: parcel.deliveryAddress,
            totalAmount: parcel.amountCollected || totalAmount,
            itemValue: itemValue,
            deliveryFee: deliveryFee,
            amountCollected: parcel.amountCollected,
            deliveredDate: parcel.deliveredDate,
        };
    });
};

/**
 * Mark parcel as collected (reconciled)
 */
export const markParcelAsCollected = (
    parcelId: string,
    amountReceived: number,
    updatedBy: string
): boolean => {
    const parcel = mockParcels.find((p) => p.id === parcelId);
    if (!parcel || parcel.status !== "delivered") {
        return false;
    }
    
    parcel.status = "collected";
    parcel.collectedDate = new Date().toISOString();
    parcel.updatedAt = new Date().toISOString();
    parcel.updatedBy = updatedBy;
    parcel.amountCollected = amountReceived;
    
    return true;
};

/**
 * Get system-wide metrics for admin dashboard
 */
export interface SystemMetrics {
    totalStations: number;
    totalParcels: number;
    totalDeliveryEarnings: number;
    totalDriverPayments: number;
    deliverySuccessRate: number;
    activeUsers: number;
}

export const getSystemMetrics = (): SystemMetrics => {
    const totalStations = mockStations.length;
    const totalParcels = mockParcels.length;
    const activeUsers = mockUsers.filter((u) => u.role !== "admin").length;
    
    const deliveredParcels = mockParcels.filter((p) => p.status === "delivered");
    const failedParcels = mockParcels.filter((p) => p.status === "delivery-failed");
    const totalAttempted = deliveredParcels.length + failedParcels.length;
    const deliverySuccessRate = totalAttempted > 0 
        ? (deliveredParcels.length / totalAttempted) * 100 
        : 0;
    
    const totalDeliveryEarnings = deliveredParcels.reduce(
        (sum, p) => sum + (p.deliveryFeeCollected || 0),
        0
    );
    
    const totalDriverPayments = mockRiders.reduce(
        (sum, r) => sum + r.outstandingBalance,
        0
    );
    
    return {
        totalStations,
        totalParcels,
        totalDeliveryEarnings,
        totalDriverPayments,
        deliverySuccessRate: Math.round(deliverySuccessRate * 10) / 10,
        activeUsers,
    };
};

/**
 * Get station performance data
 */
export interface StationPerformance {
    stationId: string;
    stationName: string;
    totalParcels: number;
    deliveryEarnings: number;
    driverPaymentsOwed: number;
    successRate: number;
}

export const getStationPerformance = (): StationPerformance[] => {
    return mockStations.map((station) => {
        const stationParcels = getParcelsByStation(station.id);
        const deliveredParcels = stationParcels.filter((p) => p.status === "delivered");
        const failedParcels = stationParcels.filter((p) => p.status === "delivery-failed");
        const totalAttempted = deliveredParcels.length + failedParcels.length;
        const successRate = totalAttempted > 0 
            ? (deliveredParcels.length / totalAttempted) * 100 
            : 0;
        
        const deliveryEarnings = deliveredParcels.reduce(
            (sum, p) => sum + (p.deliveryFeeCollected || 0),
            0
        );
        
        const stationRiders = getRidersByStation(station.id);
        const driverPaymentsOwed = stationRiders.reduce(
            (sum, r) => sum + r.outstandingBalance,
            0
        );
        
        return {
            stationId: station.id,
            stationName: station.name,
            totalParcels: stationParcels.length,
            deliveryEarnings,
            driverPaymentsOwed,
            successRate: Math.round(successRate * 10) / 10,
        };
    });
};

/**
 * Get parcels count by status for admin dashboard
 */
export interface ParcelStatusCount {
    status: string;
    count: number;
    color: string;
}

export const getParcelStatusCounts = (): ParcelStatusCount[] => {
    const statusCounts: Record<string, number> = {};
    
    mockParcels.forEach((parcel) => {
        statusCounts[parcel.status] = (statusCounts[parcel.status] || 0) + 1;
    });
    
    const statusConfig: Record<string, { label: string; color: string }> = {
        registered: { label: "Registered", color: "bg-gray-100" },
        contacted: { label: "Contacted", color: "bg-blue-100" },
        "ready-for-assignment": { label: "Ready for Delivery", color: "bg-yellow-100" },
        assigned: { label: "Assigned", color: "bg-purple-100" },
        "picked-up": { label: "Picked Up", color: "bg-indigo-100" },
        "out-for-delivery": { label: "Out for Delivery", color: "bg-indigo-100" },
        delivered: { label: "Delivered", color: "bg-green-100" },
        "delivery-failed": { label: "Failed", color: "bg-red-100" },
        collected: { label: "Collected", color: "bg-green-200" },
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
        status: statusConfig[status]?.label || status,
        count,
        color: statusConfig[status]?.color || "bg-gray-100",
    }));
};

/**
 * Add a new station
 */
export const addStation = (name: string, location: string): Station => {
    const stationNumber = String(mockStations.length + 1).padStart(3, '0');
    const locationCode = location.split(',')[0].trim().substring(0, 3).toUpperCase();
    
    const newStation: Station = {
        id: `STATION-${stationNumber}`,
        name: name.trim(),
        code: `${locationCode}-${stationNumber}`,
        location: location.trim(),
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
    };
    mockStations.push(newStation);
    return newStation;
};

/**
 * Update station
 */
export const updateStation = (stationId: string, updates: Partial<Station>): boolean => {
    const station = mockStations.find((s) => s.id === stationId);
    if (!station) return false;
    
    Object.assign(station, updates);
    return true;
};

/**
 * Get user count for a station
 */
export const getStationUserCount = (stationId: string): number => {
    return mockUsers.filter((u) => u.stationId === stationId).length;
};

/**
 * Add a new user
 */
export const addUser = (userData: {
    name: string;
    email: string;
    phone: string;
    role: User["role"];
    stationId: string;
}): User => {
    const newUser: User = {
        id: `USER-${Date.now()}`,
        name: userData.name.trim(),
        email: userData.email.trim(),
        phone: userData.phone.trim(),
        role: userData.role,
        stationId: userData.stationId,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
    };
    mockUsers.push(newUser);
    return newUser;
};

/**
 * Update user
 */
export const updateUser = (userId: string, updates: Partial<User>): boolean => {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) return false;
    
    Object.assign(user, updates);
    return true;
};

