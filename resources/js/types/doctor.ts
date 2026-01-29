export interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    father_name: string | null;
    age: number | null;
    phone_number: string;
    address: string | null;
    specialization: string;
    department_id: number;
    bio: string | null;
    fees: number;
    salary: number;
    bonus: number;
    status: 'active' | 'inactive' | 'on_leave';
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        username: string;
        role: string;
    };
    department?: {
        id: number;
        name: string;
        description: string | null;
    };
}

export interface DoctorFormData {
    full_name: string;
    father_name: string;
    age: string;
    phone_number: string;
    address: string;
    specialization: string;
    department_id: string;
    bio: string;
    fees: string;
    salary: string;
    bonus: string;
}