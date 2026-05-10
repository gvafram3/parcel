import axios, { AxiosInstance } from 'axios';
import authService from './authService';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL_ADMIN = API_ENDPOINTS.ADMIN;
const API_BASE_URL_USER = API_ENDPOINTS.USER;

interface CreateUserRequest {
    name: string;
    email: string;
    password?: string; // Optional according to API spec
    phoneNumber: string;
    role: "ADMIN" | "RIDER" | "FRONTDESK" | "MANAGER" | "CALLER";
    officeId: string;
}

interface UserResponse {
    success: boolean;
    message: string;
    data?: any;
}

interface PageableRequest {
    page?: number;
    size?: number;
    sort?: string[];
}

interface ApiUser {
    userId: string;
    name: string;
    phoneNumber: string;
    email?: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
    office?: {
        id: string;
        name: string;
        code: string;
        address?: string;
        phoneNumber?: string | null;
        manager?: any | null;
        location?: {
            id: string;
            name: string;
            region: string;
            country: string;
            createdAt?: number;
            updatedAt?: number;
        };
        createdAt?: number;
        updatedAt?: number;
    };
    role: "ADMIN" | "RIDER" | "FRONTDESK" | "MANAGER" | "CALLER";
    createdAt?: number;
    updatedAt?: number;
    token?: string; // Token may be included in login/registration responses
}

interface PageUser {
    content: ApiUser[];
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
}

class UserService {
    private apiClientAdmin: AxiosInstance;
    private apiClientUser: AxiosInstance;

    constructor() {
        // Admin API Client
        this.apiClientAdmin = axios.create({
            baseURL: API_BASE_URL_ADMIN,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // User API Client (for endpoints under /api-user)
        this.apiClientUser = axios.create({
            baseURL: API_BASE_URL_USER,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const addAuthInterceptor = (config: any) => {
            const token = authService.getToken();
            console.log('Auth interceptor - Token exists:', !!token);
            if (token) {
                console.log('Auth interceptor - Adding token to request:', config.url);
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.warn('Auth interceptor - No token found!');
            }
            return config;
        };
        const addErrorInterceptor = (error: any) => {
            console.error('API Error interceptor:', error.response?.status, error.response?.data);
            if (error.response?.status === 401) {
                console.error('401 Unauthorized - Logging out');
                authService.logout();
                window.location.href = '/login';
            }
            if (error.response?.status === 403) {
                console.error('403 Forbidden - User does not have permission');
                console.error('Response data:', error.response?.data);
            }
            return Promise.reject(error);
        };

        // Add request interceptor to include token for Admin API
        this.apiClientAdmin.interceptors.request.use(addAuthInterceptor, (error) => Promise.reject(error));

        // Add response interceptor to handle errors for Admin API
        this.apiClientAdmin.interceptors.response.use((response) => response, addErrorInterceptor);

        // Add same interceptors for User API Client
        this.apiClientUser.interceptors.request.use(addAuthInterceptor, (error) => Promise.reject(error));
        this.apiClientUser.interceptors.response.use((response) => response, addErrorInterceptor);
    }

    /**
     * Create a new user (using Admin API)
     */
    async createUser(userData: CreateUserRequest): Promise<UserResponse> {
        try {
            const response = await this.apiClientAdmin.post<UserResponse>(
                '/register',
                userData
            );

            return {
                success: true,
                message: 'User created successfully',
                data: response.data.data || response.data,
            };
        } catch (error: any) {
            console.error('Create user error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create user. Please try again.',
            };
        }
    }

    /**
     * Get all users with pagination (using Admin API)
     */
    async getUsers(pageable: PageableRequest = { page: 0, size: 50 }): Promise<{ success: boolean; message: string; data?: PageUser }> {
        try {
            // Check if user has ADMIN role
            const currentUser = authService.getUser();
            console.log('Current user:', currentUser);
            console.log('Current user role:', currentUser?.role);
            
            if (!currentUser || currentUser.role !== 'ADMIN') {
                console.error('User is not ADMIN. Role:', currentUser?.role);
                return {
                    success: false,
                    message: 'You must be an admin to view users',
                };
            }

            // Call endpoint without pagination parameters (backend doesn't support them)
            const url = `/users`;
            console.log('Fetching users from:', url);
            console.log('Full URL:', `${API_BASE_URL_ADMIN}${url}`);

            const response = await this.apiClientAdmin.get<any>(url);

            console.log('Users response:', response.data);

            // If response is an array, wrap it in pagination format
            const users = Array.isArray(response.data) ? response.data : response.data?.content || [];
            
            return {
                success: true,
                message: 'Users retrieved successfully',
                data: {
                    content: users,
                    totalElements: users.length,
                    totalPages: 1,
                    number: 0,
                    size: users.length,
                    first: true,
                    last: true,
                    numberOfElements: users.length,
                    empty: users.length === 0,
                },
            };
        } catch (error: any) {
            console.error('Get users error:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            console.error('Error status:', error.response?.status);
            
            if (error.response?.status === 403) {
                return {
                    success: false,
                    message: 'Access denied. You do not have permission to view users. Please ensure you are logged in as an admin.',
                };
            }
            
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to retrieve users. Please try again.',
            };
        }
    }

    /**
     * Delete a user (using Admin API)
     */
    async deleteUser(userId: string): Promise<UserResponse> {
        try {
            const response = await this.apiClientAdmin.delete<UserResponse>(
                `/user/${userId}`
            );

            return {
                success: true,
                message: 'User deleted successfully',
                data: response.data.data || response.data,
            };
        } catch (error: any) {
            console.error('Delete user error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete user. Please try again.',
            };
        }
    }

    /**
     * Add existing user (by phone) to an office/station using Admin API
     * Expects payload: { officeId: string, userPhoneNumber: string }
     */
    async addUserToOffice(payload: { officeId: string; userPhoneNumber: string }): Promise<UserResponse> {
        try {
            const response = await this.apiClientUser.post<UserResponse>('/add-user-office', payload);
            return {
                success: true,
                message: response.data?.message || 'User added to office successfully',
                data: response.data?.data || response.data,
            };
        } catch (error: any) {
            console.error('Add user to office error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add user to office. Please try again.',
            };
        }
    }
}

/**
 * Helper function to get office ID from user
 * Returns the office ID string if available, undefined otherwise
 */
export const getUserOfficeId = (user: ApiUser): string | undefined => {
    return user.office?.id;
};

export type { ApiUser, PageUser, PageableRequest };

export default new UserService();

