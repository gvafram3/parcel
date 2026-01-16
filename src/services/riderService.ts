import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL_RIDER = API_ENDPOINTS.RIDER;

export type RiderStatus = "BUSY" | "OFFLINE" | "READY" | "ON_TRIP";
export type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "RETURNED";

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
    cancelled?: boolean;
    returned?: boolean;
    parcelAssigned?: boolean;
    fragile?: boolean;
}

export interface RiderAssignmentResponse {
    assignmentId: string;
    riderName: string;
    parcel: RiderParcelResponse; // For backward compatibility - will be populated from first parcel in parcels array
    parcels?: RiderParcelResponse[]; // New: multiple parcels per assignment
    status: AssignmentStatus;
    assignedAt?: number;
    acceptedAt?: number;
    completedAt?: number;
    amount?: number; // Total amount for the assignment
    riderInfo?: {
        riderId: string;
        riderName: string;
        riderPhoneNumber: string;
    };
    officeId?: string;
    payed?: boolean;
    paymentMethod?: string | null;
}

interface UpdateAssignmentStatusRequest {
    status: AssignmentStatus;
    confirmationCode?: string;
    cancelationReason?: string;
    returnReason?: string; // For ASSIGNED status when marking as failed
    payementMethod?: string; // For DELIVERED status: "cash" or "momo"
    parcelId?: string; // For DELIVERED and ASSIGNED (failed) status: the parcel ID
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

            // Helper function to map a parcel object from the new API format
            const mapParcelFromNewFormat = (parcelItem: any): RiderParcelResponse => {
                // Handle both new format (receiverPhoneNumber, parcelAmount) and old format
                const parcelAmount = parcelItem.parcelAmount;
                const receiverPhone = parcelItem.receiverPhoneNumber || parcelItem.recieverPhoneNumber;

                // If parcelAmount is provided and individual cost fields are not, use parcelAmount as deliveryCost
                // Otherwise, use individual cost fields if available
                const hasIndividualCosts = parcelItem.deliveryCost !== undefined ||
                    parcelItem.pickUpCost !== undefined ||
                    parcelItem.inboundCost !== undefined ||
                    parcelItem.storageCost !== undefined;

                return {
                    parcelId: parcelItem.parcelId,
                    parcelDescription: parcelItem.parcelDescription,
                    // If individual costs are not provided but parcelAmount is, use it as deliveryCost (total)
                    // The component sums all cost fields, so this works correctly
                    deliveryCost: parcelItem.deliveryCost ?? (parcelAmount !== undefined && !hasIndividualCosts ? parcelAmount : undefined),
                    inboundCost: parcelItem.inboundCost,
                    pickUpCost: parcelItem.pickUpCost,
                    storageCost: parcelItem.storageCost,
                    hasCalled: parcelItem.hasCalled,
                    driverId: parcelItem.driverId,
                    officeId: parcelItem.officeId,
                    driverName: parcelItem.driverName,
                    driverPhoneNumber: parcelItem.driverPhoneNumber,
                    vehicleNumber: parcelItem.vehicleNumber,
                    senderName: parcelItem.senderName,
                    senderPhoneNumber: parcelItem.senderPhoneNumber,
                    receiverName: parcelItem.receiverName,
                    receiverAddress: parcelItem.receiverAddress,
                    recieverPhoneNumber: receiverPhone, // Map receiverPhoneNumber to recieverPhoneNumber (typo in interface)
                    shelfName: parcelItem.shelfName,
                    shelfId: parcelItem.shelfId,
                    homeDelivery: parcelItem.homeDelivery,
                    pod: parcelItem.POD || parcelItem.pod,
                    delivered: parcelItem.delivered || parcelItem.payed || false,
                    cancelled: parcelItem.cancelled || false,
                    returned: parcelItem.returned || false,
                    parcelAssigned: parcelItem.parcelAssigned,
                    fragile: parcelItem.fragile,
                    inboudPayed: parcelItem.inboudPayed || parcelItem.payed,
                } as RiderParcelResponse;
            };

            // Flatten assignments: if an assignment has multiple parcels, create one assignment per parcel
            const flattenedAssignments: RiderAssignmentResponse[] = [];

