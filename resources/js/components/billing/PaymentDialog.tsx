/**
 * PaymentDialog Component
 * 
 * Modal dialog for recording quick payments on bills.
 * Features payment amount input, method selection, validation, and success feedback.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PaymentFormData, PaymentMethod } from '@/types/billing';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyDisplay } from './CurrencyDisplay';


// ============================================================================
// Types
// ============================================================================

export interface PaymentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when payment is submitted */
  onSubmitPayment: (payment: PaymentFormData) => void | Promise<void>;
  /** Bill ID for the payment */
  billId: number;
  /** Total bill amount */
  billTotal: number;
  /** Amount already paid */
  amountPaid: number;
  /** Currency code for display */
  currency?: string;
  /** Maximum allowed payment amount (defaults to balance due) */
  maxAmount?: number;
  /** Custom title for the dialog */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

interface PaymentFormState {
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber: string;
  transactionId: string;
  notes: string;
}

interface PaymentValidationErrors {
  amount?: string;
  paymentMethod?: string;
  paymentDate?: string;
  referenceNumber?: string;
  transactionId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CURRENCY = 'AFN';

const PAYMENT_METHODS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PaymentMethod.CHECK, label: 'Check' },
  { value: PaymentMethod.INSURANCE, label: 'Insurance' },
];

const MIN_PAYMENT_AMOUNT = 0.01;
const MAX_PAYMENT_AMOUNT = 9999999.99;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Parse amount string to number
 */
