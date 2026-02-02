import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import route from '@/routes';

// API client for React Query
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

// Hook for GET requests with caching
export function useApiQuery<T>(
    key: string | string[],
    endpoint: string,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        refetchInterval?: number;
    },
) {
    const queryKey = Array.isArray(key) ? key : [key];

    return useQuery({
        queryKey,
        queryFn: () => apiClient<T>(endpoint),
        ...options,
    });
}

// Hook for POST/PUT/DELETE mutations
export function useApiMutation<T, R = unknown>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: {
        onSuccess?: (data: R) => void;
        onError?: (error: Error) => void;
        invalidates?: string | string[];
    },
) {
    const queryClient = useQueryClient();

    return useMutation<R, Error, T>({
        mutationFn: (data) =>
            apiClient<R>(endpoint, {
                method,
                body: JSON.stringify(data),
            }),
        onSuccess: (data) => {
            if (options?.onSuccess) {
                options.onSuccess(data);
            }
            if (options?.invalidates) {
                const keys = Array.isArray(options.invalidates) ? options.invalidates : [options.invalidates];
                keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
            }
        },
        onError: options?.onError,
    });
}

// Pre-configured hooks for common operations
export function usePatients(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('patients', route('patients.index'), options);
}

export function usePatient(id: number) {
    return useApiQuery<any>(`patient-${id}`, route('patients.show', { patient: id }));
}

export function useMedicines(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('medicines', route('pharmacy.medicines.index'), options);
}

export function useLabTests(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('lab-tests', route('laboratory.lab-tests.index'), options);
}

export function useAppointments(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('appointments', route('appointments.index'), options);
}

// Mutation hooks
export function useCreatePatient() {
    return useApiMutation('POST', route('patients.store'), {
        invalidates: 'patients',
    });
}

export function useUpdatePatient(id: number) {
    return useApiMutation('PUT', route('patients.update', { patient: id }), {
        invalidates: ['patients', `patient-${id}`],
    });
}

export function useDeletePatient(id: number) {
    return useApiMutation('DELETE', route('patients.destroy', { patient: id }), {
        invalidates: 'patients',
    });
}
import route from '@/routes';

// API client for React Query
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

// Hook for GET requests with caching
export function useApiQuery<T>(
    key: string | string[],
    endpoint: string,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        refetchInterval?: number;
    },
) {
    const queryKey = Array.isArray(key) ? key : [key];

    return useQuery({
        queryKey,
        queryFn: () => apiClient<T>(endpoint),
        ...options,
    });
}

// Hook for POST/PUT/DELETE mutations
export function useApiMutation<T, R = unknown>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: {
        onSuccess?: (data: R) => void;
        onError?: (error: Error) => void;
        invalidates?: string | string[];
    },
) {
    const queryClient = useQueryClient();

    return useMutation<R, Error, T>({
        mutationFn: (data) =>
            apiClient<R>(endpoint, {
                method,
                body: JSON.stringify(data),
            }),
        onSuccess: (data) => {
            if (options?.onSuccess) {
                options.onSuccess(data);
            }
            if (options?.invalidates) {
                const keys = Array.isArray(options.invalidates) ? options.invalidates : [options.invalidates];
                keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
            }
        },
        onError: options?.onError,
    });
}

// Pre-configured hooks for common operations
export function usePatients(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('patients', route('patients.index'), options);
}

export function usePatient(id: number) {
    return useApiQuery<any>(`patient-${id}`, route('patients.show', { patient: id }));
}

export function useMedicines(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('medicines', route('pharmacy.medicines.index'), options);
}

export function useLabTests(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('lab-tests', route('laboratory.lab-tests.index'), options);
}

export function useAppointments(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<any[]>('appointments', route('appointments.index'), options);
}

// Mutation hooks
export function useCreatePatient() {
    return useApiMutation('POST', route('patients.store'), {
        invalidates: 'patients',
    });
}

export function useUpdatePatient(id: number) {
    return useApiMutation('PUT', route('patients.update', { patient: id }), {
        invalidates: ['patients', `patient-${id}`],
    });
}

export function useDeletePatient(id: number) {
    return useApiMutation('DELETE', route('patients.destroy', { patient: id }), {
        invalidates: 'patients',
    });
}

