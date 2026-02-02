/**
 * usePaymentProcessing Hook
 * 
 * A custom hook for handling payment form state, validation,
 * payment method switching, and change calculation for cash payments.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  PaymentMethod,
  type PaymentFormData,
  type PaymentCalculation,
  type Bill,
} from '@/types/billing';

interface UsePaymentProcessingProps {
  bill: Bill | null;
  maxPaymentAmount?: number;
  onSubmit?: (data: PaymentFormData) => void | Promise<void>;
}

interface PaymentFormState {
  payment_method: PaymentMethod;
  amount: string;
  payment_date: string;
  reference_number: string;
  card_last_four: string;
  card_type: string;
  bank_name: string;
  check_number: string;
  amount_tendered: string;
  notes: string;
}

interface UsePaymentProcessingReturn {
  // Form state
  formState: PaymentFormState;
  setFormField: <K extends keyof PaymentFormState>(
    field: K,
    value: PaymentFormState[K]
  ) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmount: (amount: string) => void;
  setAmountTendered: (amount: string) => void;
  resetForm: () => void;

  // Calculated values
  numericAmount: number;
  numericAmountTendered: number;
  changeDue: number;
  remainingBalance: number;
  paymentCalculation: PaymentCalculation;

  // Validation
  errors: Record<string, string>;
  isValid: boolean;
  validateForm: () => boolean;

  // Submission
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;

  // Helpers
  requiresReference: boolean;
  requiresCardDetails: boolean;
  requiresBankDetails: boolean;
  allowsChange: boolean;
  isCashPayment: boolean;
}

/**
 * Payment method configurations
 */
const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, {
  requiresReference: boolean;
  requiresCardDetails: boolean;
  requiresBankDetails: boolean;
  allowsChange: boolean;
}> = {
  [PaymentMethod.CASH]: {
    requiresReference: false,
    requiresCardDetails: false,
    requiresBankDetails: false,
    allowsChange: true,
  },
  [PaymentMethod.CREDIT_CARD]: {
    requiresReference: true,
    requiresCardDetails: true,
    requiresBankDetails: false,
    allowsChange: false,
  },
  [PaymentMethod.DEBIT_CARD]: {
    requiresReference: true,
    requiresCardDetails: true,
    requiresBankDetails: false,
    allowsChange: false,
  },
  [PaymentMethod.CHECK]: {
    requiresReference: true,
    requiresCardDetails: false,
    requiresBankDetails: true,
    allowsChange: false,
  },
  [PaymentMethod.BANK_TRANSFER]: {
    requiresReference: true,
    requiresCardDetails: false,
    requiresBankDetails: true,
    allowsChange: false,
  },
  [PaymentMethod.INSURANCE]: {
    requiresReference: true,
    requiresCardDetails: false,
    requiresBankDetails: false,
    allowsChange: false,
  },
  [PaymentMethod.ONLINE]: {
    requiresReference: true,
    requiresCardDetails: false,
    requiresBankDetails: false,
    allowsChange: false,
  },
  [PaymentMethod.MOBILE_PAYMENT]: {
    requiresReference: true,
    requiresCardDetails: false,
    requiresBankDetails: false,
    allowsChange: false,
  },
};

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse amount string to number
 */
