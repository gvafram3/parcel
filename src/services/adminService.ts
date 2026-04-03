import axios, { AxiosInstance } from "axios";
import { API_ENDPOINTS } from "../config/api";
import authService from "./authService";

const API_BASE_URL_ADMIN = API_ENDPOINTS.ADMIN;

/** Assignment-based response (same structure as Manager Reconciliation) */
export interface AdminReconciliationAssignment {
  assignmentId?: string;
  acceptedAt?: number;
  amount?: number;
  amountPayed?: number;
  assignedAt?: number;
  completedAt?: number;
  confirmationCode?: string;
  createdAt?: number;
  deliveryCost?: number;
  inboundCost?: number;
  officeId?: string;
  parcels?: AdminReconciliationParcel[];
  payed?: boolean;
  payedAt?: number;
  payedTo?: string;
  payementMethod?: string | null;
  returnReason?: string | null;
  riderInfo?: {
    riderId: string;
    riderName: string;
    riderPhoneNumber?: string;
  };
  riderId?: string;
  riderName?: string;
  riderPhoneNumber?: string;
  status?: string;
  updatedAt?: number;
}

export interface AdminReconciliationParcel {
  parcelId: string;
  parcelDescription?: string;
  receiverName?: string;
  receiverPhoneNumber?: string;
  receiverAddress?: string;
  parcelAmount: number;
  delivered?: boolean;
  payed?: boolean;
  returned?: boolean;
  paymentMethod?: string | null;
  inboundCost?: number;
  deliveryCost?: number;
}

export interface AdminReconciliationPage {
  content: AdminReconciliationAssignment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class AdminService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL_ADMIN,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Attach auth token
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

    // Basic 401 handling
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
   * Get reconciliations for an office by date (millis)
   * Matches admin route:
   *   GET /api-admin/reconciliations/by-date?officeId=...&date=...
   */
  async getUserActions(page: number = 0, size: number = 20): Promise<ApiResponse> {
    try {
      const response = await this.apiClient.get(
        `/user-actions?page=${page}&size=${size}`
      );
      return { success: true, message: "User actions retrieved", data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch user actions.",
      };
    }
  }

  async searchParcels(filters: {
    officeId?: string;
    isDelivered?: boolean;
    isParcelAssigned?: boolean;
    isPOD?: boolean;
    hasCalled?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', String(filters.page ?? 0));
      params.append('size', String(filters.size ?? 20));
      if (filters.officeId) params.append('officeId', filters.officeId);
      if (filters.isDelivered !== undefined) params.append('isDelivered', String(filters.isDelivered));
      if (filters.isParcelAssigned !== undefined) params.append('isParcelAssigned', String(filters.isParcelAssigned));
      if (filters.isPOD !== undefined) params.append('isPOD', String(filters.isPOD));
      if (filters.hasCalled !== undefined) params.append('hasCalled', String(filters.hasCalled));
      const response = await this.apiClient.get(`/parcels?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to search parcels.' };
    }
  }

  async getOfficeReconciliationsByDate(
    officeId: string,
    dateInMillis: number
  ): Promise<ApiResponse<AdminReconciliationPage>> {
    try {
      const response = await this.apiClient.get(
        `/reconciliations/by-date?officeId=${officeId}&date=${dateInMillis}`
      );

      return {
        success: true,
        message: "Reconciliations retrieved successfully",
        data: response.data,
      };
    } catch (error: any) {
      console.error("Failed to fetch admin reconciliations by date:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch reconciliations. Please try again.",
      };
    }
  }
}

export default new AdminService();

