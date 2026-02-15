/**
 * InsuranceClaimDialog Component
 * 
 * Modal dialog for quick insurance claim submission.
 * Features insurance provider selection, policy number, claim amount,
 * service/admission/discharge dates, diagnosis codes, and validation.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  InsuranceClaimFormData, 
  PatientInsurance,
  ClaimStatus 
} from '@/types/billing';

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
import { Checkbox } from '@/components/ui/checkbox';
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

export interface InsuranceClaimDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Bill ID for the claim */
  billId: number;
  /** Total bill amount (for balance check) */
  billTotal: number;
  /** Amount already paid */
  amountPaid: number;
  /** Available patient insurances */
  patientInsurances: PatientInsurance[];
  /** Callback when claim is submitted */
  onSubmitClaim: (data: InsuranceClaimFormData) => Promise<void>;
  /** Callback when claim is saved as draft */
  onSaveDraft?: (data: InsuranceClaimFormData) => Promise<void>;
  /** Callback on success */
  onSuccess?: (claim: { id: number; claim_number: string; status: ClaimStatus }) => void;
  /** Currency code for display */
  currency?: string;
  /** Custom title for the dialog */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

interface InsuranceClaimFormState {
  patient_insurance_id: number | null;
  policy_number: string;
  claim_amount: string;
  service_date: string;
  admission_date: string;
  discharge_date: string;
  diagnosis_code: string;
  primary_diagnosis: boolean;
  notes: string;
}

