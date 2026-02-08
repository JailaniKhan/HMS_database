import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import type { Doctor, Patient, Appointment, Medicine, LabTest, Bill } from '../types';
import { logger } from '@/services/logger';

// ============================================================================
// Auth State Types
// ============================================================================
interface AuthState {
    user: {
        id: number;
        name: string;
        username: string;
        role: string;
    } | null;
    isAuthenticated: boolean;
    permissions: string[];
}

type AuthAction =
    | { type: 'LOGIN'; payload: { user: AuthState['user']; permissions: string[] } }
    | { type: 'LOGOUT' }
    | { type: 'UPDATE_PERMISSIONS'; payload: string[] };

// ============================================================================
// Patient State Types
// ============================================================================
interface PatientState {
    patients: Patient[];
    selectedPatient: Patient | null;
    loading: boolean;
    error: string | null;
    totalPages: number;
    currentPage: number;
    filters: {
        search: string;
        gender: string;
        bloodGroup: string;
    };
}

type PatientAction =
    | { type: 'SET_PATIENTS'; payload: Patient[] }
    | { type: 'SET_SELECTED_PATIENT'; payload: Patient | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_CURRENT_PAGE'; payload: number }
    | { type: 'SET_FILTERS'; payload: Partial<PatientState['filters']> }
    | { type: 'ADD_PATIENT'; payload: Patient }
    | { type: 'UPDATE_PATIENT'; payload: Patient }
    | { type: 'REMOVE_PATIENT'; payload: number };

// ============================================================================
// UI State Types
// ============================================================================
interface UIState {
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark' | 'system';
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
        timestamp: Date;
    }>;
    modals: {
        patientForm: boolean;
        doctorForm: boolean;
        appointmentForm: boolean;
        medicineForm: boolean;
        labTestForm: boolean;
        billForm: boolean;
    };
}

type UIAction =
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
    | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id' | 'timestamp'> }
    | { type: 'REMOVE_NOTIFICATION'; payload: string }
    | { type: 'CLEAR_NOTIFICATIONS' }
    | { type: 'OPEN_MODAL'; payload: keyof UIState['modals'] }
    | { type: 'CLOSE_MODAL'; payload: keyof UIState['modals'] }
    | { type: 'TOGGLE_MODAL'; payload: keyof UIState['modals'] };

// ============================================================================
// Reducers
// ============================================================================

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                permissions: action.payload.permissions,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                permissions: [],
            };
        case 'UPDATE_PERMISSIONS':
            return {
                ...state,
                permissions: action.payload,
            };
        default:
            return state;
    }
};

const patientReducer = (state: PatientState, action: PatientAction): PatientState => {
    switch (action.type) {
        case 'SET_PATIENTS':
            return { ...state, patients: action.payload };
        case 'SET_SELECTED_PATIENT':
            return { ...state, selectedPatient: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload };
        case 'SET_FILTERS':
            return {
                ...state,
                filters: { ...state.filters, ...action.payload },
                currentPage: 1,
            };
        case 'ADD_PATIENT':
            return {
                ...state,
                patients: [action.payload, ...state.patients],
            };
        case 'UPDATE_PATIENT':
            return {
                ...state,
                patients: state.patients.map(p =>
                    p.id === action.payload.id ? action.payload : p
                ),
            };
        case 'REMOVE_PATIENT':
            return {
                ...state,
                patients: state.patients.filter(p => p.id !== action.payload),
            };
        default:
            return state;
    }
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    { ...action.payload, id: Date.now().toString(), timestamp: new Date() },
                ],
            };
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
            };
        case 'CLEAR_NOTIFICATIONS':
            return { ...state, notifications: [] };
        case 'OPEN_MODAL':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: true },
            };
        case 'CLOSE_MODAL':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: false },
            };
        case 'TOGGLE_MODAL':
            return {
                ...state,
                modals: { ...state.modals, [action.payload]: !state.modals[action.payload] },
            };
        default:
            return state;
    }
};

// ============================================================================
// Initial States
// ============================================================================

const initialAuthState: AuthState = {
    user: null,
    isAuthenticated: false,
    permissions: [],
};

