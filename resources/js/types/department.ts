export interface DepartmentService {
    id: number;
    department_id: number;
    name: string;
    description: string | null;
    base_cost: number;
    fee_percentage: number;
    discount_percentage: number;
    final_cost: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Department {
    id: number;
    department_id: string;
    name: string;
    description?: string | null;
    head_doctor_id?: number | null;
    head_doctor_name?: string | null;
    phone?: string | null;
    address?: string | null;
    services?: DepartmentService[];
    created_at: string;
    updated_at: string;
    doctors_count?: number;
    appointments_count?: number;
    services_count?: number;
}
