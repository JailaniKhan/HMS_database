export interface Patient {
    id: number;
    patient_id: string;
    first_name: string | null;
    father_name: string | null;
    gender: 'male' | 'female' | 'other' | null;
    phone: string | null;
    address: string | null;
    blood_group: string | null;
    age: number | null;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        username: string;
    };
}

export interface PatientFormData {
    first_name: string;
    father_name: string;
    gender: string;
    phone: string;
    address: string;
    age: string;
    blood_group: string;
}
