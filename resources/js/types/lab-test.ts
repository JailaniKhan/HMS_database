export interface LabTest {
    id: number;
    test_id: string;
    name: string;
    description: string | null;
    procedure: string | null;
    cost: number;
    turnaround_time: number;
    unit: string | null;
    normal_values: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface LabTestResult {
    id: number;
    result_id: string;
    lab_test_id: number;
    patient_id: number;
    performed_at: string;
    results: string;
    status: string;
    notes: string;
    abnormal_flags: string;
    created_at: string;
    updated_at: string;
    patient?: Patient;
    labTest?: LabTest;
}

export interface LabTestRequest {
    id: number;
    request_id: string;
    patient_id: number;
    doctor_id: number;
    test_name: string;
    test_type: LabTestRequestType;
    status: LabTestRequestStatus;
    scheduled_at: string;
    completed_at: string | null;
    notes: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    patient?: Patient;
    doctor?: Doctor;
    createdBy?: User;
    results?: LabTestResult[];
}

export type LabTestRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type LabTestRequestType = 'routine' | 'urgent' | 'stat';

export interface LabTestRequestFormData {
    patient_id: string;
    doctor_id: string;
    test_name: string;
    test_type: LabTestRequestType;
    scheduled_at: string;
    notes: string;
    status?: LabTestRequestStatus;
}

// Forward declarations - these types are defined in other files and re-exported via index.ts
type Patient = import('./patient').Patient;
type Doctor = import('./doctor').Doctor;
type User = import('./index.d').User;

export interface LabTestFormData {
    name: string;
    description: string | null;
    procedure: string | null;
    cost: number;
    turnaround_time: number;
    unit: string | null;
    normal_values: string | null;
    status: string;
}

export interface LabTestResultFormData {
    lab_test_id: string;
    patient_id: string;
    performed_at: string;
    results: string;
    status: string;
    notes: string;
    abnormal_flags: string;
}

export interface LabTestSearchFilters {
    query?: string;
    status?: string;
    category?: string;
}

export interface LabTestResultSearchFilters {
    query?: string;
    status?: string;
    patient_id?: string;
    lab_test_id?: string;
}

export interface LabTestRequestFilters {
    query?: string;
    status?: LabTestRequestStatus | '';
    patient_id?: string;
    doctor_id?: string;
    test_type?: LabTestRequestType | '';
    date_from?: string;
    date_to?: string;
}

export interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    links: Record<string, unknown>;
    meta: PaginationMeta;
}

// Laboratory Dashboard Types
export interface LaboratoryDashboardStats {
    totalTests: number;
    activeTests: number;
    pendingRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    totalResults: number;
    abnormalResults: number;
    criticalResults: number;
    verifiedResults: number;
    statRequests: number;
}

export interface LaboratoryActivity {
    id: number;
    type: 'request' | 'result' | 'test';
    action: string;
    description: string;
    timestamp: string;
    user?: {
        id: number;
        name: string;
    };
    link?: string;
}

export interface LaboratoryQuickAction {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: string;
    color: string;
    permission?: string;
}

// Result Parameter Types
export interface ResultParameter {
    parameter_id: string;
    name: string;
    value: string | number;
    unit: string;
    referenceMin: number;
    referenceMax: number;
    status: 'normal' | 'abnormal' | 'critical';
    notes?: string;
}

// Extended Lab Test Result with full relations
export interface LabTestResultWithRelations extends LabTestResult {
    patient: Patient;
    labTest: LabTest;
    performedBy?: User;
    verifiedBy?: User;
    relatedResults?: LabTestResult[];
    previousResult?: {
        performed_at: string;
        results: ResultParameter[];
    };
}

// Extended Lab Test Request with full relations
export interface LabTestRequestWithRelations extends LabTestRequest {
    patient: Patient;
    doctor: Doctor;
    createdBy: User;
    results: LabTestResult[];
}

// Laboratory Category Types
export type LabCategory = 'hematology' | 'biochemistry' | 'microbiology' | 'immunology' | 'urinalysis';

export interface LabCategoryConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
}

// Print Configuration
export interface LabPrintConfig {
    showHeader: boolean;
    showFooter: boolean;
    showSignature: boolean;
    showLogo: boolean;
    headerText: string;
    footerText: string;
}

// Accessibility Types
export interface LabAccessibilityConfig {
    announceStatusChanges: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
}
