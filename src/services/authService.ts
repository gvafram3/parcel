import axios, { AxiosInstance } from 'axios';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = API_ENDPOINTS.USER;

interface LoginCredentials {
    email?: string;
    phoneNumber?: string;
    password: string;
}

// Updated to match actual API response
interface AuthResponse {
    name: string;
    phoneNumber: string;
    role: string;
    token: string;
    userId: string;
    stationId?: string;
    email?: string;
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
}

interface ApiResponse {
    success?: boolean;
    message?: string;
    data?: AuthResponse;
}

class AuthService {
    private apiClient: AxiosInstance;
    private tokenKey = 'auth_token';
    private refreshTokenKey = 'refresh_token';
    private userKey = 'user_data';

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include token
        this.apiClient.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor to handle token refresh
        this.apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = this.getRefreshToken();
                        if (refreshToken) {
                            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                                refreshToken,
                            });

                            const { token } = response.data;
                            this.setToken(token);

                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return this.apiClient(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        this.logout();
                        window.location.href = '/login';
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Login with email and password
     */
    async loginWithEmail(email: string, password: string): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            const response = await this.apiClient.post<AuthResponse>('/login', {
                email: email.toLowerCase().trim(),
                password,
            });

            if (response.data) {
                const userData = response.data;
                this.setToken(userData.token);

                // Store user data in the expected format, including office information
                this.setUser({
                    id: userData.userId,
                    name: userData.name,
                    email: userData.email || email,
                    phoneNumber: userData.phoneNumber,
                    role: userData.role,
                    stationId: userData.stationId,
                    office: userData.office, // Store full office object
                });

                return {
                    success: true,
                    message: 'Login successful',
                    data: {
                        token: userData.token,
                        user: {
                            id: userData.userId,
                            name: userData.name,
                            email: userData.email || email,
                            phoneNumber: userData.phoneNumber,
                            role: userData.role,
                            stationId: userData.stationId,
                            office: userData.office,
                        }
                    }
                };
            }

            return {
                success: false,
                message: 'Login failed. Please try again.',
            };
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please check your credentials and try again.',
            };
        }
    }

    /**
     * Login with phone number and password
     */
    async loginWithPhone(phoneNumber: string, password: string): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            const response = await this.apiClient.post<AuthResponse>('/login', {
                phoneNumber: phoneNumber.trim(),
                password,
            });

            console.log("Phone login response:", response.data);

            if (response.data) {
                const userData = response.data;
                this.setToken(userData.token);
                console.log("Stored token:", userData.token);
                console.log("User data from API:", userData);
                // Store user data in the expected format, including office information
                this.setUser({
                    id: userData.userId,
                    name: userData.name,
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber,
                    role: userData.role,
                    stationId: userData.stationId,
                    office: userData.office, // Store full office object
                });

                console.log("Stored user data:", this.getUser());

                return {
                    success: true,
                    message: 'Login successful',
                    data: {
                        token: userData.token,
                        user: {
                            id: userData.userId,
                            name: userData.name,
                            email: userData.email || '',
                            phoneNumber: userData.phoneNumber,
                            role: userData.role,
                            stationId: userData.stationId,
                            office: userData.office,
                        }
                    }
                };
            }

            return {
                success: false,
                message: 'Login failed. Please try again.',
            };
        } catch (error: any) {
            console.error('Phone login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please check your credentials and try again.',
            };
        }
    }

    /**
     * Logout user
     */
    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
    }

    /**
     * Get stored token
     */
    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    /**
     * Set token
     */
    private setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    /**
     * Set refresh token
     */
    private setRefreshToken(refreshToken: string): void {
        localStorage.setItem(this.refreshTokenKey, refreshToken);
    }

    /**
     * Get stored user
     */
    getUser(): any {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Set user
     */
    private setUser(user: any): void {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Get authentication header
     */
    getAuthHeader(): { Authorization: string } | {} {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /**
     * Check if user is admin
     */
    isAdmin(): boolean {
        const user = this.getUser();
        return user?.role?.toUpperCase() === 'ADMIN';
    }

    /**
     * Get user ID
     */
    getUserId(): string | null {
        const user = this.getUser();
        return user?.id || null;
    }

    /**
     * Request password reset - sends OTP to user's phone
     */
    async requestPasswordReset(phoneNumber: string): Promise<{ success: boolean; message: string; data?: { verificationId?: string } }> {
        try {
            const response = await this.apiClient.post<{ message: string; id?: string }>('/request-password-reset', {
                phoneNumber: phoneNumber.trim(),
            });

            return {
                success: true,
                message: response.data.message || 'OTP sent successfully to your phone',
                data: {
                    verificationId: response.data.id,
                },
            };
        } catch (error: any) {
            console.error('Request password reset error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP. Please check your phone number and try again.',
            };
        }
    }

    /**
     * Reset password using verification ID (OTP) and new password
     */
    async resetPassword(verificationId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await this.apiClient.post<{ message: string }>('/reset-password', {
                verificationId: verificationId.trim(),
                newPassword: newPassword.trim(),
            });

            return {
                success: true,
                message: response.data.message || 'Password reset successfully',
            };
        } catch (error: any) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to reset password. Please check your OTP and try again.',
            };
        }
    }
}

export default new AuthService();