function parseAmount(amount: string): number {
  const parsed = parseFloat(amount);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Hook for payment processing
 * 
 * @param props - Payment processing parameters
 * @returns Form state, calculations, and handlers
 */
export function usePaymentProcessing({
  bill,
  maxPaymentAmount,
  onSubmit,
}: UsePaymentProcessingProps): UsePaymentProcessingReturn {
  // Calculate remaining balance from bill
  const remainingBalance = useMemo((): number => {
    if (!bill) return 0;
    return bill.balance_due || Math.max(0, bill.total_amount - (bill.amount_paid || 0));
  }, [bill]);

  // Initialize form state
  const getInitialState = useCallback((): PaymentFormState => ({
    payment_method: PaymentMethod.CASH,
    amount: remainingBalance > 0 ? remainingBalance.toFixed(2) : '',
    payment_date: getTodayDate(),
    reference_number: '',
    card_last_four: '',
    card_type: '',
    bank_name: '',
    check_number: '',
    amount_tendered: '',
    notes: '',
  }), [remainingBalance]);

  const [formState, setFormState] = useState<PaymentFormState>(getInitialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when bill changes
  useEffect(() => {
    setFormState(getInitialState());
    setErrors({});
  }, [bill?.id, getInitialState]);

  // Get current payment method config
  const methodConfig = useMemo(
    () => PAYMENT_METHOD_CONFIG[formState.payment_method],
    [formState.payment_method]
  );

  // Derived boolean flags
  const requiresReference = methodConfig.requiresReference;
  const requiresCardDetails = methodConfig.requiresCardDetails;
  const requiresBankDetails = methodConfig.requiresBankDetails;
  const allowsChange = methodConfig.allowsChange;
  const isCashPayment = formState.payment_method === PaymentMethod.CASH;

  // Numeric amount values
  const numericAmount = useMemo(
    () => parseAmount(formState.amount),
    [formState.amount]
  );

  const numericAmountTendered = useMemo(
    () => parseAmount(formState.amount_tendered),
    [formState.amount_tendered]
  );

  // Calculate change due for cash payments
  const changeDue = useMemo((): number => {
    if (!allowsChange || numericAmountTendered <= 0) return 0;
    return Math.max(0, numericAmountTendered - numericAmount);
  }, [allowsChange, numericAmountTendered, numericAmount]);

  // Payment calculation result
  const paymentCalculation: PaymentCalculation = useMemo(() => {
    const calc: PaymentCalculation = {
      amount: numericAmount,
      amountTendered: numericAmountTendered,
      changeDue,
      isValid: true,
    };

    // Validation checks
    if (numericAmount <= 0) {
      calc.isValid = false;
      calc.errorMessage = 'Payment amount must be greater than zero';
    } else if (maxPaymentAmount !== undefined && numericAmount > maxPaymentAmount) {
      calc.isValid = false;
      calc.errorMessage = `Payment amount cannot exceed ${maxPaymentAmount.toFixed(2)}`;
    } else if (allowsChange && numericAmountTendered > 0 && numericAmountTendered < numericAmount) {
      calc.isValid = false;
      calc.errorMessage = 'Amount tendered must be at least equal to payment amount';
    }

    return calc;
  }, [numericAmount, numericAmountTendered, changeDue, allowsChange, maxPaymentAmount]);

  // Overall form validity
  const isValid = useMemo((): boolean => {
    if (!paymentCalculation.isValid) return false;
    if (requiresReference && !formState.reference_number.trim()) return false;
    if (requiresCardDetails && !formState.card_last_four.trim()) return false;
    if (requiresBankDetails && !formState.bank_name.trim()) return false;
    return true;
  }, [
    paymentCalculation.isValid,
    requiresReference,
    requiresCardDetails,
    requiresBankDetails,
    formState.reference_number,
    formState.card_last_four,
    formState.bank_name,
  ]);

  /**
   * Set a form field value
   */
  const setFormField = useCallback(<K extends keyof PaymentFormState>(
    field: K,
    value: PaymentFormState[K]
  ): void => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when it changes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Set payment method with field reset
   */
  const setPaymentMethod = useCallback((method: PaymentMethod): void => {
    setFormState((prev) => {
      const newConfig = PAYMENT_METHOD_CONFIG[method];
      const newState: PaymentFormState = {
        ...prev,
        payment_method: method,
        // Clear fields that are not needed for new method
        reference_number: newConfig.requiresReference ? prev.reference_number : '',
        card_last_four: newConfig.requiresCardDetails ? prev.card_last_four : '',
        card_type: newConfig.requiresCardDetails ? prev.card_type : '',
        bank_name: newConfig.requiresBankDetails ? prev.bank_name : '',
        check_number: newConfig.requiresBankDetails ? prev.check_number : '',
        amount_tendered: newConfig.allowsChange ? prev.amount_tendered : '',
      };
      return newState;
    });
    setErrors({});
  }, []);

  /**
   * Set payment amount
   */
  const setAmount = useCallback((amount: string): void => {
    setFormField('amount', amount);
  }, [setFormField]);

  /**
   * Set amount tendered (for cash payments)
   */
  const setAmountTendered = useCallback((amount: string): void => {
    setFormField('amount_tendered', amount);
  }, [setFormField]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback((): void => {
    setFormState(getInitialState());
    setErrors({});
  }, [getInitialState]);

  /**
   * Validate the form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    if (numericAmount <= 0) {
      newErrors.amount = 'Payment amount is required';
    } else if (maxPaymentAmount !== undefined && numericAmount > maxPaymentAmount) {
      newErrors.amount = `Amount cannot exceed ${maxPaymentAmount.toFixed(2)}`;
    }

    // Payment date validation
    if (!formState.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    // Reference number validation
    if (requiresReference && !formState.reference_number.trim()) {
      newErrors.reference_number = 'Reference number is required';
    }

    // Card details validation
    if (requiresCardDetails) {
      if (!formState.card_last_four.trim()) {
        newErrors.card_last_four = 'Card last four digits are required';
      } else if (!/^\d{4}$/.test(formState.card_last_four)) {
        newErrors.card_last_four = 'Please enter last 4 digits of card';
      }
    }

    // Bank details validation
    if (requiresBankDetails && !formState.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }

    // Check number validation for check payments
    if (formState.payment_method === PaymentMethod.CHECK && !formState.check_number.trim()) {
      newErrors.check_number = 'Check number is required';
    }

    // Cash payment validation
    if (allowsChange && numericAmountTendered > 0 && numericAmountTendered < numericAmount) {
      newErrors.amount_tendered = 'Amount tendered must be at least equal to payment amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    numericAmount,
    numericAmountTendered,
    maxPaymentAmount,
    requiresReference,
    requiresCardDetails,
    requiresBankDetails,
    allowsChange,
    formState,
  ]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) {
        e.preventDefault();
      }

      if (!validateForm()) {
        return;
      }

      if (!bill) {
        setErrors({ submit: 'No bill selected' });
        return;
      }

      setIsSubmitting(true);

      try {
        const paymentData: PaymentFormData = {
          bill_id: bill.id,
          payment_method: formState.payment_method,
          amount: numericAmount,
          payment_date: formState.payment_date,
          reference_number: formState.reference_number || undefined,
          card_last_four: formState.card_last_four || undefined,
          card_type: formState.card_type || undefined,
          bank_name: formState.bank_name || undefined,
          check_number: formState.check_number || undefined,
          amount_tendered: allowsChange ? numericAmountTendered : undefined,
          notes: formState.notes || undefined,
        };

        await onSubmit?.(paymentData);
        resetForm();
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error instanceof Error ? error.message : 'Payment failed',
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validateForm,
      bill,
      formState,
      numericAmount,
      numericAmountTendered,
      allowsChange,
      onSubmit,
      resetForm,
    ]
  );

  return {
    // Form state
    formState,
    setFormField,
    setPaymentMethod,
    setAmount,
    setAmountTendered,
    resetForm,

    // Calculated values
    numericAmount,
    numericAmountTendered,
    changeDue,
    remainingBalance,
    paymentCalculation,

    // Validation
    errors,
    isValid,
    validateForm,

    // Submission
    isSubmitting,
    handleSubmit,

    // Helpers
    requiresReference,
    requiresCardDetails,
    requiresBankDetails,
    allowsChange,
    isCashPayment,
  };
}

export default usePaymentProcessing;
