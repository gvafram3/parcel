import axios, { AxiosInstance } from "axios";
import { API_ENDPOINTS } from "../config/api";
import authService from "./authService";

export interface CallCenterStatsResponse {
  totalDeliveredYesterday: number;
  reached: number;
  unreachable: number;
  notCalled: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class CallCenterService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_ENDPOINTS.CALL_CENTER,
      headers: {
        "Content-Type": "application/json",
      },
    });

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

    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get high-level call center statistics for yesterday's delivered parcels.
   * Backend reference: GET /api-call-center/stats (CallCenterStatsResponse)
   */
  async getStats(): Promise<ApiResponse<CallCenterStatsResponse>> {
    try {
      const response = await this.apiClient.get<CallCenterStatsResponse>("/stats");
      return {
        success: true,
        message: "Call center stats retrieved successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("Failed to fetch call center stats:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch call center statistics. Please try again.",
      };
    }
  }

  /**
   * Get parcels that have not yet been called by the call center.
   * Backend reference: GET /api-call-center/parcels/uncalled
   */
  async getUncalledParcels(page = 0, size = 20): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('size', String(size));
      const response = await this.apiClient.get(`/parcels/uncalled?${params.toString()}`);
      return {
        success: true,
        message: "Uncalled parcels retrieved successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("Failed to fetch uncalled parcels:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch uncalled parcels. Please try again.",
      };
    }
  }

  /**
   * Get undelivered parcels not yet called by call center (pre-delivery queue).
   * Backend reference: GET /api-call-center/parcels/not-delivered-uncalled
   */
  async getNotDeliveredUncalled(filters: {
    page?: number;
    size?: number;
    officeId?: string;
    fromDate?: number;
    toDate?: number;
    parcelId?: string;
    receiverName?: string;
    receiverPhone?: string;
  }): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', String(filters.page ?? 0));
      params.append('size', String(filters.size ?? 20));

      if (filters.officeId) params.append('officeId', filters.officeId);
      if (filters.fromDate) params.append('fromDate', String(filters.fromDate));
      if (filters.toDate) params.append('toDate', String(filters.toDate));
      if (filters.parcelId) params.append('parcelId', filters.parcelId);
      if (filters.receiverName) params.append('receiverName', filters.receiverName);
      if (filters.receiverPhone) params.append('receiverPhone', filters.receiverPhone);

      const response = await this.apiClient.get<any>(`/parcels/not-delivered-uncalled?${params.toString()}`);

      const data = response.data;
      const content = data?.content ?? [];
      return {
        success: true,
        message: 'Undelivered parcels retrieved successfully',
        data: {
          content,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          number: data?.number ?? 0,
          size: data?.size ?? (filters.size ?? 20),
        },
      };
    } catch (error: any) {
      console.error('Get not-delivered uncalled parcels error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Failed to retrieve undelivered parcels.',
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
   * Get delivered parcels for call center follow-up operations (post-delivery).
   * Backend reference: GET /api-call-center/parcels/delivered-uncalled
   */
  async getDeliveredUncalled(filters: {
    page?: number;
    size?: number;
    officeId?: string;
    fromDate?: number;
    toDate?: number;
    followUpStatus?: string;
    parcelId?: string;
    receiverName?: string;
    receiverPhone?: string;
  }): Promise<ApiResponse> {
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
      if (filters.parcelId) params.append('parcelId', filters.parcelId);
      if (filters.receiverName) params.append('receiverName', filters.receiverName);
      if (filters.receiverPhone) params.append('receiverPhone', filters.receiverPhone);

      const response = await this.apiClient.get<any>(`/parcels/delivered-uncalled?${params.toString()}`);

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
      console.error('Get delivered uncalled parcels error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Failed to retrieve delivered parcels.',
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
   * Get delivered parcels for call center follow-up operations (CALLER role).
   * Uses the delivered-uncalled parcels endpoint which returns parcels
   * that the call center hasn't spoken to yet (those needing follow-up).
   * Backend reference: GET /api-call-center/parcels/delivered-uncalled
   */
  async getDeliveredParcels(filters: {
    page?: number;
    size?: number;
    officeId?: string;
    fromDate?: number;
    toDate?: number;
    followUpStatus?: string;
  }): Promise<ApiResponse> {
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

      // Use the delivered-uncalled API endpoint
      const response = await this.apiClient.get<any>(`/parcels/delivered-uncalled?${params.toString()}`);

      const data = response.data;
      const content = data?.content ?? [];
      return {
        success: true,
        message: 'Parcels retrieved successfully',
        data: {
          content,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          number: data?.number ?? 0,
          size: data?.size ?? (filters.size ?? 20),
        },
      };
    } catch (error: any) {
      console.error('Get call center parcels error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Failed to retrieve parcels.',
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
   * Update call outcome for a parcel (CALLER role).
   * Backend reference: PUT /api-call-center/parcels/:parcelId/call-outcome
   * callOutCome: "REACHED" | "UNREACHABLE" | "DELIVERED"
   * If REACHED, hasCallCenterSpokenToClient is automatically set to true.
   */
  async updateCallOutcome(
    parcelId: string,
    callOutCome: "REACHED" | "UNREACHABLE" | "DELIVERED",
    remark?: string
  ): Promise<ApiResponse> {
    try {
      const body: { callOutCome: string; remark?: string } = { callOutCome };
      if (remark) body.remark = remark;
      const response = await this.apiClient.put<any>(
        `/parcels/${parcelId}/call-outcome`,
        body
      );
      return {
        success: true,
        message: 'Call outcome recorded successfully',
        data: response.data,
      };
    } catch (error: any) {
      console.error('Update call outcome error:', error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Failed to record call outcome.',
      };
    }
  }
}

export default new CallCenterService();

