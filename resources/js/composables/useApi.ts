import axios, { AxiosResponse, AxiosError } from 'axios';

export interface ApiResponse<T = any> {
    data: T
    message?: string
    status: number
}

export function useApi() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

    const get = async <T = any>(url: string, params?: any): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.get<T>(`${baseURL}${url}`, {
                params,
                withCredentials: true, // Important for Sanctum cookies
            })
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }

    const post = async <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.post<T>(`${baseURL}${url}`, data, {
                withCredentials: true, // Important for Sanctum cookies
            })
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }

    const put = async <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.put<T>(`${baseURL}${url}`, data, {
                withCredentials: true, // Important for Sanctum cookies
            })
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }

    const patch = async <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.patch<T>(`${baseURL}${url}`, data, {
                withCredentials: true, // Important for Sanctum cookies
            })
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }

    const deleteRequest = async <T = any>(url: string): Promise<AxiosResponse<T>> => {
        try {
            const response = await axios.delete<T>(`${baseURL}${url}`, {
                withCredentials: true, // Important for Sanctum cookies
            })
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }

    const upload = async <T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> => {
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
            return response
        } catch (error) {
            handleApiError(error as AxiosError)
            throw error
        }
    }

    const getToken = (): string | null => {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    }

    const setToken = (token: string, remember: boolean = false): void => {
        if (remember) {
            localStorage.setItem('auth_token', token)
        } else {
            sessionStorage.setItem('auth_token', token)
        }
    }

    const removeToken = (): void => {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
    }

    const handleApiError = (error: AxiosError): void => {
        if (error.response) {
            const status = error.response.status
            const message = error.response.data || 'An error occurred'

            if (status === 401) {
                // Unauthorized - log but don't logout
                console.warn('Unauthorized access - session may have expired')
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
    }

    // Configure axios to include credentials (cookies) with all requests
    axios.defaults.withCredentials = true

    return {
        get,
        post,
        put,
        patch,
        delete: deleteRequest,
        upload,
        getToken,
        setToken,
        removeToken
    }
}
