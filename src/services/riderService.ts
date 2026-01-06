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
     * Get all assignments for the authenticated rider
     */
    async getAssignments(): Promise<ApiResponse> {
        try {
            const response = await this.apiClient.get<RiderAssignmentResponse[]>('/assignments');
            return {
                success: true,
                message: 'Assignments retrieved successfully',
                data: response.data,
            };
        } catch (error: any) {
            console.error('Get assignments error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve assignments. Please try again.',
                data: [],
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