interface InsuranceClaimValidationErrors {
  patient_insurance_id?: string;
  policy_number?: string;
  claim_amount?: string;
  service_date?: string;
  admission_date?: string;
  diagnosis_code?: string;
  submit?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CURRENCY = 'AFN';

const MIN_CLAIM_AMOUNT = 0.01;
const MAX_CLAIM_AMOUNT = 999999999.99;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Parse amount string to number
 */
function parseAmount(value: string): number {
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

// ============================================================================
// InsuranceClaimDialog Component
// ============================================================================

export function InsuranceClaimDialog({
  open,
  onOpenChange,
  billId,
  billTotal,
  amountPaid,
  patientInsurances,
  onSubmitClaim,
  onSaveDraft,
  onSuccess,
  currency = DEFAULT_CURRENCY,
  title = 'Submit Insurance Claim',
  className,
}: InsuranceClaimDialogProps) {
  // Calculate balance due
  const balanceDue = React.useMemo(() => {
    return Math.max(0, billTotal - amountPaid);
  }, [billTotal, amountPaid]);

  // Form state
  const [formState, setFormState] = React.useState<InsuranceClaimFormState>({
    patient_insurance_id: null,
    policy_number: '',
    claim_amount: formatAmount(balanceDue),
    service_date: formatDateForInput(new Date()),
    admission_date: '',
    discharge_date: '',
    diagnosis_code: '',
    primary_diagnosis: false,
    notes: '',
  });

  // Validation errors
  const [errors, setErrors] = React.useState<InsuranceClaimValidationErrors>({});

  // Submit state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormState({
        patient_insurance_id: null,
        policy_number: '',
        claim_amount: formatAmount(balanceDue),
        service_date: formatDateForInput(new Date()),
        admission_date: '',
        discharge_date: '',
        diagnosis_code: '',
        primary_diagnosis: false,
        notes: '',
      });
      setErrors({});
      setSubmitSuccess(false);
      setIsSubmitting(false);
    }
  }, [open, balanceDue]);

  /**
   * Handle patient insurance change
   */
  function handlePatientInsuranceChange(value: string) {
    const insuranceId = parseInt(value, 10);
    const insurance = patientInsurances.find(pi => pi.id === insuranceId);
    
    setFormState((prev) => ({
      ...prev,
      patient_insurance_id: insuranceId,
      policy_number: insurance?.policy_number || '',
    }));
    clearError('patient_insurance_id');
  }

  /**
   * Handle policy number change
   */
  function handlePolicyNumberChange(value: string) {
    setFormState((prev) => ({ ...prev, policy_number: value }));
    clearError('policy_number');
  }

  /**
   * Handle claim amount change
   */
  function handleClaimAmountChange(value: string) {
    // Allow only numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    let sanitized = cleaned;
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setFormState((prev) => ({ ...prev, claim_amount: sanitized }));
    clearError('claim_amount');
  }

  /**
   * Handle service date change
   */
  function handleServiceDateChange(value: string) {
    setFormState((prev) => ({ ...prev, service_date: value }));
    clearError('service_date');
  }

  /**
   * Handle admission date change
   */
  function handleAdmissionDateChange(value: string) {
    setFormState((prev) => ({ ...prev, admission_date: value }));
    clearError('admission_date');
  }

  /**
   * Handle discharge date change
   */
  function handleDischargeDateChange(value: string) {
    setFormState((prev) => ({ ...prev, discharge_date: value }));
  }

  /**
   * Handle diagnosis code change
   */
  function handleDiagnosisCodeChange(value: string) {
    setFormState((prev) => ({ ...prev, diagnosis_code: value }));
    clearError('diagnosis_code');
  }

  /**
   * Handle primary diagnosis change
   */
  function handlePrimaryDiagnosisChange(checked: boolean) {
    setFormState((prev) => ({ ...prev, primary_diagnosis: checked }));
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
  function clearError(field: keyof InsuranceClaimValidationErrors) {
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
    const newErrors: InsuranceClaimValidationErrors = {};
    const claimAmount = parseAmount(formState.claim_amount);

    // Validate patient insurance
    if (!formState.patient_insurance_id) {
      newErrors.patient_insurance_id = 'Please select a patient insurance';
    }

    // Validate policy number
    if (!formState.policy_number.trim()) {
      newErrors.policy_number = 'Policy number is required';
    }

    // Validate claim amount
    if (!formState.claim_amount || formState.claim_amount.trim() === '') {
      newErrors.claim_amount = 'Claim amount is required';
    } else if (claimAmount < MIN_CLAIM_AMOUNT) {
      newErrors.claim_amount = `Claim amount must be at least ${formatAmount(MIN_CLAIM_AMOUNT)}`;
    } else if (claimAmount > MAX_CLAIM_AMOUNT) {
      newErrors.claim_amount = 'Claim amount is too large';
    } else if (claimAmount > balanceDue) {
      newErrors.claim_amount = `Claim amount cannot exceed balance due (${formatAmount(balanceDue)})`;
    }

    // Validate service date
    if (!formState.service_date) {
      newErrors.service_date = 'Service date is required';
    }

    // Validate admission date if provided
    if (formState.admission_date && formState.service_date) {
      const admissionDate = new Date(formState.admission_date);
      const serviceDate = new Date(formState.service_date);
      if (admissionDate > serviceDate) {
        newErrors.admission_date = 'Admission date cannot be after service date';
      }
    }

    // Validate diagnosis code
    if (!formState.diagnosis_code.trim()) {
      newErrors.diagnosis_code = 'Diagnosis/ICD code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Get form data for submission
   */
  function getFormData(): InsuranceClaimFormData {
    return {
      bill_id: billId,
      patient_insurance_id: formState.patient_insurance_id!,
      claim_amount: parseAmount(formState.claim_amount),
      notes: formState.notes || undefined,
    };
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
      const claimData = getFormData();
      await onSubmitClaim(claimData);
      setSubmitSuccess(true);

      // Close dialog after brief delay to show success
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess({
            id: 0, // Will be set by the API response
            claim_number: '',
            status: ClaimStatus.SUBMITTED,
          });
        }
      }, 1500);
    } catch (error) {
      console.error('Claim submission error:', error);
      setErrors({
        submit: 'Failed to submit claim. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handle save as draft
   */
  async function handleSaveDraft() {
    if (!formState.patient_insurance_id) {
      setErrors({ patient_insurance_id: 'Please select a patient insurance to save as draft' });
      return;
    }

    setIsSubmitting(true);

    try {
      const claimData = getFormData();
      if (onSaveDraft) {
        await onSaveDraft(claimData);
      } else {
        // Default behavior - just close the dialog
        await onSubmitClaim(claimData);
      }
      setSubmitSuccess(true);

      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Draft save error:', error);
      setErrors({
        submit: 'Failed to save draft. Please try again.',
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
      patient_insurance_id: null,
      policy_number: '',
      claim_amount: formatAmount(balanceDue),
      service_date: formatDateForInput(new Date()),
      admission_date: '',
      discharge_date: '',
      diagnosis_code: '',
      primary_diagnosis: false,
      notes: '',
    });
    setErrors({});
    setSubmitSuccess(false);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  // Get input amount as number for display
  const inputClaimAmount = React.useMemo(() => {
    return parseAmount(formState.claim_amount);
  }, [formState.claim_amount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-lg max-h-[90vh] overflow-y-auto', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Enter insurance claim details to submit a claim for this bill.
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium">
              Claim submitted successfully!
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

        {/* Claim Form */}
        {!submitSuccess && (
          <div className="space-y-4">
            {/* Patient Insurance Selection */}
            <div className="space-y-2">
              <Label htmlFor="patientInsurance">Patient Insurance</Label>
              <Select
                value={formState.patient_insurance_id?.toString() || ''}
                onValueChange={handlePatientInsuranceChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="patientInsurance"
                  className={errors.patient_insurance_id ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-invalid={!!errors.patient_insurance_id}
                >
                  <SelectValue placeholder="Select patient insurance" />
                </SelectTrigger>
                <SelectContent>
                  {patientInsurances.map((insurance) => (
                    <SelectItem key={insurance.id} value={insurance.id.toString()}>
                      {insurance.insurance_provider?.name || 'Unknown Provider'} - {insurance.policy_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_insurance_id && (
                <p className="text-sm text-destructive">{errors.patient_insurance_id}</p>
              )}
            </div>

            {/* Policy Number */}
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input
                id="policyNumber"
                type="text"
                value={formState.policy_number}
                onChange={(e) => handlePolicyNumberChange(e.target.value)}
                className={errors.policy_number ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Enter policy number"
                disabled={isSubmitting}
                aria-invalid={!!errors.policy_number}
              />
              {errors.policy_number && (
                <p className="text-sm text-destructive">{errors.policy_number}</p>
              )}
            </div>

            {/* Claim Amount */}
            <div className="space-y-2">
              <Label htmlFor="claimAmount">Claim Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currency === 'AFN' ? '؋' : currency}
                </span>
                <Input
                  id="claimAmount"
                  type="text"
                  inputMode="decimal"
                  value={formState.claim_amount}
                  onChange={(e) => handleClaimAmountChange(e.target.value)}
                  className={cn(
                    "pl-8",
                    errors.claim_amount && "border-destructive focus-visible:ring-destructive"
                  )}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.claim_amount}
                />
              </div>
              {errors.claim_amount && (
                <p className="text-sm text-destructive">{errors.claim_amount}</p>
              )}
              {inputClaimAmount > 0 && inputClaimAmount <= balanceDue && (
                <p className="text-xs text-muted-foreground">
                  <CurrencyDisplay 
                    amount={balanceDue - inputClaimAmount} 
                    currency={currency}
                    prefix="Remaining patient responsibility: "
                  />
                </p>
              )}
            </div>

            {/* Service Date */}
            <div className="space-y-2">
              <Label htmlFor="serviceDate">Service Date *</Label>
              <Input
                id="serviceDate"
                type="date"
                value={formState.service_date}
                onChange={(e) => handleServiceDateChange(e.target.value)}
                className={errors.service_date ? "border-destructive focus-visible:ring-destructive" : ""}
                disabled={isSubmitting}
                aria-invalid={!!errors.service_date}
              />
              {errors.service_date && (
                <p className="text-sm text-destructive">{errors.service_date}</p>
              )}
            </div>

            {/* Admission Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="admissionDate">Admission Date (Optional)</Label>
              <Input
                id="admissionDate"
                type="date"
                value={formState.admission_date}
                onChange={(e) => handleAdmissionDateChange(e.target.value)}
                className={errors.admission_date ? "border-destructive focus-visible:ring-destructive" : ""}
                disabled={isSubmitting}
                aria-invalid={!!errors.admission_date}
              />
              {errors.admission_date && (
                <p className="text-sm text-destructive">{errors.admission_date}</p>
              )}
            </div>

            {/* Discharge Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="dischargeDate">Discharge Date (Optional)</Label>
              <Input
                id="dischargeDate"
                type="date"
                value={formState.discharge_date}
                onChange={(e) => handleDischargeDateChange(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Diagnosis/ICD Code */}
            <div className="space-y-2">
              <Label htmlFor="diagnosisCode">Diagnosis/ICD Code *</Label>
              <Input
                id="diagnosisCode"
                type="text"
                value={formState.diagnosis_code}
                onChange={(e) => handleDiagnosisCodeChange(e.target.value)}
                className={errors.diagnosis_code ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="e.g., J06.9 (Acute upper respiratory infection)"
                disabled={isSubmitting}
                aria-invalid={!!errors.diagnosis_code}
              />
              {errors.diagnosis_code && (
                <p className="text-sm text-destructive">{errors.diagnosis_code}</p>
              )}
            </div>

            {/* Primary Diagnosis Checkbox */}
            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="primaryDiagnosis"
                checked={formState.primary_diagnosis}
                onCheckedChange={(checked) => handlePrimaryDiagnosisChange(checked as boolean)}
                disabled={isSubmitting}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="primaryDiagnosis"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Primary Diagnosis
                </Label>
                <p className="text-sm text-muted-foreground">
                  Check if this is the primary diagnosis for the claim
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formState.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Additional notes or comments..."
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Dialog Footer */}
        {!submitSuccess && (
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InsuranceClaimDialog;
