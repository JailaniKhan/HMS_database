/**
 * RefundDialog Component
 * 
 * Modal dialog for processing refunds on bills.
 * Features refund amount input, reason/method selection, validation, and success feedback.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types/billing';

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

export interface RefundDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when refund is submitted */
  onConfirmRefund: (refund: RefundFormData) => void | Promise<void>;
  /** Bill ID for the refund */
  billId: number;
  /** Total amount paid on the bill */
  totalPaid: number;
  /** Amount already refunded */
  amountRefunded: number;
  /** Currency code for display */
  currency?: string;
  /** Maximum allowed refund amount (defaults to totalPaid - amountRefunded) */
  maxAmount?: number;
  /** Original payment method (for default selection) */
  originalPaymentMethod?: PaymentMethod;
  /** Custom title for the dialog */
  title?: string;
  /** Whether to show the refund reason dropdown */
  showReasonDropdown?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface RefundFormState {
  amount: string;
  refundReason: string;
  refundMethod: PaymentMethod | 'original';
  refundDate: string;
  referenceNumber: string;
  notes: string;
}

interface RefundValidationErrors {
  amount?: string;
  refundReason?: string;
  refundMethod?: string;
  refundDate?: string;
  referenceNumber?: string;
}

/**
 * Refund form data for processing refunds
 */
export interface RefundFormData {
  bill_id: number;
  refund_amount: number;
  refund_reason?: string;
  refund_method: PaymentMethod | string;
  refund_date: string;
  reference_number?: string;
  notes?: string;
}


// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CURRENCY = 'AFN';

const REFUND_REASONS = [
  { value: 'overpayment', label: 'Overpayment' },
  { value: 'service_not_rendered', label: 'Service Not Rendered' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'duplicate_charge', label: 'Duplicate Charge' },
  { value: 'billing_error', label: 'Billing Error' },
  { value: 'patient_request', label: 'Patient Request' },
  { value: 'insurance_adjustment', label: 'Insurance Adjustment' },
  { value: 'other', label: 'Other' },
];

const REFUND_METHODS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PaymentMethod.CHECK, label: 'Check' },
  { value: 'original', label: 'Original Payment Method' },
];

const MIN_REFUND_AMOUNT = 0.01;
const MAX_REFUND_AMOUNT = 9999999.99;


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
 * Validate refund reason
 */
function validateRefundReason(reason: string): string | undefined {
  if (!reason || reason.trim() === '') {
    return 'Please select a refund reason';
  }
  return undefined;
}

/**
 * Validate refund method
 */
function validateRefundMethod(method: PaymentMethod | string): string | undefined {
  if (!method || method === '') {
    return 'Please select a refund method';
  }
  return undefined;
}

/**
 * Validate refund date
 */
function validateRefundDate(date: string): string | undefined {
  if (!date) {
    return 'Please select a refund date';
  }
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Allow refunds up to 30 days in the past for corrections
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  if (selectedDate > today) {
    return 'Refund date cannot be in the future';
  }
  
  if (selectedDate < thirtyDaysAgo) {
    return 'Refund date cannot be more than 30 days in the past';
  }
  
  return undefined;
}


// ============================================================================
// RefundDialog Component
// ============================================================================

