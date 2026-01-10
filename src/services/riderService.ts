import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL_RIDER = API_ENDPOINTS.RIDER;

export type RiderStatus = "BUSY" | "OFFLINE" | "READY" | "ON_TRIP";
export type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

interface RiderStatusRequest {
    riderStatus: RiderStatus;
}

interface RiderStatusResponse {
    message: string;
    id: string;
}

interface RiderParcelResponse {
    parcelId: string;
    parcelDescription?: string;
    inboundCost?: number;
    pickUpCost?: number;
    deliveryCost?: number;
    storageCost?: number;
    hasCalled?: boolean;
    driverId?: string;
    officeId?: string;
    driverName?: string;
    driverPhoneNumber?: string;
    vehicleNumber?: string;
    senderName?: string;
    senderPhoneNumber?: string;
    receiverName?: string;
    receiverAddress?: string;
    recieverPhoneNumber?: string;
    shelfName?: string;
    inboudPayed?: string;
    shelfId?: string;
    homeDelivery?: boolean;
    pod?: boolean;
    delivered?: boolean;
    parcelAssigned?: boolean;
    fragile?: boolean;
}

export interface RiderAssignmentResponse {
    assignmentId: string;
    riderName: string;
    parcel: RiderParcelResponse;
    status: AssignmentStatus;
    assignedAt?: number;
    acceptedAt?: number;
    completedAt?: number;
}

interface UpdateAssignmentStatusRequest {
    status: AssignmentStatus;
    confirmationCode?: string;
    cancelationReason?: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: any;
}

