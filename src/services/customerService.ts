/**
 * Public API for customers (no login required).
 * Used for parcel lookup / track by phone number.
 * Does not attach Bearer token.
 */

import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_USER = API_ENDPOINTS.USER;

export interface CustomerParcel {
    parcelId: string;
    receiverName?: string | null;
    recieverPhoneNumber?: string | null;
    receiverAddress?: string | null;
    senderName?: string | null;
    senderPhoneNumber?: string | null;
    parcelDescription?: string | null;
    shelfName?: string | null;
    officeId?: string | null;
    delivered?: boolean;
    pod?: boolean;
    parcelAssigned?: boolean;
    homeDelivery?: boolean;
    /** Amount receiver pays (e.g. for collection). May be returned by API. */
    parcelAmount?: number;
    inboundCost?: number;
    deliveryCost?: number;
    storageCost?: number;
    pickUpCost?: number;
    paymentMethod?: string | null;
    inboudPayed?: boolean | null;
    typeofParcel?: 'PARCEL' | 'ONLINE' | 'PICKUP';
    createdAt?: number | null;
    updatedAt?: number | null;
}

export interface SearchByPhoneResult {
    success: boolean;
    message?: string;
    data?: CustomerParcel[];
}

/**
 * Search parcels by receiver phone number.
 * Public endpoint: no authentication required.
 * GET /api-user/parcel-search?phoneNumber=...
 */
export async function searchParcelsByPhone(phoneNumber: string): Promise<SearchByPhoneResult> {
    try {
        const normalized = phoneNumber.trim().replace(/\s/g, '');
        if (!normalized) {
            return { success: false, message: 'Please enter a phone number.', data: [] };
        }
        // Use +233 format if local number
        let query = normalized;
        if (/^0[2-9]/.test(normalized)) {
            query = '+233' + normalized.slice(1);
        } else if (/^[2-9]\d{8}$/.test(normalized)) {
            query = '+233' + normalized;
        }

        const client = axios.create({
            baseURL: API_BASE_USER,
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        const response = await client.get<CustomerParcel[] | { content?: CustomerParcel[]; data?: CustomerParcel[] }>('/parcel-search', {
            params: { phoneNumber: query },
        });

        const raw = response.data;
        const list = Array.isArray(raw)
            ? raw
            : Array.isArray((raw as any)?.content)
                ? (raw as any).content
                : Array.isArray((raw as any)?.data)
                    ? (raw as any).data
                    : [];
        return {
            success: true,
            data: list,
        };
    } catch (error: any) {
        const message =
            error.response?.data?.message ||
            error.response?.status === 401
                ? 'Unable to search. Please try again.'
                : error.message || 'Search failed. Please try again.';
        return {
            success: false,
            message,
            data: [],
        };
    }
}
