// Pharmacy Types
// TypeScript interfaces for Pharmacy module

import type { Medicine, MedicineCategory } from './medicine';

// Re-export Medicine types from medicine.ts
export type { Medicine, MedicineCategory };

// Sale Types
export interface Sale {
    id: number;
    sale_id: string;
    patient_id: number | null;
    prescription_id: number | null;
    user_id: number;
    total_amount: number;
    discount: number;
    tax: number;
    grand_total: number;
    payment_method: 'cash' | 'card' | 'insurance' | 'credit';
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
    notes: string | null;
    is_prescription_sale: boolean;
    created_at: string;
    updated_at: string;
    patient?: {
        id: number;
        first_name: string;
        last_name: string;
        patient_id: string;
    } | null;
    user?: {
        id: number;
        name: string;
    };
    items?: SalesItem[];
    prescription?: Prescription | null;
}

export interface SalesItem {
    id: number;
    sale_id: number;
    medicine_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount: number;
    created_at: string;
    updated_at: string;
    medicine?: Medicine;
}

export interface SaleFormData {
    patient_id: string | null;
    prescription_id: string | null;
    payment_method: 'cash' | 'card' | 'insurance' | 'credit';
    notes: string;
    items: CartItem[];
    discount: number;
    tax: number;
    is_prescription_sale: boolean;
}

// Cart Types (for POS)
export interface CartItem {
    medicine_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    stock_quantity: number;
    dosage_form?: string | null;
    strength?: string | null;
    discount?: number;
}

// Prescription Types
export interface Prescription {
    id: number;
    prescription_code: string;
    patient_id: number;
    doctor_id: number;
    doctor_name: string;
    diagnosis: string;
    notes: string;
    status: 'pending' | 'dispensed' | 'partial' | 'cancelled';
    created_at: string;
    updated_at: string;
    patient?: Patient;
    doctor?: Doctor;
    items?: PrescriptionItem[];
}

export interface PrescriptionItem {
    id: number;
    prescription_id: number;
    medicine_id: number;
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    dispensed_quantity: number;
    medicine?: Medicine;
}

export interface PrescriptionFormData {
    patient_id: string;
    doctor_id: string;
    diagnosis: string;
    notes: string;
    items: {
        medicine_id: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: number;
        instructions: string;
    }[];
}

// Patient Type (for pharmacy context)
export interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    date_of_birth?: string;
    address?: string;
    gender?: 'male' | 'female' | 'other';
    blood_group?: string;
    created_at: string;
    updated_at: string;
}

// Doctor Type (for pharmacy context)
export interface Doctor {
    id: number;
    name: string;
    specialization?: string;
    phone?: string;
    email?: string;
    license_number?: string;
    created_at: string;
    updated_at: string;
}

// Stock Movement Types
export interface StockMovement {
    id: number;
    medicine_id: number;
    type: 'in' | 'out' | 'adjustment' | 'return';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'expired';
    reference_id: number | null;
    notes: string | null;
    user_id: number;
    created_at: string;
    medicine?: Medicine;
    user?: {
        id: number;
        name: string;
    };
}

// Medicine Alert Types
export interface MedicineAlert {
    id: number;
    medicine_id: number;
    alert_type: 'low_stock' | 'expired' | 'expiring_soon' | 'low_stock_expiring';
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    status: 'pending' | 'resolved';
    is_read?: boolean;
    triggered_at?: string | null;
    created_at: string;
    updated_at: string;
    medicine?: Medicine;
}

// Pharmacy Dashboard Stats
export interface PharmacyDashboardStats {
    totalMedicines: number;
    totalStockQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    todaySales: number;
    todayRevenue: number;
    totalRevenue: number;
    pendingOrders: number;
    criticalAlerts: number;
}

// Pharmacy Activity Types
export interface PharmacyActivity {
    id: number;
    type: 'sale' | 'purchase' | 'stock_adjustment' | 'alert' | 'medicine_added';
    action: string;
    description: string;
    timestamp: string;
    user?: {
        id: number;
        name: string;
    };
    link?: string;
}

// Filter Types
export interface MedicineSearchFilters {
    query?: string;
    category_id?: string;
    stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'critical';
    expiry_status?: 'all' | 'valid' | 'expiring_soon' | 'expired';
}

export interface SaleSearchFilters {
    query?: string;
    status?: 'all' | 'pending' | 'completed' | 'cancelled' | 'refunded';
    payment_method?: 'all' | 'cash' | 'card' | 'insurance' | 'credit';
    date_from?: string;
    date_to?: string;
    patient_id?: string;
}

export interface StockMovementFilters {
    query?: string;
    medicine_id?: string;
    type?: 'all' | 'in' | 'out' | 'adjustment' | 'return';
    date_from?: string;
    date_to?: string;
}

// Stock Status Types
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'critical';

// Expiry Status Types
export type ExpiryStatus = 'valid' | 'expiring-soon' | 'expired';

// Stock Adjustment Types
export type AdjustmentType = 'add' | 'remove' | 'set';
export type AdjustmentReason = 'purchase' | 'damage' | 'return' | 'correction' | 'donation' | 'transfer' | 'other';

export interface StockAdjustmentFormData {
    medicine_id: string;
    adjustment_type: AdjustmentType;
    quantity: string;
    reason: AdjustmentReason;
    notes: string;
}

// Stock Valuation Types
export interface CategoryValuation {
    category: MedicineCategory;
    item_count: number;
    total_value: number;
    percentage: number;
}

export interface StatusValuation {
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'critical';
    label: string;
    item_count: number;
    total_value: number;
    percentage: number;
}

export interface TopValuedItem {
    id: number;
    name: string;
    medicine_id: string;
    stock_quantity: number;
    unit_price: number;
    total_value: number;
    category?: MedicineCategory;
}

// Quick Action Types
export interface PharmacyQuickAction {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: string;
    color: string;
    permission?: string;
}
