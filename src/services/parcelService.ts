import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL_ADMIN = API_ENDPOINTS.ADMIN;
const API_BASE_URL_FRONTDESK = API_ENDPOINTS.FRONTDESK;

interface ParcelSearchFilters {
    isPOD?: boolean;
    isDelivered?: boolean;
    isParcelAssigned?: boolean;
    officeId?: string;
    driverId?: string;
    hasCalled?: string;
    limit?: string;
    page?: string;
}

interface PageableRequest {
    page?: number;
    size?: number;
    sort?: string[];
}

interface ApiParcel {
    parcelId: string;
    senderName?: string;
    senderPhoneNumber?: string;
    receiverName?: string;
    receiverAddress?: string;
    recieverPhoneNumber?: string;
    parcelDescription?: string;
    driverName?: string;
    driverPhoneNumber?: string;
    inboundCost?: number;
    pickUpCost?: number;
    deliveryCost?: number;
    storageCost?: number;
    pod?: boolean;
    delivered?: boolean;
    parcelAssigned?: boolean;
    fragile?: boolean;
    parcelTransfer?: boolean;
    destinationOfficeId?: string;
    vehicleNumber?: string;
}

interface CreateTransferParcelRequest {
    senderName: string;
    senderPhoneNumber: string;
    receiverName: string;
    receiverPhoneNumber: string;
    receiverAddress?: string;
    driverName: string;
    driverPhoneNumber?: string;
    vehicleNumber: string;
    inboundCost: number;
    deliveryCost: number;
    itemValue?: number;
    pod: boolean;
    parcelTransfer: boolean;
    officeId: string;
    fromOfficeId: string;
    toOfficeId: string;
    parcelDescription?: string;
}

interface PageParcelResponse {
    content: ApiParcel[];
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
}

interface ParcelResponse {
    success: boolean;
    message: string;
    data?: PageParcelResponse;
}

class ParcelService {
    private apiClientAdmin: AxiosInstance;
    private apiClientFrontdesk: AxiosInstance;

    constructor() {
        // Admin API Client
        this.apiClientAdmin = axios.create({
            baseURL: API_BASE_URL_ADMIN,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Frontdesk API Client
        this.apiClientFrontdesk = axios.create({
            baseURL: API_BASE_URL_FRONTDESK,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include token for Admin API
        this.apiClientAdmin.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add request interceptor to include token for Frontdesk API
        this.apiClientFrontdesk.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor to handle errors for Admin API
        this.apiClientAdmin.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    authService.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );

        // Add response interceptor to handle errors for Frontdesk API
        this.apiClientFrontdesk.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    authService.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get all parcels with filters and pagination (using Admin API)
     */
    async getParcels(
        filters: ParcelSearchFilters = {},
        pageable: PageableRequest = { page: 0, size: 50 }
    ): Promise<ParcelResponse> {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            
            // Add pagination
            params.append('page', (pageable.page || 0).toString());
            params.append('size', (pageable.size || 50).toString());
            
            if (pageable.sort && pageable.sort.length > 0) {
                pageable.sort.forEach(sort => {
                    params.append('sort', sort);
                });
            }

            // Add filters
            if (filters.isPOD !== undefined) {
                params.append('isPOD', filters.isPOD.toString());
            }
            if (filters.isDelivered !== undefined) {
                params.append('isDelivered', filters.isDelivered.toString());
            }
            if (filters.isParcelAssigned !== undefined) {
                params.append('isParcelAssigned', filters.isParcelAssigned.toString());
            }
            if (filters.officeId) {
                params.append('officeId', filters.officeId);
            }
            if (filters.driverId) {
                params.append('driverId', filters.driverId);
            }
            if (filters.hasCalled) {
                params.append('hasCalled', filters.hasCalled);
            }
            if (filters.limit) {
                params.append('limit', filters.limit);
            }
            if (filters.page) {
                params.append('page', filters.page);
            }

            const response = await this.apiClientAdmin.get<PageParcelResponse>(
                `/parcels?${params.toString()}`
            );

            return {
                success: true,
                message: 'Parcels retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve parcels. Please try again.',
            };
        }
    }

    /**
     * Create a transfer parcel (using Frontdesk API)
     */
    async createTransferParcel(parcelData: CreateTransferParcelRequest): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            const response = await this.apiClientFrontdesk.post('/parcel', parcelData);

            return {
                success: true,
                message: 'Transfer parcel created successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Create transfer parcel error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create transfer parcel. Please try again.',
            };
        }
    }

    /**
     * Get all incoming transfer parcels (in-transit) (using Frontdesk API)
     */
    async getInTransitParcels(): Promise<{ success: boolean; message: string; data?: ApiParcel[] }> {
        try {
            const response = await this.apiClientFrontdesk.get<ApiParcel[]>('/parcels/transfer/in-transit');

            return {
                success: true,
                message: 'In-transit parcels retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get in-transit parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve in-transit parcels. Please try again.',
            };
        }
    }

    /**
     * Get all outgoing transfer parcels (using Frontdesk API)
     */
    async getOutgoingParcels(): Promise<{ success: boolean; message: string; data?: ApiParcel[] }> {
        try {
            const response = await this.apiClientFrontdesk.get<ApiParcel[]>('/parcels/transfer/outgoing');

            return {
                success: true,
                message: 'Outgoing parcels retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get outgoing parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve outgoing parcels. Please try again.',
            };
        }
    }

    /**
     * Delete a parcel (using Frontdesk API)
     */
    async deleteParcel(parcelId: string): Promise<{ success: boolean; message: string }> {
        try {
            await this.apiClientFrontdesk.delete(`/parcel/${parcelId}`);

            return {
                success: true,
                message: 'Parcel deleted successfully',
            };
        } catch (error: any) {
            console.error('Delete parcel error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete parcel. Please try again.',
            };
        }
    }
}

export default new ParcelService();
export type { ApiParcel, PageParcelResponse, ParcelSearchFilters, PageableRequest, CreateTransferParcelRequest };