const initialPatientState: PatientState = {
    patients: [],
    selectedPatient: null,
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 1,
    filters: {
        search: '',
        gender: '',
        bloodGroup: '',
    },
};

const initialUIState: UIState = {
    sidebarCollapsed: false,
    theme: 'light',
    notifications: [],
    modals: {
        patientForm: false,
        doctorForm: false,
        appointmentForm: false,
        medicineForm: false,
        labTestForm: false,
        billForm: false,
    },
};

// ============================================================================
// Context Types
// ============================================================================

interface StoreContextType {
    auth: {
        state: AuthState;
        dispatch: React.Dispatch<AuthAction>;
        login: (user: AuthState['user'], permissions: string[]) => void;
        logout: () => void;
        updatePermissions: (permissions: string[]) => void;
    };
    patients: {
        state: PatientState;
        dispatch: React.Dispatch<PatientAction>;
        setPatients: (patients: Patient[]) => void;
        setSelectedPatient: (patient: Patient | null) => void;
        setLoading: (loading: boolean) => void;
        setError: (error: string | null) => void;
        setCurrentPage: (page: number) => void;
        setFilters: (filters: Partial<PatientState['filters']>) => void;
        addPatient: (patient: Patient) => void;
        updatePatient: (patient: Patient) => void;
        removePatient: (patientId: number) => void;
    };
    ui: {
        state: UIState;
        dispatch: React.Dispatch<UIAction>;
        toggleSidebar: () => void;
        setTheme: (theme: 'light' | 'dark' | 'system') => void;
        addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
        removeNotification: (id: string) => void;
        clearNotifications: () => void;
        openModal: (modal: keyof UIState['modals']) => void;
        closeModal: (modal: keyof UIState['modals']) => void;
        toggleModal: (modal: keyof UIState['modals']) => void;
    };
}