            items.forEach((item: any) => {
                // Check if this is the new format with parcels array
                if (item.parcels && Array.isArray(item.parcels)) {
                    // New format: assignment with multiple parcels
                    const riderName = item.riderInfo?.riderName || item.riderName || "Rider";
                    const riderInfo = item.riderInfo || { riderId: item.riderId, riderName, riderPhoneNumber: item.riderPhoneNumber };

                    // Create one assignment per parcel (flattened)
                    item.parcels.forEach((parcelItem: any) => {
                        const mappedParcel = mapParcelFromNewFormat(parcelItem);
                        flattenedAssignments.push({
                            assignmentId: item.assignmentId,
                            riderName,
                            parcel: mappedParcel, // First parcel for backward compatibility
                            parcels: [mappedParcel], // Keep parcels array
                            status: item.status as AssignmentStatus,
                            assignedAt: item.assignedAt,
                            acceptedAt: item.acceptedAt || 0,
                            completedAt: item.completedAt || 0,
                            amount: item.amount,
                            riderInfo,
                            officeId: item.officeId,
                            payed: item.payed,
                            paymentMethod: item.payementMethod || item.paymentMethod,
                        } as RiderAssignmentResponse);
                    });
                } else if (item.assignmentId && item.parcel) {
                    // Old format: assignment with single parcel
                    const mappedParcel = mapParcelFromNewFormat(item.parcel);
                    flattenedAssignments.push({
                        assignmentId: item.assignmentId,
                        riderName: item.riderName || "Rider",
                        parcel: mappedParcel,
                        parcels: [mappedParcel],
                        status: item.status as AssignmentStatus,
                        assignedAt: item.assignedAt,
                        acceptedAt: item.acceptedAt,
                        completedAt: item.completedAt,
                        amount: item.amount,
                        riderInfo: item.riderInfo,
                        officeId: item.officeId,
                        payed: item.payed,
                        paymentMethod: item.paymentMethod,
                    } as RiderAssignmentResponse);
                } else {
                    // Very old format: just a parcel, need to map it
                    let status: AssignmentStatus = "ASSIGNED";
                    if (item.delivered) {
                        status = "DELIVERED";
                    } else if (item.parcelAssigned) {
                        status = "ACCEPTED";
                    }

                    const mappedParcel = mapParcelFromNewFormat(item);
                    flattenedAssignments.push({
                        assignmentId: item.parcelId || item.assignmentId,
                        riderName: item.driverName || item.riderName || "Rider",
                        parcel: mappedParcel,
                        parcels: [mappedParcel],
                        status: status,
                        assignedAt: item.createdAt || item.assignedAt,
                        acceptedAt: item.parcelAssigned ? (item.updatedAt || item.acceptedAt) : item.acceptedAt,
                        completedAt: item.delivered ? (item.updatedAt || item.completedAt) : item.completedAt,
                    } as RiderAssignmentResponse);
                }
            });

            const mappedContent = flattenedAssignments;

            console.log('Mapped assignments:', mappedContent.length);
            console.log('Original assignments count:', items.length);
            console.log('Flattened parcels count:', mappedContent.length);

            // Note: The API returns assignments (each can have multiple parcels)
            // We flatten them client-side so each parcel gets its own row in the UI
            // Pagination metadata (totalElements, totalPages) is based on assignments, not parcels
            return {
                success: true,
                message: 'Assignments retrieved successfully',
                data: {
                    content: mappedContent, // Flattened: one assignment per parcel
                    totalElements: response.data?.totalElements || 0, // Total assignments from API
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
     * For DELIVERED status, uses parcelId in the URL path
     */
    async updateAssignmentStatus(
        assignmentId: string,
        status: AssignmentStatus,
        confirmationCode?: string,
        reason?: string,
        paymentMethod?: string,
        parcelId?: string
    ): Promise<ApiResponse> {
        try {
            const requestBody: UpdateAssignmentStatusRequest = {
                status,
            };

            // Include fields for DELIVERED status
            if (status === "DELIVERED") {
                if (confirmationCode) {
                    requestBody.confirmationCode = confirmationCode;
                }
                if (paymentMethod) {
                    requestBody.payementMethod = paymentMethod;
                }
                if (parcelId) {
                    requestBody.parcelId = parcelId;
                }
            }
            console.log(">>>>>>>>>>>+++++>>>>>>>>>>");
            console.log(requestBody);
            console.log(">>>>>>>>>>>+++++>>>>>>>>>>");
            // Include fields for RETURNED status
            if (status === "RETURNED") {
                if (reason) {
                    requestBody.returnReason = reason; // Use returnReason instead of cancelationReason
                }
                if (parcelId) {
                    requestBody.parcelId = parcelId;
                }
            }

            // Use assignmentId in the URL path (API expects assignmentId, not parcelId in URL)
            // parcelId goes in the request body for DELIVERED status
            const urlPath = `/assignments/${assignmentId}/status`;

            // Log the request payload for debugging
            console.log('=== API Request Payload ===');
            console.log('URL Path:', urlPath);
            console.log('Request Body:', JSON.stringify(requestBody, null, 2));
            console.log('Assignment ID (in URL):', assignmentId);
            console.log('Parcel ID (in body):', parcelId);
            console.log('Status:', status);

            const response = await this.apiClient.put<{ message: string }>(
                urlPath,
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

        reason?: string,

    ): Promise<ApiResponse> {
        try {
            const requestBody: UpdateAssignmentStatusRequest = {
                status,
            };

            if (status === "DELIVERED" && confirmationCode) {
                requestBody.confirmationCode = confirmationCode;
            }

            if (status === "RETURNED" && reason) {
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

