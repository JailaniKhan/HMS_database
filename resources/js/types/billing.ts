/**
 * Billing System Type Definitions
 * 
 * This file contains all TypeScript types, interfaces, and enums
 * for the Hospital Management System billing module.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Bill status enum representing the lifecycle of a bill
 */
export enum BillStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  VOID = 'void',
  CANCELLED = 'cancelled',
}

/**
 * Payment status enum for tracking payment state
 */
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
  PENDING = 'pending',
  FAILED = 'failed',
}

/**
 * Payment method enum for different payment types
 */
export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  ONLINE = 'online',
  MOBILE_PAYMENT = 'mobile_payment',
}

/**
 * Bill item type enum for categorizing line items
 */
export enum ItemType {
  SERVICE = 'service',
  CONSULTATION = 'consultation',
  PROCEDURE = 'procedure',
  MEDICATION = 'medication',
  LAB_TEST = 'lab_test',
  ROOM_CHARGE = 'room_charge',
  EQUIPMENT = 'equipment',
  SUPPLY = 'supply',
  OTHER = 'other',
}

/**
 * Refund status enum
 */
export enum RefundStatus {
  REQUESTED = 'requested',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Patient interface for billing context
 */
export interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  father_name?: string;
  full_name: string;
  gender?: string;
  phone?: string;
  age?: number;
  blood_group?: string;
  address?: Record<string, string>;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Doctor interface for billing context
 */
export interface Doctor {
  id: number;
  doctor_id: string;
  full_name: string;
  father_name?: string;
  specialization?: string;
  phone_number?: string;
  fees?: number;
  department_id?: number;
  department?: Department;
  created_at?: string;
  updated_at?: string;
}

/**
 * Department interface
 */
export interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

/**
 * Bill item interface representing a line item on a bill
 */
export interface BillItem {
  id: number;
  bill_id: number;
  item_type: ItemType;
  source_type?: string;
  source_id?: number;
  category?: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  total_price: number;
  net_price?: number;
  has_discount?: boolean;
  discounted_amount?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payment interface
 */
export interface Payment {
  id: number;
  bill_id: number;
  payment_method: PaymentMethod;
  amount: number;
  payment_date: string;
  transaction_id: string;
  reference_number?: string;
  card_last_four?: string;
  card_type?: string;
  bank_name?: string;
  check_number?: string;
  amount_tendered?: number;
  change_due?: number;
  received_by?: number;
  received_by_user?: User;
  notes?: string;
  status: PaymentStatus;
  refunds?: BillRefund[];
  created_at?: string;
  updated_at?: string;
}

/**
 * User interface for billing context
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

/**
 * Bill refund interface
 */
export interface BillRefund {
  id: number;
  bill_id: number;
  bill?: Bill;
  payment_id?: number;
  payment?: Payment;
  bill_item_id?: number;
  bill_item?: BillItem;
  refund_amount: number;
  refund_type: 'full' | 'partial';
  refund_reason: string;
  refund_date?: string;
  refund_method?: PaymentMethod;
  reference_number?: string;
  status: RefundStatus;
  requested_by?: number;
  requested_by_user?: User;
  approved_by?: number;
  approved_by_user?: User;
  approved_at?: string;
  rejection_reason?: string;
  processed_by?: number;
  processed_by_user?: User;
  processed_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Bill status history interface for audit trail
 */
export interface BillStatusHistory {
  id: number;
  bill_id: number;
  status_from?: string;
  status_to: string;
  field_name: string;
  changed_by?: number;
  changed_by_user?: User;
  reason?: string;
  metadata?: Record<string, unknown>;
  change_description?: string;
  created_at: string;
}

/**
 * Main bill interface
 */
export interface Bill {
  id: number;
  bill_number: string;
  invoice_number?: string;
  patient_id: number;
  patient?: Patient;
  doctor_id?: number;
  doctor?: Doctor;
  created_by?: number;
  created_by_user?: User;
  bill_date: string;
  due_date?: string;
  sub_total: number;
  discount: number;
  total_discount: number;
  tax: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  balance_due: number;
  payment_status: PaymentStatus;
  status: BillStatus;
  notes?: string;
  billing_address?: Record<string, string>;
  last_payment_date?: string;
  reminder_sent_count?: number;
  reminder_last_sent?: string;
  voided_at?: string;
  voided_by?: number;
  voided_by_user?: User;
  void_reason?: string;
  items?: BillItem[];
  payments?: Payment[];
  refunds?: BillRefund[];
  status_history?: BillStatusHistory[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Bill item form data for creating/updating items
 */
export interface BillItemFormData {
  id?: number;
  item_type: ItemType;
  source_type?: string;
  source_id?: number;
  category?: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
}

/**
 * Bill form data for creating/updating bills
 */
export interface BillFormData {
  patient_id: number;
  doctor_id?: number;
  bill_date: string;
  due_date?: string;
  discount?: number;
  tax?: number;
  notes?: string;
  billing_address?: Record<string, string>;
  items: BillItemFormData[];
}

/**
 * Payment form data for processing payments
 */
export interface PaymentFormData {
  bill_id: number;
  payment_method: PaymentMethod;
  amount: number;
  payment_date: string;
  reference_number?: string;
  card_last_four?: string;
  card_type?: string;
  bank_name?: string;
  check_number?: string;
  amount_tendered?: number;
  notes?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Bill filters for searching and filtering bills
 */
export interface BillFilters {
  search?: string;
  status?: BillStatus | BillStatus[];
  payment_status?: PaymentStatus | PaymentStatus[];
  patient_id?: number;
  doctor_id?: number;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  min_amount?: number;
  max_amount?: number;
  has_balance?: boolean;
  is_overdue?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Revenue report data interface
 */
export interface RevenueReportData {
  period: string;
  start_date: string;
  end_date: string;
  total_revenue: number;
  total_payments: number;
  total_refunds: number;
  net_revenue: number;
  by_payment_method: Record<PaymentMethod, number>;
  by_status: Record<BillStatus, number>;
  daily_breakdown: DailyRevenueData[];
  department_breakdown?: DepartmentRevenueData[];
}

/**
 * Daily revenue data for reports
 */
export interface DailyRevenueData {
  date: string;
  revenue: number;
  payments: number;
  refunds: number;
  bill_count: number;
}

/**
 * Department revenue data for reports
 */
export interface DepartmentRevenueData {
  department_id: number;
  department_name: string;
  revenue: number;
  bill_count: number;
}

/**
 * Outstanding report data interface
 */
export interface OutstandingReportData {
  generated_at: string;
  total_outstanding: number;
  total_overdue: number;
  total_pending: number;
  bills: OutstandingBillData[];
  aging_summary: AgingSummaryData;
}

/**
 * Outstanding bill data for aging reports
 */
export interface OutstandingBillData {
  id: number;
  bill_number: string;
  patient_id: number;
  patient_name: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  days_overdue: number;
  status: BillStatus;
  payment_status: PaymentStatus;
}

/**
 * Aging summary data
 */
export interface AgingSummaryData {
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
  total: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * Pagination link interface
 */
export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

/**
 * API error response interface
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * API success response interface
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Payment method configuration type
 */
export interface PaymentMethodConfig {
  method: PaymentMethod;
  label: string;
  icon: string;
  requires_reference: boolean;
  requires_card_details: boolean;
  requires_bank_details: boolean;
  allows_change: boolean;
}

/**
 * Bill summary calculations
 */
export interface BillCalculations {
  subtotal: number;
  itemDiscounts: number;
  billDiscount: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
}

/**
 * Payment calculation result
 */
export interface PaymentCalculation {
  amount: number;
  amountTendered: number;
  changeDue: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Status badge configuration
 */
export interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}