export function RefundDialog({
  open,
  onOpenChange,
  onConfirmRefund,
  billId,
  totalPaid,
  amountRefunded,
  currency = DEFAULT_CURRENCY,
  maxAmount,
  originalPaymentMethod,
  title = 'Process Refund',
  showReasonDropdown = true,
  className,
}: RefundDialogProps) {
  // Calculate remaining refundable amount
  const remainingRefundable = React.useMemo(() => {
    return Math.max(0, totalPaid - amountRefunded);
  }, [totalPaid, amountRefunded]);

  // Effective max amount
  const effectiveMaxAmount = React.useMemo(() => {
    return maxAmount !== undefined ? maxAmount : remainingRefundable;
  }, [maxAmount, remainingRefundable]);

  // Form state
  const [formState, setFormState] = React.useState<RefundFormState>({
    amount: formatAmount(effectiveMaxAmount),
    refundReason: '',
    refundMethod: originalPaymentMethod || PaymentMethod.CASH,
    refundDate: formatDateForInput(new Date()),
    referenceNumber: '',
    notes: '',
  });

  // Validation errors
  const [errors, setErrors] = React.useState<RefundValidationErrors>({});

  // Submit state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormState({
        amount: formatAmount(effectiveMaxAmount),
        refundReason: '',
        refundMethod: originalPaymentMethod || PaymentMethod.CASH,
        refundDate: formatDateForInput(new Date()),
        referenceNumber: '',
        notes: '',
      });
      setErrors({});
      setSubmitSuccess(false);
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [open, effectiveMaxAmount, originalPaymentMethod]);

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
   * Handle refund reason change
   */
  function handleRefundReasonChange(value: string) {
    setFormState((prev) => ({ ...prev, refundReason: value }));
    clearError('refundReason');
  }

  /**
   * Handle refund method change
   */
  function handleRefundMethodChange(value: string) {
    setFormState((prev) => ({ ...prev, refundMethod: value as PaymentMethod }));
    clearError('refundMethod');
  }

  /**
   * Handle refund date change
   */
  function handleRefundDateChange(value: string) {
    setFormState((prev) => ({ ...prev, refundDate: value }));
    clearError('refundDate');
  }

  /**
   * Handle reference number change
   */
  function handleReferenceNumberChange(value: string) {
    setFormState((prev) => ({ ...prev, referenceNumber: value }));
    clearError('referenceNumber');
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
  function clearError(field: keyof RefundValidationErrors) {
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
    const newErrors: RefundValidationErrors = {};
    const amount = parseAmount(formState.amount);

    // Validate amount
    if (!formState.amount || formState.amount.trim() === '') {
      newErrors.amount = 'Refund amount is required';
    } else if (amount < MIN_REFUND_AMOUNT) {
      newErrors.amount = `Refund amount must be at least ${formatAmount(MIN_REFUND_AMOUNT)}`;
    } else if (amount > effectiveMaxAmount) {
      newErrors.amount = `Refund amount cannot exceed ${formatAmount(effectiveMaxAmount)}`;
    } else if (amount > MAX_REFUND_AMOUNT) {
      newErrors.amount = 'Refund amount is too large';
    }

    // Validate refund reason
    if (showReasonDropdown) {
      const reasonError = validateRefundReason(formState.refundReason);
      if (reasonError) {
        newErrors.refundReason = reasonError;
      }
    }

    // Validate refund method
    const methodError = validateRefundMethod(formState.refundMethod);
    if (methodError) {
      newErrors.refundMethod = methodError;
    }

    // Validate refund date
    const dateError = validateRefundDate(formState.refundDate);
    if (dateError) {
      newErrors.refundDate = dateError;
    }

    // Validate reference number for certain refund methods
    if (
      formState.refundMethod === PaymentMethod.BANK_TRANSFER ||
      formState.refundMethod === PaymentMethod.CHECK ||
      formState.refundMethod === 'original'
    ) {
      if (!formState.referenceNumber.trim()) {
        newErrors.referenceNumber = 'Reference number is required for this refund method';
      }
    }

    setErrors(newErrors);
    setErrorMessage(null);
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
    setErrorMessage(null);

    try {
      const refundData: RefundFormData = {
        bill_id: billId,
        refund_amount: parseAmount(formState.amount),
        refund_reason: formState.refundReason,
        refund_method: formState.refundMethod,
        refund_date: formState.refundDate,
        reference_number: formState.referenceNumber || undefined,
        notes: formState.notes || undefined,
      };

      await onConfirmRefund(refundData);
      setSubmitSuccess(true);

      // Close dialog after brief delay to show success
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Refund submission error:', error);
      setErrorMessage('Failed to process refund. Please try again.');
      setErrors({
        amount: 'Failed to process refund. Please try again.',
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
      amount: formatAmount(effectiveMaxAmount),
      refundReason: '',
      refundMethod: originalPaymentMethod || PaymentMethod.CASH,
      refundDate: formatDateForInput(new Date()),
      referenceNumber: '',
      notes: '',
    });
    setErrors({});
    setSubmitSuccess(false);
    setIsSubmitting(false);
    setErrorMessage(null);
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
            Enter refund details to process a refund for this bill.
          </DialogDescription>
        </DialogHeader>

        {/* Error Message */}
        {errorMessage && !submitSuccess && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium">
              Refund processed successfully!
            </p>
          </div>
        )}

        {/* Refund Summary */}
        {!submitSuccess && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Paid:</span>
              <CurrencyDisplay amount={totalPaid} currency={currency} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Refunded:</span>
              <CurrencyDisplay 
                amount={amountRefunded} 
                currency={currency} 
                color={amountRefunded > 0 ? 'warning' : 'muted'}
              />
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>Refundable Amount:</span>
              <CurrencyDisplay 
                amount={remainingRefundable} 
                currency={currency}
                color={remainingRefundable > 0 ? 'primary' : 'muted'}
                weight="semibold"
              />
            </div>
          </div>
        )}

        {/* Refund Form */}
        {!submitSuccess && (
          <div className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount</Label>
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
                  {effectiveMaxAmount - inputAmount > 0 ? (
                    <CurrencyDisplay 
                      amount={effectiveMaxAmount - inputAmount} 
                      currency={currency}
                      prefix="Remaining refundable: "
                    />
                  ) : (
                    'Full refundable amount selected'
                  )}
                </p>
              )}
            </div>

            {/* Refund Reason */}
            {showReasonDropdown && (
              <div className="space-y-2">
                <Label htmlFor="refundReason">Refund Reason</Label>
                <Select
                  value={formState.refundReason}
                  onValueChange={handleRefundReasonChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="refundReason"
                    className={errors.refundReason ? "border-destructive focus-visible:ring-destructive" : ""}
                    aria-invalid={!!errors.refundReason}
                  >
                    <SelectValue placeholder="Select refund reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFUND_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.refundReason && (
                  <p className="text-sm text-destructive">{errors.refundReason}</p>
                )}
              </div>
            )}

            {/* Refund Method */}
            <div className="space-y-2">
              <Label htmlFor="refundMethod">Refund Method</Label>
              <Select
                value={formState.refundMethod}
                onValueChange={handleRefundMethodChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="refundMethod"
                  className={errors.refundMethod ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!errors.refundMethod}
                >
                  <SelectValue placeholder="Select refund method" />
                </SelectTrigger>
                <SelectContent>
                  {REFUND_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.refundMethod && (
                <p className="text-sm text-destructive">{errors.refundMethod}</p>
              )}
            </div>

            {/* Refund Date */}
            <div className="space-y-2">
              <Label htmlFor="refundDate">Refund Date</Label>
              <Input
                id="refundDate"
                type="date"
                value={formState.refundDate}
                onChange={(e) => handleRefundDateChange(e.target.value)}
                disabled={isSubmitting}
                className={errors.refundDate ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!errors.refundDate}
              />
              {errors.refundDate && (
                <p className="text-sm text-destructive">{errors.refundDate}</p>
              )}
            </div>

            {/* Reference Number (for Bank Transfer/Check/Original) */}
            {(formState.refundMethod === PaymentMethod.BANK_TRANSFER || 
              formState.refundMethod === PaymentMethod.CHECK ||
              formState.refundMethod === 'original') && (
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  type="text"
                  value={formState.referenceNumber}
                  onChange={(e) => handleReferenceNumberChange(e.target.value)}
                  placeholder="Enter reference number"
                  disabled={isSubmitting}
                  className={errors.referenceNumber ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!errors.referenceNumber}
                />
                {errors.referenceNumber && (
                  <p className="text-sm text-destructive">{errors.referenceNumber}</p>
                )}
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
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting || remainingRefundable <= 0}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default RefundDialog;