class RiderService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_BASE_URL_RIDER,
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
     * Update rider status
     */
    async updateRiderStatus(status: RiderStatus): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.post<RiderStatusResponse>('/rider-status', {
                riderStatus: status,
            });
            return {
                success: true,
                message: response.data.message || 'Rider status updated successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Update rider status error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update rider status. Please try again.',
            };
        }
    }

    /**
     * Get all assignments for the authenticated rider (paginated)
     * The API now returns parcels directly, which we map to assignment structure
     */
    async getAssignments(page: number = 0, size: number = 50): Promise<ApiResponse> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());

            const response = await this.apiClient.get<any>(`/assignments?${params.toString()}`);

            // Debug: Log the response structure
            console.log('Rider assignments API response:', response.data);

            // Check if response is paginated (has content array) or direct array
            const rawData = response.data?.content || response.data || [];
            const items = Array.isArray(rawData) ? rawData : [];
            console.log('Items to process:', items.length);

            // Check if items are already assignments (have assignmentId and parcel) or parcels (need mapping)
            const isAssignmentFormat = items.length > 0 && items[0]?.assignmentId && items[0]?.parcel;

            const mappedContent = items.map((item: any) => {
                // If already in assignment format, use it directly (with minor adjustments)
                if (isAssignmentFormat) {
                    return {
                        assignmentId: item.assignmentId,
                        riderName: item.riderName || "Rider",
                        parcel: {
                            parcelId: item.parcel?.parcelId,
                            parcelDescription: item.parcel?.parcelDescription,
                            inboundCost: item.parcel?.inboundCost,
                            pickUpCost: item.parcel?.pickUpCost,
                            deliveryCost: item.parcel?.deliveryCost,
                            storageCost: item.parcel?.storageCost,
                            hasCalled: item.parcel?.hasCalled,
                            driverId: item.parcel?.driverId,
                            officeId: item.parcel?.officeId,
                            driverName: item.parcel?.driverName,
                            driverPhoneNumber: item.parcel?.driverPhoneNumber,
                            vehicleNumber: item.parcel?.vehicleNumber,
                            senderName: item.parcel?.senderName,
                            senderPhoneNumber: item.parcel?.senderPhoneNumber,
                            receiverName: item.parcel?.receiverName,
                            receiverAddress: item.parcel?.receiverAddress,
                            recieverPhoneNumber: item.parcel?.recieverPhoneNumber,
                            shelfName: item.parcel?.shelfName,
                            shelfId: item.parcel?.shelfId,
                            homeDelivery: item.parcel?.homeDelivery,
                            pod: item.parcel?.POD || item.parcel?.pod,
                            delivered: item.parcel?.delivered,
                            parcelAssigned: item.parcel?.parcelAssigned,
                            fragile: item.parcel?.fragile,
                            inboudPayed: item.parcel?.inboudPayed,
                        } as RiderParcelResponse,
                        status: item.status as AssignmentStatus,
                        assignedAt: item.assignedAt,
                        acceptedAt: item.acceptedAt,
                        completedAt: item.completedAt,
                    } as RiderAssignmentResponse;
                }

                // Otherwise, map from parcel format (old format)
                // Determine status based on parcel properties
                let status: AssignmentStatus = "ASSIGNED";
                if (item.delivered) {
                    status = "DELIVERED";
                } else if (item.parcelAssigned) {
                    status = "ACCEPTED";
                }

                return {
                    assignmentId: item.parcelId || item.assignmentId,
                    riderName: item.driverName || item.riderName || "Rider",
                    parcel: {
                        parcelId: item.parcelId,
                        parcelDescription: item.parcelDescription,
                        inboundCost: item.inboundCost,
                        pickUpCost: item.pickUpCost,
                        deliveryCost: item.deliveryCost,
                        storageCost: item.storageCost,
                        hasCalled: item.hasCalled,
                        driverId: item.driverId,
                        officeId: item.officeId,
                        driverName: item.driverName,
                        driverPhoneNumber: item.driverPhoneNumber,
                        vehicleNumber: item.vehicleNumber,
                        senderName: item.senderName,
                        senderPhoneNumber: item.senderPhoneNumber,
                        receiverName: item.receiverName,
                        receiverAddress: item.receiverAddress,
                        recieverPhoneNumber: item.recieverPhoneNumber,
                        shelfName: item.shelfName,
                        shelfId: item.shelfId,
                        homeDelivery: item.homeDelivery,
                        pod: item.POD || item.pod,
                        delivered: item.delivered,
                        parcelAssigned: item.parcelAssigned,
                        fragile: item.fragile,
                        inboudPayed: item.inboudPayed,
                    } as RiderParcelResponse,
                    status: status,
                    assignedAt: item.createdAt || item.assignedAt,
                    acceptedAt: item.parcelAssigned ? (item.updatedAt || item.acceptedAt) : item.acceptedAt,
                    completedAt: item.delivered ? (item.updatedAt || item.completedAt) : item.completedAt,
                } as RiderAssignmentResponse;
            });

            console.log('Mapped assignments:', mappedContent.length);

            return {
                success: true,
                message: 'Assignments retrieved successfully',
                data: {
                    content: mappedContent,
                    totalElements: response.data?.totalElements || 0,
                    totalPages: response.data?.totalPages || 0,
                    number: response.data?.number || 0,
                    size: response.data?.size || size,
                    first: response.data?.first || false,
                    last: response.data?.last || false,
                },
            };
        } catch (error: any) {
            console.error('Get assignments error:', error);
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
     * Update assignment status (for rider)
     */
    async updateAssignmentStatus(
        assignmentId: string,
        status: AssignmentStatus,
        confirmationCode?: string,
        reason?: string
    ): Promise<ApiResponse> {
        try {
            const requestBody: UpdateAssignmentStatusRequest = {
                status,
            };

            // Include confirmation code only for DELIVERED status
            if (status === "DELIVERED" && confirmationCode) {
                requestBody.confirmationCode = confirmationCode;
            }

            // Include cancelationReason only for CANCELLED status
            if (status === "CANCELLED" && reason) {
                requestBody.cancelationReason = reason;
            }

            const response = await this.apiClient.put<{ message: string }>(
                `/assignments/${assignmentId}/status`,
                requestBody
            );
            return {
                success: true,
                message: response.data.message || 'Assignment status updated successfully',
            };
        } catch (error: any) {
            console.error('Update assignment status error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update assignment status. Please try again.',
            };
        }
    }

    /**
     * Update assignment status as MANAGER
     * Uses manager endpoint: PUT /api-rider/manager/assignments/{assignmentId}/status
     */
    async updateManagerAssignmentStatus(
        assignmentId: string,
        status: AssignmentStatus,
        confirmationCode?: string,
        reason?: string
    ): Promise<ApiResponse> {
        try {
            const requestBody: UpdateAssignmentStatusRequest = {
                status,
            };

            if (status === "DELIVERED" && confirmationCode) {
                requestBody.confirmationCode = confirmationCode;
            }

            if (status === "CANCELLED" && reason) {
                requestBody.cancelationReason = reason;
            }

            const response = await this.apiClient.put<{ message: string }>(
                `/manager/assignments/${assignmentId}/status`,
                requestBody
            );

            return {
                success: true,
                message: response.data.message || 'Assignment status updated successfully',
            };
        } catch (error: any) {
            console.error('Update manager assignment status error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update assignment status. Please try again.',
            };
        }
    }
}

export default new RiderService();
export type { RiderParcelResponse, RiderStatusRequest, RiderStatusResponse, UpdateAssignmentStatusRequest };

