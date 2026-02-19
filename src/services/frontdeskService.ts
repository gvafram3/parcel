import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL_FRONTDESK = API_ENDPOINTS.FRONTDESK;

interface ParcelRequest {
    // Core sender / receiver
    senderName?: string;
    senderPhoneNumber?: string;
    receiverName?: string;
    receiverAddress?: string;
    recieverPhoneNumber?: string;
    parcelDescription?: string;

    // Station / driver intake info
    driverName?: string;
    driverPhoneNumber?: string;
    inboundCost?: number;
    pickUpCost?: number;
    deliveryCost?: number;
    storageCost?: number;
    shelfNumber?: string;
    hasCalled?: boolean;
    vehicleNumber?: string;
    officeId?: string;

    // Parcel lifecycle flags
    pod?: boolean;
    pickedUp?: boolean;
    delivered?: boolean;
    parcelAssigned?: boolean;
    fragile?: boolean;
    homeDelivery?: boolean;

    // Payment / shelf details
    paymentMethod?: string;
    shelfName?: string;
    inboudPayed?: boolean;
    shelfId?: string;

    // Parcel typing
    typeofParcel?: "PARCEL" | "ONLINE" | "PICKUP";

    // Pickup / delivery request specific fields
    pickupAddress?: string;
    pickupContactName?: string;
    pickupContactPhoneNumber?: string;
    pickupInstructions?: string;
    deliveryAddress?: string;
    deliveryContactName?: string;
    deliveryContactPhoneNumber?: string;
    specialInstructions?: string;

    // Rider assignment and value
    riderId?: string;
    itemCost?: number;
    itemOwnerPaid?: boolean;
}

interface ParcelUpdateRequest {
    driverPhoneNumber?: string;
    driverName?: string;
    vehicleNumber?: string;
    senderPhoneNumber?: string;
    senderName?: string;
    receiverAddress?: string;
    parcelDescription?: string;
    inboundCost?: number;
    pickUpCost?: number;
    deliveryCost?: number;
    storageCost?: number;
    shelfNumber?: string;
    pod?: boolean;
    delivered?: boolean;
    pickedUp?: boolean;
    parcelAssigned?: boolean;
    fragile?: boolean;
    hasCalled?: boolean;
    homeDelivery?: boolean;
}

interface ParcelResponse {
    parcelId: string;
    senderName?: string | null;
    senderPhoneNumber?: string;
    receiverName?: string;
    receiverAddress?: string;
    recieverPhoneNumber?: string;
    parcelDescription?: string;
    driverName?: string;
    driverPhoneNumber?: string;
    driverId?: string | null;
    vehicleNumber?: string;
    inboundCost?: number;
    pickUpCost?: number;
    deliveryCost?: number;
    storageCost?: number;
    shelfNumber?: string;
    shelfId?: string;
    pickedUp?: boolean;
    shelfName?: string;
    officeId?: string | {
        id: string;
        name: string;
        code: string;
        address?: string;
    };
    pod?: boolean;
    delivered?: boolean;
    parcelAssigned?: boolean;
    fragile?: boolean;
    hasCalled?: boolean | null;
    inboudPayed?: boolean | null;
    homeDelivery?: boolean;
    registeredDate?: number;
    createdAt?: number | null;
    updatedAt?: number | null;
    typeofParcel?: "PARCEL" | "ONLINE" | "PICKUP";
    returnCount?: number;
    riderId?: string;
    // NEW: optional rider info when parcel is assigned to a rider
    riderInfo?: {
        riderId: string;
        riderName: string;
        riderPhoneNumber?: string;
    } | null;
    // Post-delivery follow-up (delivered parcels)
    followUpStatus?: 'PENDING' | 'FOLLOWED_UP';
    followUpRemarkType?: string;
    followUpAt?: number;
    deliveryDate?: number;
    officeName?: string;
}

interface PageParcelResponse {
    content: ParcelResponse[];
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
}

interface DeliveryAssignmentRequest {
    riderId: string;
    parcelIds: string[];
}

