import axios, { AxiosResponse, AxiosError } from 'axios';
import { useCallback, useMemo } from 'react';

export interface ApiResponse<T = unknown> {
    data: T
    message?: string
    status: number
}

// Track consecutive 401 errors to prevent infinite loops
let consecutive401Count = 0;
const MAX_CONSECUTIVE_401 = 3;

// Track if we've already shown a 401 warning to prevent console spam
let hasShown401Warning = false;

// Callback for handling unauthorized access (can be customized by components)
type UnauthorizedCallback = (message: string) => void;
let onUnauthorizedCallback: UnauthorizedCallback | null = null;

export function setOnUnauthorizedCallback(callback: UnauthorizedCallback): void {
    onUnauthorizedCallback = callback;
}

export function useApi() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

    const getToken = useCallback((): string | null => {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    }, [])

    const get = useCallback(async <T = unknown>(url: string, params?: Record<string, unknown>): Promise<AxiosResponse<T>> => {
        try {
            // Get authentication token
            const token = getToken();
            
            // DEBUG: Log authentication state
            const cookies = document.cookie;
            console.debug('[API DEBUG] GET request starting', {
                url: `${baseURL}${url}`,
                hasToken: !!token,
                cookiesPresent: cookies.length > 0,
                cookieNames: cookies.split(';').map(c => c.trim().split('=')[0]),
                withCredentials: true,
                userAgent: navigator.userAgent,
            });

            const response = await axios.get<T>(`${baseURL}${url}`, {
                params,
                withCredentials: true, // Important for Sanctum cookies
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            })
            // Reset 401 counter on successful response
            consecutive401Count = 0;
            hasShown401Warning = false;
            return response
        } catch (error) {
            const axiosError = error as AxiosError;
            console.error('[API DEBUG] GET request failed', {
                url: `${baseURL}${url}`,
                status: axiosError.response?.status,
                statusText: axiosError.response?.statusText,
                message: axiosError.message,
                cookies: document.cookie,
            });
            handleApiError(axiosError)
            throw error
        }
    }, [baseURL, getToken])

    const post = useCallback(async <T = unknown>(url: string, data?: Record<string, unknown>): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.post<T>(`${baseURL}${url}`, data, {
                withCredentials: true, // Important for Sanctum cookies
            })
            consecutive401Count = 0;
            hasShown401Warning = false;
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }, [baseURL])

    const put = useCallback(async <T = unknown>(url: string, data?: Record<string, unknown>): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.put<T>(`${baseURL}${url}`, data, {
                withCredentials: true, // Important for Sanctum cookies
            })
            consecutive401Count = 0;
            hasShown401Warning = false;
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }, [baseURL])

    const patch = useCallback(async <T = unknown>(url: string, data?: Record<string, unknown>): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.patch<T>(`${baseURL}${url}`, data, {
                withCredentials: true, // Important for Sanctum cookies
            })
            consecutive401Count = 0;
            hasShown401Warning = false;
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }, [baseURL])

    const deleteRequest = useCallback(async <T = unknown>(url: string): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.delete<T>(`${baseURL}${url}`, {
                withCredentials: true, // Important for Sanctum cookies
            })
            consecutive401Count = 0;
            hasShown401Warning = false;
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }, [baseURL])

    const upload = useCallback(async <T = unknown>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> => {
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await axios.post<T>(`${baseURL}${url}`, formData, {
                withCredentials: true, // Important for Sanctum cookies
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        onProgress(progress)
                    }
                }
            })
            consecutive401Count = 0;
            hasShown401Warning = false;
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }, [baseURL])

    const setToken = useCallback((token: string, remember: boolean = false): void => {
        if (remember) {
            localStorage.setItem('auth_token', token)
        } else {
            sessionStorage.setItem('auth_token', token)
        }
    }, [])

    const removeToken = useCallback((): void => {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
    }, [])

    // DEBUG: Check and log authentication status
    const checkAuthStatus = useCallback((): void => {
        const cookies = document.cookie;
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = metaTag?.getAttribute('content') || '';
        
        console.debug('[AUTH DEBUG] Current authentication status:', {
            cookiesPresent: cookies.length > 0,
            cookieNames: cookies.split(';').map(c => c.trim().split('=')[0]),
            hasCsrfToken: !!csrfToken,
            localStorageToken: !!localStorage.getItem('auth_token'),
            sessionStorageToken: !!sessionStorage.getItem('auth_token'),
        });
    }, [])

    const handleApiError = useCallback((error: AxiosError): void => {
        if (error.response) {
            const status = error.response.status
            const message = error.response.data || 'An error occurred'

            if (status === 401) {
                consecutive401Count++;

                // DEBUG: Log detailed authentication state on 401
                const cookies = document.cookie;
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                console.error('[401 DEBUG] Unauthorized request detailed analysis:', {
                    cookiesPresent: cookies.length > 0,
                    cookieNames: cookies.split(';').map(c => c.trim().split('=')[0]),
                    hasCsrfToken: !!metaTag?.getAttribute('content'),
                    localStorageToken: !!localStorage.getItem('auth_token'),
                    sessionStorageToken: !!sessionStorage.getItem('auth_token'),
                    consecutive401Count,
                    url: error.config?.url,
                    method: error.config?.method,
                });

                // Prevent infinite loops by limiting consecutive 401 errors
                if (consecutive401Count >= MAX_CONSECUTIVE_401) {
                    console.error('Too many consecutive 401 errors. Stopping retry attempts.');

                    // Call the unauthorized callback if set
                    if (onUnauthorizedCallback) {
                        onUnauthorizedCallback('Session expired. Please log in again.');
                    }
                    return;
                }

                // Only show warning once to prevent console spam
                if (!hasShown401Warning) {
                    console.warn('Unauthorized access - session may have expired');
                    hasShown401Warning = true;
                }
            } else if (status === 403) {
                // Forbidden
                console.warn('Forbidden - insufficient permissions')
            } else if (status === 422) {
                // Validation error
                console.warn('Validation error:', message)
            } else {
                console.error(`API Error ${status}:`, message)
            }
        } else if (error.request) {
            // Network error
            console.error('Network error:', error.message)
        } else {
            // Other error
            console.error('Request error:', error.message)
        }
    }, [])

    // Configure axios to include credentials (cookies) with all requests
    axios.defaults.withCredentials = true

    return useMemo(() => ({
        get,
        post,
        put,
        patch,
        delete: deleteRequest,
        upload,
        getToken,
        setToken,
        removeToken,
        setOnUnauthorizedCallback,
        checkAuthStatus,
    }), [get, post, put, patch, deleteRequest, upload, getToken, setToken, removeToken, checkAuthStatus])
}