function parseAmount(value: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format amount for display
 */
function formatAmount(value: number): string {
  return value.toFixed(2);
}

/**
 * Validate payment method
 */
function validatePaymentMethod(method: PaymentMethod): string | undefined {
  if (!method) {
    return 'Please select a payment method';
  }
  return undefined;
}

/**
 * Validate payment date
 */
function validatePaymentDate(date: string): string | undefined {
  if (!date) {
    return 'Please select a payment date';
  }
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (selectedDate > today) {
    return 'Payment date cannot be in the future';
  }
  return undefined;
}

// ============================================================================
// PaymentDialog Component
// ============================================================================

export function PaymentDialog({
  open,
  onOpenChange,
  onSubmitPayment,
  billId,
  billTotal,
  amountPaid,
  currency = DEFAULT_CURRENCY,
  maxAmount,
  title = 'Record Payment',
  className,
}: PaymentDialogProps) {
  // Calculate balance due
  const balanceDue = React.useMemo(() => {
    return Math.max(0, billTotal - amountPaid);
  }, [billTotal, amountPaid]);

  // Effective max amount
  const effectiveMaxAmount = React.useMemo(() => {
    return maxAmount !== undefined ? maxAmount : balanceDue;
  }, [maxAmount, balanceDue]);

  // Form state
  const [formState, setFormState] = React.useState<PaymentFormState>({
    amount: formatAmount(balanceDue),
    paymentMethod: PaymentMethod.CASH,
    paymentDate: formatDateForInput(new Date()),
    referenceNumber: '',
    transactionId: '',
    notes: '',
  });

  // Validation errors
  const [errors, setErrors] = React.useState<PaymentValidationErrors>({});

  // Submit state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormState({
        amount: formatAmount(balanceDue),
        paymentMethod: PaymentMethod.CASH,
        paymentDate: formatDateForInput(new Date()),
        referenceNumber: '',
        transactionId: '',
        notes: '',
      });
      setErrors({});
      setSubmitSuccess(false);
      setIsSubmitting(false);
    }
  }, [open, balanceDue]);

  /**
   * Handle amount change
   */
  function handleAmountChange(value: string) {
    // Allow only numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    let sanitized = cleaned;
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setFormState((prev) => ({ ...prev, amount: sanitized }));
    clearError('amount');
  }

  /**
   * Handle payment method change
   */
  function handlePaymentMethodChange(value: string) {
    setFormState((prev) => ({ 
      ...prev, 
      paymentMethod: value as PaymentMethod 
    }));
    clearError('paymentMethod');
  }

  /**
   * Handle payment date change
   */
  function handlePaymentDateChange(value: string) {
    setFormState((prev) => ({ ...prev, paymentDate: value }));
    clearError('paymentDate');
  }

  /**
   * Handle reference number change
   */
  function handleReferenceNumberChange(value: string) {
    setFormState((prev) => ({ ...prev, referenceNumber: value }));
    clearError('referenceNumber');
  }

  /**
   * Handle transaction ID change
   */
  function handleTransactionIdChange(value: string) {
    setFormState((prev) => ({ ...prev, transactionId: value }));
    clearError('transactionId');
  }

  /**
   * Handle notes change
   */
  function handleNotesChange(value: string) {
    setFormState((prev) => ({ ...prev, notes: value }));
  }

  /**
   * Clear specific error
   */
  function clearError(field: keyof PaymentValidationErrors) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }

  /**
   * Validate form
   */
  function validateForm(): boolean {
    const newErrors: PaymentValidationErrors = {};
    const amount = parseAmount(formState.amount);

    // Validate amount
    if (!formState.amount || formState.amount.trim() === '') {
      newErrors.amount = 'Payment amount is required';
    } else if (amount < MIN_PAYMENT_AMOUNT) {
      newErrors.amount = `Payment amount must be at least ${formatAmount(MIN_PAYMENT_AMOUNT)}`;
    } else if (amount > effectiveMaxAmount) {
      newErrors.amount = `Payment amount cannot exceed ${formatAmount(effectiveMaxAmount)}`;
    } else if (amount > MAX_PAYMENT_AMOUNT) {
      newErrors.amount = `Payment amount is too large`;
    }

    // Validate payment method
    const methodError = validatePaymentMethod(formState.paymentMethod);
    if (methodError) {
      newErrors.paymentMethod = methodError;
    }

    // Validate payment date
    const dateError = validatePaymentDate(formState.paymentDate);
    if (dateError) {
      newErrors.paymentDate = dateError;
    }

    // Validate reference number for certain payment methods
    if (
      formState.paymentMethod === PaymentMethod.BANK_TRANSFER ||
      formState.paymentMethod === PaymentMethod.CHECK
    ) {
      if (!formState.referenceNumber.trim()) {
        newErrors.referenceNumber = `${formState.paymentMethod === PaymentMethod.CHECK ? 'Check' : 'Reference'} number is required for this payment method`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentData: PaymentFormData = {
        bill_id: billId,
        payment_method: formState.paymentMethod,
        amount: parseAmount(formState.amount),
        payment_date: formState.paymentDate,
        reference_number: formState.referenceNumber || undefined,
        notes: formState.notes || undefined,
      };

      await onSubmitPayment(paymentData);
      setSubmitSuccess(true);

      // Close dialog after brief delay to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Payment submission error:', error);
      setErrors({
        amount: 'Failed to process payment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handle dialog close
   */
  function handleClose() {
    setFormState({
      amount: formatAmount(balanceDue),
      paymentMethod: PaymentMethod.CASH,
      paymentDate: formatDateForInput(new Date()),
      referenceNumber: '',
      transactionId: '',
      notes: '',
    });
    setErrors({});
    setSubmitSuccess(false);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  // Get input amount as number for display
  const inputAmount = React.useMemo(() => {
    return parseAmount(formState.amount);
  }, [formState.amount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-md', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Enter payment details to record a payment for this bill.
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium">
              Payment recorded successfully!
            </p>
          </div>
        )}

        {/* Bill Summary */}
        {!submitSuccess && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bill Total:</span>
              <CurrencyDisplay amount={billTotal} currency={currency} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Paid:</span>
              <CurrencyDisplay 
                amount={amountPaid} 
                currency={currency} 
                color={amountPaid > 0 ? 'success' : 'muted'}
              />
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>Balance Due:</span>
              <CurrencyDisplay 
                amount={balanceDue} 
                currency={currency}
                color={balanceDue > 0 ? 'danger' : 'success'}
                weight="semibold"
              />
            </div>
          </div>
        )}

        {/* Payment Form */}
        {!submitSuccess && (
          <div className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currency === 'AFN' ? '؋' : currency}
                </span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={formState.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={cn("pl-8", errors.amount && "border-destructive focus-visible:ring-destructive")}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.amount}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
              {inputAmount > 0 && inputAmount <= effectiveMaxAmount && (
                <p className="text-xs text-muted-foreground">
                  <CurrencyDisplay 
                    amount={effectiveMaxAmount - inputAmount} 
                    currency={currency}
                    prefix="Remaining after payment: "
                  />
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formState.paymentMethod}
                onValueChange={handlePaymentMethodChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="paymentMethod"
                  className={errors.paymentMethod ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!errors.paymentMethod}
                >
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formState.paymentDate}
                onChange={(e) => handlePaymentDateChange(e.target.value)}
                disabled={isSubmitting}
                className={errors.paymentDate ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!errors.paymentDate}
              />
              {errors.paymentDate && (
                <p className="text-sm text-destructive">{errors.paymentDate}</p>
              )}
            </div>

            {/* Reference Number (for Check/Bank Transfer) */}
            {(formState.paymentMethod === PaymentMethod.CHECK || 
              formState.paymentMethod === PaymentMethod.BANK_TRANSFER) && (
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">
                  {formState.paymentMethod === PaymentMethod.CHECK ? 'Check' : 'Reference'} Number
                </Label>
                <Input
                  id="referenceNumber"
                  type="text"
                  value={formState.referenceNumber}
                  onChange={(e) => handleReferenceNumberChange(e.target.value)}
                  placeholder={`Enter ${formState.paymentMethod === PaymentMethod.CHECK ? 'check' : 'reference'} number`}
                  disabled={isSubmitting}
                  className={errors.referenceNumber ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!errors.referenceNumber}
                />
                {errors.referenceNumber && (
                  <p className="text-sm text-destructive">{errors.referenceNumber}</p>
                )}
              </div>
            )}

            {/* Transaction ID (optional, for card/online payments) */}
            {(formState.paymentMethod === PaymentMethod.CREDIT_CARD ||
              formState.paymentMethod === PaymentMethod.DEBIT_CARD ||
              formState.paymentMethod === PaymentMethod.ONLINE ||
              formState.paymentMethod === PaymentMethod.MOBILE_PAYMENT) && (
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  type="text"
                  value={formState.transactionId}
                  onChange={(e) => handleTransactionIdChange(e.target.value)}
                  placeholder="Enter transaction ID from payment processor"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formState.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        {!submitSuccess && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentDialog;