interface DeliveryAssignmentResponse {
    assignmentId: string;
    riderName: string;
    parcel: ParcelResponse;
    status: "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";
    assignedAt?: number;
    acceptedAt?: number;
    completedAt?: number;
    payed?: boolean;
}

interface ReconcilationRiderRequest {
    riderId: string;
    assignmentIds: string[];
}

interface RiderResponse {
    userId: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    office?: {
        id: string;
        name: string;
        code: string;
        address?: string;
    };
    role: "RIDER";
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
}

interface ParcelSearchFilters {
    isPOD?: boolean;
    isDelivered?: boolean;
    isParcelAssigned?: boolean;
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

interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
}

class FrontdeskService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_BASE_URL_FRONTDESK,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include token
        this.apiClient.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor to handle errors
        this.apiClient.interceptors.response.use(
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
     * Create a pickup request (parcel to be collected from one location and delivered to another)
     * Endpoint: POST /pickup-request
     * Note: Backend may need to implement this endpoint. Payload structure is provided for integration.
     */
    async createPickupRequest(pickupData: {
        officeId: string;
        pickupAddress: string;
        pickupContactName: string;
        pickupContactPhone: string;
        deliveryAddress: string;
        recipientName: string;
        recipientPhone: string;
        parcelDescription: string;
        itemValue?: number;
        specialInstructions?: string;
        pickupCost?: number;
        deliveryCost?: number;
        preferredPickupDate?: string;
        preferredPickupTime?: string;
    }): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.post('/pickup-request', pickupData);
            return {
                success: true,
                message: 'Pickup request created successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Create pickup request error:', error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    'Failed to create pickup request. Please try again.',
            };
        }
    }

    /**
     * Add a new parcel
     */
    async addParcel(parcelData: ParcelRequest): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.post<ParcelResponse>('/parcel', parcelData);
            return {
                success: true,
                message: 'Parcel added successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Add parcel error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add parcel. Please try again.',
            };
        }
    }

    /**
     * Update a parcel by ID
     */
    async updateParcel(parcelId: string, updateData: ParcelUpdateRequest): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.put<ParcelResponse>(`/parcel/${parcelId}`, updateData);
            return {
                success: true,
                message: 'Parcel updated successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Update parcel error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update parcel. Please try again.',
            };
        }
    }

    /**
     * Search parcels with filters and pagination
     */
    async searchParcels(
        filters: ParcelSearchFilters = {},
        pageable: PageableRequest = { page: 0, size: 50 }
    ): Promise<ApiResponse> {
        try {
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

            const response = await this.apiClient.get<PageParcelResponse>(
                `/parcels?${params.toString()}`
            );
            console.log(response.data);
            return {
                success: true,
                message: 'Parcels retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Search parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve parcels. Please try again.',
            };
        }
    }

    /**
     * Get home delivery parcels for assignment
     * Endpoint: GET /parcels/home-delivery
     */
    async getHomeDeliveryParcels(): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.get<ParcelResponse[] | PageParcelResponse>('/parcels/home-delivery');

            // Handle both array and paginated response formats
            let parcels: ParcelResponse[] = [];
            if (Array.isArray(response.data)) {
                parcels = response.data;
            } else if (response.data && typeof response.data === 'object' && 'content' in response.data) {
                // Paginated response
                parcels = (response.data as PageParcelResponse).content || [];
            }

            return {
                success: true,
                message: 'Home delivery parcels retrieved successfully',
                data: parcels,
            };
        } catch (error: any) {
            console.error('Get home delivery parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve home delivery parcels. Please try again.',
                data: [],
            };
        }
    }

    /**
     * Get uncalled parcels for call center
     * Endpoint: GET /parcels-uncalled
     * Supports pagination with page and size parameters
     */
    async getUncalledParcels(page: number = 0, size: number = 20): Promise<ApiResponse> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());

            const response = await this.apiClient.get<PageParcelResponse>(`/parcels-uncalled?${params.toString()}`);

            // Extract parcels from paginated response
            const parcels: ParcelResponse[] = response.data?.content || [];

            return {
                success: true,
                message: 'Uncalled parcels retrieved successfully',
                data: {
                    content: parcels,
                    totalElements: response.data?.totalElements || 0,
                    totalPages: response.data?.totalPages || 0,
                    number: response.data?.number || 0,
                    size: response.data?.size || size,
                },
            };
        } catch (error: any) {
            console.error('Get uncalled parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve uncalled parcels. Please try again.',
                data: {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    number: 0,
                    size: size,
                },
            };
        }
    }

    /**
     * Assign parcels to a rider
     */
    async assignParcelsToRider(riderId: string, parcelIds: string[]): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.post<{ message: string }>('/assign-parcels', {
                riderId,
                parcelIds,
            });
            return {
                success: true,
                message: response.data.message || 'Parcels assigned successfully',
            };
        } catch (error: any) {
            console.error('Assign parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to assign parcels. Please try again.',
            };
        }
    }

    /**
     * Get rider assignments
     */
    async getRiderAssignments(riderId: string, payed?: boolean): Promise<ApiResponse> {
        try {
            const params = new URLSearchParams();
            if (payed !== undefined) {
                params.append('payed', payed.toString());
            }

            const response = await this.apiClient.get<DeliveryAssignmentResponse[]>(
                `/rider/${riderId}/assignments${params.toString() ? `?${params.toString()}` : ''}`
            );
            return {
                success: true,
                message: 'Assignments retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get rider assignments error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve assignments. Please try again.',
            };
        }
    }

    /**
     * Get driver parcels
     */
    async getDriverParcels(
        driverId: string,
        isPOD?: boolean,
        inboundPayed?: string
    ): Promise<ApiResponse> {
        try {
            const params = new URLSearchParams();
            if (isPOD !== undefined) {
                params.append('isPOD', isPOD.toString());
            }
            if (inboundPayed !== undefined) {
                params.append('inboundPayed', inboundPayed);
            }

            const response = await this.apiClient.get<ParcelResponse[]>(
                `/driver/${driverId}/parcels${params.toString() ? `?${params.toString()}` : ''}`
            );
            return {
                success: true,
                message: 'Driver parcels retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get driver parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve driver parcels. Please try again.',
            };
        }
    }

    /**
     * Get all parcel assignments (paginated)
     * Endpoint: GET /parcel-assignment
     * Now returns assignments with parcels array
     */
    async getParcelAssignments(page: number = 0, size: number = 200): Promise<ApiResponse> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());

            const response = await this.apiClient.get<any>(`/parcel-assignment?${params.toString()}`);

            // Return raw data - the Reconciliation component will handle grouping
            // The API now returns assignments with parcels array
            const rawContent = response.data?.content || [];

            return {
                success: true,
                message: 'Assignments retrieved successfully',
                data: {
                    content: rawContent, // Return raw data for processing in component
                    totalElements: response.data?.totalElements || 0,
                    totalPages: response.data?.totalPages || 0,
                    number: response.data?.number || 0,
                    size: response.data?.size || size,
                    first: response.data?.first || false,
                    last: response.data?.last || false,
                },
            };
        } catch (error: any) {
            console.error('Get parcel assignments error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve assignments. Please try again.',
                data: {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    number: 0,
                    size: size,
                    first: true,
                    last: true,
                },
            };
        }
    }

    /**
     * Get reconciliations by date
     * Date should be in milliseconds (start of day)
     */
    async getReconciliationsByDate(dateInMillis: number): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.get(`/reconciliations/by-date?date=${dateInMillis}`);
            return {
                success: true,
                message: 'Reconciliations retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Failed to fetch reconciliations by date:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch reconciliations',
            };
        }
    }

    /**
     * Reconcile rider payments (manual payment)
     * Expects array of objects with: { assignmentId, reconciledAt, payedAmount }
     * Note: API expects strings for payedAmount and reconciledAt (as shown in Postman)
     * If array has one item, sends as single object; if multiple, sends as array
     */
    async reconcileRiderPayments(reconciliationData: Array<{
        assignmentId: string;
        reconciledAt: number | string;
        payedAmount: number | string;
    }>): Promise<ApiResponse> {
        try {
            // Convert to format expected by API (strings for payedAmount and reconciledAt)
            const formattedData = reconciliationData.map(item => ({
                assignmentId: item.assignmentId,
                reconciledAt: String(item.reconciledAt),
                payedAmount: String(item.payedAmount),
            }));

            // If only one item, send as single object (matching Postman format)
            // Otherwise send as array
            const payload = formattedData.length === 1 ? formattedData[0] : formattedData;

            console.log('Sending reconciliation payload:', payload);
            const response = await this.apiClient.post<{ message: string }>('/reconcilation-parcels', payload);
            return {
                success: true,
                message: response.data.message || 'Reconciliation completed successfully',
            };
        } catch (error: any) {
            console.error('Reconcile payments error:', error);
            console.error('Error details:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to reconcile payments. Please try again.',
            };
        }
    }

    /**
     * Get delivered parcels for post-delivery follow-up (Call Center)
     * Endpoint: GET /parcels/delivered
     * Returns parcels across all stations for centralized call center
     */
    async getDeliveredParcels(filters: {
        page?: number;
        size?: number;
        officeId?: string;
        fromDate?: number;
        toDate?: number;
        followUpStatus?: 'PENDING' | 'FOLLOWED_UP' | 'ALL';
    } = {}): Promise<ApiResponse> {
        try {
            const params = new URLSearchParams();
            params.append('page', String(filters.page ?? 0));
            params.append('size', String(filters.size ?? 20));

            if (filters.officeId) params.append('officeId', filters.officeId);
            if (filters.fromDate) params.append('fromDate', String(filters.fromDate));
            if (filters.toDate) params.append('toDate', String(filters.toDate));
            if (filters.followUpStatus && filters.followUpStatus !== 'ALL') {
                params.append('followUpStatus', filters.followUpStatus);
            }

            const response = await this.apiClient.get<PageParcelResponse>(`/parcels/delivered?${params.toString()}`);

            const data = response.data;
            const content = data?.content ?? [];
            return {
                success: true,
                message: 'Delivered parcels retrieved successfully',
                data: {
                    content,
                    totalElements: data?.totalElements ?? 0,
                    totalPages: data?.totalPages ?? 0,
                    number: data?.number ?? 0,
                    size: data?.size ?? (filters.size ?? 20),
                },
            };
        } catch (error: any) {
            console.error('Get delivered parcels error:', error);
            return {
                success: false,
                message: error.response?.data?.message ?? 'Failed to retrieve delivered parcels.',
                data: {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    number: 0,
                    size: filters.size ?? 20,
                },
            };
        }
    }

    /**
     * Record post-delivery follow-up for a parcel
     * Endpoint: POST /parcels/:parcelId/follow-up
     */
    async createFollowUp(
        parcelId: string,
        remarkType: string,
        remarkOther?: string
    ): Promise<ApiResponse> {
        try {
            const body: { remarkType: string; remarkOther?: string } = { remarkType };
            if (remarkType === 'OTHER' && remarkOther?.trim()) {
                body.remarkOther = remarkOther.trim();
            }
            const response = await this.apiClient.post(`/parcels/${parcelId}/follow-up`, body);
            return {
                success: true,
                message: response.data?.message ?? 'Follow-up recorded successfully',
            };
        } catch (error: any) {
            console.error('Create follow-up error:', error);
            return {
                success: false,
                message: error.response?.data?.message ?? 'Failed to record follow-up.',
            };
        }
    }

    /**
     * Get riders for a station/office
     * Uses the authenticated user's office automatically
     */
    async getRiders(): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.get<RiderResponse[]>('/riders/office');
            return {
                success: true,
                message: 'Riders retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get riders error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve riders. Please try again.',
                data: [],
            };
        }
    }
}

export default new FrontdeskService();
export type {
    ParcelRequest,
    ParcelUpdateRequest,
    ParcelResponse,
    PageParcelResponse,
    DeliveryAssignmentRequest,
    DeliveryAssignmentResponse,
    ReconcilationRiderRequest,
    ParcelSearchFilters,
    PageableRequest,
    RiderResponse,
};

