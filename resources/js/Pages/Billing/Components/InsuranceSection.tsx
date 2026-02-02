/**
 * InsuranceSection Component
 *
 * Displays patient insurance information and manages insurance claims.
 * Allows submitting new claims and viewing claim status.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { ClaimStatusBadge } from '@/components/billing/BillStatusBadge';
import {
    ClaimStatus,
    type Bill,
    type PatientInsurance,
    type InsuranceClaim,
    type InsuranceClaimFormData,
} from '@/types/billing';
import {
    Plus,
    Shield,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Building,
    CreditCard,
    Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InsuranceSectionProps {
    bill: Bill;
    patientInsurances: PatientInsurance[];
    claims: InsuranceClaim[];
    onSubmitClaim: (data: InsuranceClaimFormData) => Promise<void>;
    canSubmitClaim?: boolean;
    currency?: string;
}

export function InsuranceSection({
    bill,
    patientInsurances,
    claims,
    onSubmitClaim,
    canSubmitClaim = true,
    currency = 'USD',
}: InsuranceSectionProps) {
    const [showClaimDialog, setShowClaimDialog] = React.useState(false);
    const [selectedInsurance, setSelectedInsurance] = React.useState<string>('');
    const [claimAmount, setClaimAmount] = React.useState<string>('');
    const [deductibleAmount, setDeductibleAmount] = React.useState<string>('');
    const [coPayAmount, setCoPayAmount] = React.useState<string>('');
    const [claimNotes, setClaimNotes] = React.useState<string>('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Get primary insurance
    const primaryInsurance = patientInsurances.find((pi) => pi.is_primary && pi.is_active);

    // Calculate totals
    const totalClaimed = claims.reduce((sum, c) => sum + c.claim_amount, 0);
    const totalApproved = claims.reduce(
        (sum, c) => sum + (c.status === ClaimStatus.APPROVED ? c.approved_amount || 0 : 0),
        0
    );
    const pendingClaims = claims.filter((c) => c.status === ClaimStatus.PENDING || c.status === ClaimStatus.SUBMITTED);

    // Handle claim submission
    const handleSubmitClaim = async () => {
        if (!selectedInsurance || !claimAmount) return;

        setIsSubmitting(true);
        try {
            const data: InsuranceClaimFormData = {
                bill_id: bill.id,
                patient_insurance_id: parseInt(selectedInsurance),
                claim_amount: parseFloat(claimAmount),
                deductible_amount: parseFloat(deductibleAmount) || 0,
                co_pay_amount: parseFloat(coPayAmount) || 0,
                notes: claimNotes,
            };

            await onSubmitClaim(data);
            setShowClaimDialog(false);
            resetForm();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setSelectedInsurance('');
        setClaimAmount('');
        setDeductibleAmount('');
        setCoPayAmount('');
        setClaimNotes('');
    };

    // Get claim status icon
    const getClaimStatusIcon = (status: ClaimStatus) => {
        switch (status) {
            case ClaimStatus.APPROVED:
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case ClaimStatus.REJECTED:
                return <XCircle className="h-4 w-4 text-red-500" />;
            case ClaimStatus.PENDING:
            case ClaimStatus.SUBMITTED:
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    // Get coverage type label
    const getCoverageTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            medical: 'Medical',
            dental: 'Dental',
            vision: 'Vision',
            pharmacy: 'Pharmacy',
            mental_health: 'Mental Health',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Insurance Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Insurance Summary</CardTitle>
                    <CardDescription>Overview of insurance coverage and claims</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Claimed</p>
                            <p className="text-xl font-semibold">
                                <CurrencyDisplay amount={totalClaimed} currency={currency} />
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Approved Amount</p>
                            <p className="text-xl font-semibold text-green-600">
                                <CurrencyDisplay amount={totalApproved} currency={currency} />
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Pending Claims</p>
                            <p className="text-xl font-semibold text-yellow-600">{pendingClaims.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Available Coverage</p>
                            <p className="text-xl font-semibold">
                                {primaryInsurance ? (
                                    <CurrencyDisplay
                                        amount={Math.max(
                                            0,
                                            (primaryInsurance.annual_max_coverage || 0) -
                                                (primaryInsurance.annual_used_amount || 0)
                                        )}
                                        currency={currency}
                                    />
                                ) : (
                                    'N/A'
                                )}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Patient Insurance Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Patient Insurance</CardTitle>
                    <CardDescription>Active insurance policies for this patient</CardDescription>
                </CardHeader>
                <CardContent>
                    {patientInsurances.length > 0 ? (
                        <div className="space-y-4">
                            {patientInsurances.map((insurance) => (
                                <div
                                    key={insurance.id}
                                    className={cn(
                                        'p-4 border rounded-lg',
                                        insurance.is_primary && 'border-blue-500 bg-blue-50/50'
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">
                                                        {insurance.insurance_provider?.name}
                                                    </h4>
                                                    {insurance.is_primary && (
                                                        <Badge variant="default" className="text-xs">
                                                            Primary
                                                        </Badge>
                                                    )}
                                                    {!insurance.is_active && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Policy: {insurance.policy_number}
                                                </p>
                                                {insurance.policy_holder_name && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Holder: {insurance.policy_holder_name}
                                                        {insurance.relationship_to_patient &&
                                                            insurance.relationship_to_patient !== 'self' && (
                                                                <span className="text-xs">
                                                                    {' '}
                                                                    ({insurance.relationship_to_patient})
                                                                </span>
                                                            )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-sm">
                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                <span>Co-pay:</span>
                                                <span className="font-medium">
                                                    {insurance.co_pay_amount ? (
                                                        <CurrencyDisplay amount={insurance.co_pay_amount} currency={currency} />
                                                    ) : insurance.co_pay_percentage ? (
                                                        `${insurance.co_pay_percentage}%`
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Deductible:{' '}
                                                <CurrencyDisplay amount={insurance.deductible_amount || 0} currency={currency} />
                                            </div>
                                        </div>
                                    </div>

                                    {(insurance as unknown as { coverage_types?: string[] }).coverage_types && (insurance as unknown as { coverage_types?: string[] }).coverage_types!.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {(insurance as unknown as { coverage_types?: string[] }).coverage_types!.map((type: string) => (
                                                <Badge key={type} variant="outline" className="text-xs">
                                                    {getCoverageTypeLabel(type)}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {(insurance.coverage_start_date || insurance.coverage_end_date) && (
                                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {insurance.coverage_start_date &&
                                                    format(new Date(insurance.coverage_start_date), 'MMM dd, yyyy')}
                                                {insurance.coverage_start_date && insurance.coverage_end_date && ' - '}
                                                {insurance.coverage_end_date &&
                                                    format(new Date(insurance.coverage_end_date), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No insurance information on file</p>
                        </div>
                    )}

                    {patientInsurances.length > 0 && canSubmitClaim && bill.balance_due > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setShowClaimDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Submit Insurance Claim
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Claims List */}
            <Card>
                <CardHeader>
                    <CardTitle>Insurance Claims</CardTitle>
                    <CardDescription>{claims.length} claim(s) submitted</CardDescription>
                </CardHeader>
                <CardContent>
                    {claims.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Claim #</TableHead>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead className="text-right">Claimed</TableHead>
                                        <TableHead className="text-right">Approved</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {claims.map((claim) => (
                                        <React.Fragment key={claim.id}>
                                            <TableRow>
                                                <TableCell className="font-medium">
                                                    {claim.claim_number}
                                                </TableCell>
                                                <TableCell>
                                                    {claim.patient_insurance?.insurance_provider?.name}
                                                </TableCell>
                                                <TableCell>
                                                    {claim.submission_date
                                                        ? format(new Date(claim.submission_date), 'MMM dd, yyyy')
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={claim.claim_amount} currency={currency} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {claim.approved_amount ? (
                                                        <CurrencyDisplay
                                                            amount={claim.approved_amount}
                                                            currency={currency}
                                                            color={claim.approved_amount < claim.claim_amount ? 'warning' : 'success'}
                                                        />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getClaimStatusIcon(claim.status)}
                                                        <ClaimStatusBadge status={claim.status} size="sm" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {/* Show rejection reason if rejected */}
                                            {claim.status === ClaimStatus.REJECTED && claim.rejection_reason && (
                                                <TableRow className="bg-red-50/50">
                                                    <TableCell colSpan={6} className="py-2">
                                                        <div className="pl-8 flex items-start gap-2 text-sm text-red-600">
                                                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                            <span>Rejection reason: {claim.rejection_reason}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {/* Show notes if any */}
                                            {claim.notes && (
                                                <TableRow className="bg-muted/30">
                                                    <TableCell colSpan={6} className="py-2">
                                                        <div className="pl-8 text-sm text-muted-foreground">
                                                            <span className="font-medium">Notes:</span> {claim.notes}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No insurance claims submitted yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit Claim Dialog */}
            <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Submit Insurance Claim</DialogTitle>
                        <DialogDescription>
                            Submit a new insurance claim for bill {bill.bill_number}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Balance Info */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Balance due: <CurrencyDisplay amount={bill.balance_due} currency={currency} />
                            </AlertDescription>
                        </Alert>

                        {/* Insurance Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="insurance">Insurance Policy *</Label>
                            <Select value={selectedInsurance} onValueChange={setSelectedInsurance}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select insurance policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {patientInsurances
                                        .filter((pi) => pi.is_active)
                                        .map((insurance) => (
                                            <SelectItem key={insurance.id} value={insurance.id.toString()}>
                                                {insurance.insurance_provider?.name} - {insurance.policy_number}
                                                {insurance.is_primary && ' (Primary)'}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Claim Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="claim_amount">Claim Amount *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="claim_amount"
                                    type="number"
                                    min="0.01"
                                    max={bill.balance_due}
                                    step="0.01"
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(e.target.value)}
                                    className="pl-7"
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Maximum claim amount: <CurrencyDisplay amount={bill.balance_due} currency={currency} />
                            </p>
                        </div>

                        {/* Deductible */}
                        <div className="space-y-2">
                            <Label htmlFor="deductible">Deductible Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="deductible"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={deductibleAmount}
                                    onChange={(e) => setDeductibleAmount(e.target.value)}
                                    className="pl-7"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Co-pay */}
                        <div className="space-y-2">
                            <Label htmlFor="copay">Co-pay Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input
                                    id="copay"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={coPayAmount}
                                    onChange={(e) => setCoPayAmount(e.target.value)}
                                    className="pl-7"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                value={claimNotes}
                                onChange={(e) => setClaimNotes(e.target.value)}
                                placeholder="Optional notes about this claim"
                            />
                        </div>

                        {/* Summary */}
                        {claimAmount && (
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <h4 className="font-medium">Claim Summary</h4>
                                <div className="flex justify-between text-sm">
                                    <span>Claim Amount:</span>
                                    <CurrencyDisplay amount={parseFloat(claimAmount) || 0} currency={currency} />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Deductible:</span>
                                    <span className="text-red-600">
                                        -<CurrencyDisplay amount={parseFloat(deductibleAmount) || 0} currency={currency} />
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Co-pay:</span>
                                    <span className="text-red-600">
                                        -<CurrencyDisplay amount={parseFloat(coPayAmount) || 0} currency={currency} />
                                    </span>
                                </div>
                                <div className="border-t pt-2 flex justify-between font-medium">
                                    <span>Expected Reimbursement:</span>
                                    <CurrencyDisplay
                                        amount={Math.max(
                                            0,
                                            (parseFloat(claimAmount) || 0) -
                                                (parseFloat(deductibleAmount) || 0) -
                                                (parseFloat(coPayAmount) || 0)
                                        )}
                                        currency={currency}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitClaim}
                            disabled={
                                isSubmitting ||
                                !selectedInsurance ||
                                !claimAmount ||
                                parseFloat(claimAmount) <= 0
                            }
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
