/**
 * API Configuration
 * Centralized API base URL configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.mandmservicescorp.org/shortly';

export const API_ENDPOINTS = {
    USER: `${API_BASE_URL}/api-user`,
    ADMIN: `${API_BASE_URL}/api-admin`,
    PARCEL: `${API_BASE_URL}/api-parcel`,
    FRONTDESK: `${API_BASE_URL}/api-frontdesk`,
    RIDER: `${API_BASE_URL}/api-rider`,
    OFFICES: `${API_BASE_URL}/api/offices`,
};

export default API_BASE_URL;
