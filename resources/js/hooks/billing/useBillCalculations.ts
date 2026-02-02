/**
 * useBillCalculations Hook
 * 
 * A custom hook for calculating bill totals, discounts, tax, and balance.
 * Provides memoized calculations for optimal performance.
 */

import { useMemo, useCallback } from 'react';
import type {
  Bill,
  BillItem,
  BillItemFormData,
  BillCalculations,
} from '@/types/billing';

interface UseBillCalculationsProps {
  items?: BillItem[] | BillItemFormData[];
  subTotal?: number;
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  taxRate?: number;
  amountPaid?: number;
  insuranceClaimAmount?: number;
}

interface UseBillCalculationsReturn {
  calculations: BillCalculations;
  calculateItemTotal: (item: BillItem | BillItemFormData) => number;
  calculateItemDiscount: (item: BillItem | BillItemFormData) => number;
  calculateNetItemPrice: (item: BillItem | BillItemFormData) => number;
  formatCurrency: (amount: number) => string;
}

/**
 * Default currency formatter for the application
 */
const DEFAULT_CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Hook for bill-related calculations
 * 
 * @param props - Calculation parameters
 * @returns Calculated values and helper functions
 */
export function useBillCalculations({
  items = [],
  subTotal: externalSubTotal,
  discount = 0,
  discountType = 'fixed',
  taxRate = 0,
  amountPaid = 0,
  insuranceClaimAmount = 0,
}: UseBillCalculationsProps): UseBillCalculationsReturn {
  /**
   * Calculate the total price for a single item (before discounts)
   */
  const calculateItemTotal = useCallback(
    (item: BillItem | BillItemFormData): number => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unit_price || 0;
      return quantity * unitPrice;
    },
    []
  );

  /**
   * Calculate the discount amount for a single item
   */
  const calculateItemDiscount = useCallback(
    (item: BillItem | BillItemFormData): number => {
      const itemTotal = calculateItemTotal(item);
      const discountAmount = item.discount_amount || 0;
      const discountPercentage = item.discount_percentage || 0;

      // Calculate percentage discount
      const percentageDiscount = itemTotal * (discountPercentage / 100);

      return discountAmount + percentageDiscount;
    },
    [calculateItemTotal]
  );

  /**
   * Calculate the net price for a single item (after discounts)
   */
  const calculateNetItemPrice = useCallback(
    (item: BillItem | BillItemFormData): number => {
      const itemTotal = calculateItemTotal(item);
      const itemDiscount = calculateItemDiscount(item);
      return Math.max(0, itemTotal - itemDiscount);
    },
    [calculateItemTotal, calculateItemDiscount]
  );

  /**
   * Calculate the subtotal from all items
   */
  const calculatedSubTotal = useMemo((): number => {
    if (externalSubTotal !== undefined) {
      return externalSubTotal;
    }
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }, [items, externalSubTotal, calculateItemTotal]);

  /**
   * Calculate total item-level discounts
   */
  const itemDiscounts = useMemo((): number => {
    return items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  }, [items, calculateItemDiscount]);

  /**
   * Calculate bill-level discount amount
   */
  const billDiscount = useMemo((): number => {
    if (discountType === 'percentage') {
      return (calculatedSubTotal - itemDiscounts) * (discount / 100);
    }
    return discount;
  }, [calculatedSubTotal, itemDiscounts, discount, discountType]);

  /**
   * Calculate total discount (item-level + bill-level)
   */
  const totalDiscount = useMemo((): number => {
    return itemDiscounts + billDiscount;
  }, [itemDiscounts, billDiscount]);

  /**
   * Calculate tax amount
   */
  const taxAmount = useMemo((): number => {
    const taxableAmount = Math.max(0, calculatedSubTotal - totalDiscount);
    return taxableAmount * (taxRate / 100);
  }, [calculatedSubTotal, totalDiscount, taxRate]);

  /**
   * Calculate total amount (subtotal - discounts + tax)
   */
  const totalAmount = useMemo((): number => {
    return Math.max(0, calculatedSubTotal - totalDiscount + taxAmount);
  }, [calculatedSubTotal, totalDiscount, taxAmount]);

  /**
   * Calculate balance due
   */
  const balanceDue = useMemo((): number => {
    const insurancePayment = insuranceClaimAmount || 0;
    const paid = amountPaid || 0;
    return Math.max(0, totalAmount - insurancePayment - paid);
  }, [totalAmount, insuranceClaimAmount, amountPaid]);

  /**
   * Calculate patient responsibility (amount patient needs to pay)
   */
  const patientResponsibility = useMemo((): number => {
    const insurancePayment = insuranceClaimAmount || 0;
    return Math.max(0, totalAmount - insurancePayment);
  }, [totalAmount, insuranceClaimAmount]);

  /**
   * All calculations combined
   */
  const calculations: BillCalculations = useMemo(
    () => ({
      subtotal: calculatedSubTotal,
      itemDiscounts,
      billDiscount,
      totalDiscount,
      taxAmount,
      totalAmount,
      amountPaid: amountPaid || 0,
      balanceDue,
      insuranceClaimAmount: insuranceClaimAmount || 0,
      patientResponsibility,
    }),
    [
      calculatedSubTotal,
      itemDiscounts,
      billDiscount,
      totalDiscount,
      taxAmount,
      totalAmount,
      amountPaid,
      balanceDue,
      insuranceClaimAmount,
      patientResponsibility,
    ]
  );

  /**
   * Format a number as currency
   */
  const formatCurrency = useCallback((amount: number): string => {
    return DEFAULT_CURRENCY_FORMATTER.format(amount);
  }, []);

  return {
    calculations,
    calculateItemTotal,
    calculateItemDiscount,
    calculateNetItemPrice,
    formatCurrency,
  };
}

/**
 * Hook for calculating totals from a complete bill object
 * 
 * @param bill - The bill object to calculate from
 * @returns Calculated values and helper functions
 */
export function useBillCalculationsFromBill(
  bill?: Bill | null
): UseBillCalculationsReturn {
  const props: UseBillCalculationsProps = useMemo(
    () => ({
      items: bill?.items || [],
      subTotal: bill?.sub_total,
      discount: bill?.discount,
      taxRate: bill?.tax ? (bill.tax / (bill.sub_total || 1)) * 100 : 0,
      amountPaid: bill?.amount_paid,
      insuranceClaimAmount: bill?.insurance_claim_amount,
    }),
    [bill]
  );

  return useBillCalculations(props);
}

/**
 * Standalone utility function to calculate item total
 * Can be used outside of React components
 */
export function calculateItemTotal(
  item: BillItem | BillItemFormData
): number {
  const quantity = item.quantity || 0;
  const unitPrice = item.unit_price || 0;
  return quantity * unitPrice;
}

/**
 * Standalone utility function to calculate item discount
 */
export function calculateItemDiscount(
  item: BillItem | BillItemFormData
): number {
  const itemTotal = calculateItemTotal(item);
  const discountAmount = item.discount_amount || 0;
  const discountPercentage = item.discount_percentage || 0;
  const percentageDiscount = itemTotal * (discountPercentage / 100);
  return discountAmount + percentageDiscount;
}

/**
 * Standalone utility function to calculate net item price
 */
export function calculateNetItemPrice(
  item: BillItem | BillItemFormData
): number {
  const itemTotal = calculateItemTotal(item);
  const itemDiscount = calculateItemDiscount(item);
  return Math.max(0, itemTotal - itemDiscount);
}

/**
 * Standalone utility function to format currency
 */
export function formatCurrency(
  amount: number,
  locale = 'en-US',
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default useBillCalculations;