// ============================================================================
// Context Creation
// ============================================================================

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
    const [patientState, patientDispatch] = useReducer(patientReducer, initialPatientState);
    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

    /**
     * SECURITY FIX: Removed localStorage persistence for auth data
     * 
     * Reason: Storing authentication data in localStorage creates XSS vulnerabilities.
     * Malicious scripts can access localStorage and steal user tokens/permissions.
     * 
     * Solution: 
     * - Auth state is now stored only in memory (React state)
     - Auth persistence is handled by the backend via HttpOnly cookies (Sanctum)
     * - Only non-sensitive UI preferences (theme, sidebar) are stored in localStorage
     * 
     * This ensures that even if XSS occurs, the attacker cannot steal session data
     * from localStorage since it's no longer stored there.
     */

    // Load only UI preferences from localStorage (non-sensitive data)
    useEffect(() => {
        const savedUI = localStorage.getItem('hms-ui-preferences');
        if (savedUI) {
            try {
                const parsed = JSON.parse(savedUI);
                if (parsed.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
                    uiDispatch({ type: 'SET_THEME', payload: parsed.theme });
                }
                if (typeof parsed.sidebarCollapsed === 'boolean') {
                    // Apply sidebar state directly without toggle
                    if (parsed.sidebarCollapsed !== uiState.sidebarCollapsed) {
                        uiDispatch({ type: 'TOGGLE_SIDEBAR' });
                    }
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    logger.error('Failed to parse saved UI preferences', { error: error instanceof Error ? error.message : 'Unknown error' }, error instanceof Error ? error : undefined);
                }
            }
        }
    }, []); // Run only once on mount

    // Save only UI preferences to localStorage (non-sensitive data)
    useEffect(() => {
        const preferences = {
            theme: uiState.theme,
            sidebarCollapsed: uiState.sidebarCollapsed,
        };
        localStorage.setItem('hms-ui-preferences', JSON.stringify(preferences));
    }, [uiState.theme, uiState.sidebarCollapsed]);

    // ============================================================================
    // Auth Actions
    // ============================================================================

    const login = useCallback((user: AuthState['user'], permissions: string[]) => {
        authDispatch({ type: 'LOGIN', payload: { user, permissions } });
    }, []);

    const logout = useCallback(() => {
        authDispatch({ type: 'LOGOUT' });
        // Clear any cached data
        patientDispatch({ type: 'SET_PATIENTS', payload: [] });
    }, []);

    const updatePermissions = useCallback((permissions: string[]) => {
        authDispatch({ type: 'UPDATE_PERMISSIONS', payload: permissions });
    }, []);

    // ============================================================================
    // Patient Actions
    // ============================================================================

    const setPatients = useCallback((patients: Patient[]) => {
        patientDispatch({ type: 'SET_PATIENTS', payload: patients });
    }, []);

    const setSelectedPatient = useCallback((patient: Patient | null) => {
        patientDispatch({ type: 'SET_SELECTED_PATIENT', payload: patient });
    }, []);

    const setLoading = useCallback((loading: boolean) => {
        patientDispatch({ type: 'SET_LOADING', payload: loading });
    }, []);

    const setError = useCallback((error: string | null) => {
        patientDispatch({ type: 'SET_ERROR', payload: error });
    }, []);

    const setCurrentPage = useCallback((page: number) => {
        patientDispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    }, []);

    const setFilters = useCallback((filters: Partial<PatientState['filters']>) => {
        patientDispatch({ type: 'SET_FILTERS', payload: filters });
    }, []);

    const addPatient = useCallback((patient: Patient) => {
        patientDispatch({ type: 'ADD_PATIENT', payload: patient });
    }, []);

    const updatePatient = useCallback((patient: Patient) => {
        patientDispatch({ type: 'UPDATE_PATIENT', payload: patient });
    }, []);

    const removePatient = useCallback((patientId: number) => {
        patientDispatch({ type: 'REMOVE_PATIENT', payload: patientId });
    }, []);

    // ============================================================================
    // UI Actions
    // ============================================================================

    const toggleSidebar = useCallback(() => {
        uiDispatch({ type: 'TOGGLE_SIDEBAR' });
    }, []);

    const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
        uiDispatch({ type: 'SET_THEME', payload: theme });
    }, []);

    const addNotification = useCallback((notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => {
        uiDispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }, []);

    const removeNotification = useCallback((id: string) => {
        uiDispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, []);

    const clearNotifications = useCallback(() => {
        uiDispatch({ type: 'CLEAR_NOTIFICATIONS' });
    }, []);

    const openModal = useCallback((modal: keyof UIState['modals']) => {
        uiDispatch({ type: 'OPEN_MODAL', payload: modal });
    }, []);

    const closeModal = useCallback((modal: keyof UIState['modals']) => {
        uiDispatch({ type: 'CLOSE_MODAL', payload: modal });
    }, []);

    const toggleModal = useCallback((modal: keyof UIState['modals']) => {
        uiDispatch({ type: 'TOGGLE_MODAL', payload: modal });
    }, []);

    // ============================================================================
    // Memoized Context Value
    // ============================================================================

    const value = useMemo<StoreContextType>(() => ({
        auth: {
            state: authState,
            dispatch: authDispatch,
            login,
            logout,
            updatePermissions,
        },
        patients: {
            state: patientState,
            dispatch: patientDispatch,
            setPatients,
            setSelectedPatient,
            setLoading,
            setError,
            setCurrentPage,
            setFilters,
            addPatient,
            updatePatient,
            removePatient,
        },
        ui: {
            state: uiState,
            dispatch: uiDispatch,
            toggleSidebar,
            setTheme,
            addNotification,
            removeNotification,
            clearNotifications,
            openModal,
            closeModal,
            toggleModal,
        },
    }), [
        authState,
        patientState,
        uiState,
        login,
        logout,
        updatePermissions,
        setPatients,
        setSelectedPatient,
        setLoading,
        setError,
        setCurrentPage,
        setFilters,
        addPatient,
        updatePatient,
        removePatient,
        toggleSidebar,
        setTheme,
        addNotification,
        removeNotification,
        clearNotifications,
        openModal,
        closeModal,
        toggleModal,
    ]);

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

// ============================================================================
// Custom Hooks
// ============================================================================

export const useAuthStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useAuthStore must be used within a StoreProvider');
    }
    return context.auth;
};

export const usePatientStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('usePatientStore must be used within a StoreProvider');
    }
    return context.patients;
};

export const useUIStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useUIStore must be used within a StoreProvider');
    }
    return context.ui;
};

export const useAppStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within a StoreProvider');
    }
    return context;
};
