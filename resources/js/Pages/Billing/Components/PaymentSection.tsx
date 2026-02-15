/**
 * PaymentSection Component
 *
 * Displays existing payments and provides a form to record new payments.
 * Handles different payment methods with appropriate fields.
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
import { PaymentMethodIcon } from '@/components/billing/PaymentMethodIcon';
import { usePaymentProcessing } from '@/hooks/billing/usePaymentProcessing';
import {
    PaymentMethod,
    PaymentStatus,
    type Bill,
    type Payment,
    type PaymentFormData,
} from '@/types/billing';
import {
    Plus,
    Currency,
    CreditCard,
    Banknote,
    Landmark,
    FileText,
    AlertCircle,
    CheckCircle2,
    Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PaymentSectionProps {
    bill: Bill;
    payments: Payment[];
    onRecordPayment: (data: PaymentFormData) => Promise<void>;
    onRefundPayment?: (paymentId: number, amount: number, reason: string) => Promise<void>;
    canRecordPayment?: boolean;
    canRefund?: boolean;
    currency?: string;
}

const PAYMENT_METHODS = [
    { value: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: CreditCard },
    { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card', icon: CreditCard },
    { value: PaymentMethod.CHECK, label: 'Check', icon: FileText },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: Landmark },
    { value: PaymentMethod.INSURANCE, label: 'Insurance', icon: Receipt },
    { value: PaymentMethod.ONLINE, label: 'Online Payment', icon: CreditCard },
    { value: PaymentMethod.MOBILE_PAYMENT, label: 'Mobile Payment', icon: CreditCard },
];

export function PaymentSection({
    bill,
    payments,
    onRecordPayment,
    onRefundPayment,
    canRecordPayment = true,
    canRefund = false,
    currency = 'AFN',
}: PaymentSectionProps) {
    const [showPaymentDialog, setShowPaymentDialog] = React.useState(false);
    const [showRefundDialog, setShowRefundDialog] = React.useState(false);
    const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
    const [refundAmount, setRefundAmount] = React.useState('');
    const [refundReason, setRefundReason] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Calculate remaining balance from bill
    const remainingBalance = bill.balance_due || Math.max(0, bill.total_amount - (bill.amount_paid || 0));

    const {
        formState,
        setFormField,
        setPaymentMethod,
        setAmount,
        setAmountTendered,
        numericAmount,
        changeDue,
        errors,
        isValid,
        requiresReference,
        requiresCardDetails,
        requiresBankDetails,
        isCashPayment,
        resetForm,
        handleSubmit,
    } = usePaymentProcessing({
        bill,
        maxPaymentAmount: remainingBalance,
        onSubmit: async (data) => {
            setIsSubmitting(true);
            try {
                await onRecordPayment(data);
                setShowPaymentDialog(false);
                resetForm();
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // Handle refund submission
    const handleRefund = async () => {
        if (!selectedPayment || !onRefundPayment) return;

        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0 || amount > selectedPayment.amount) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onRefundPayment(selectedPayment.id, amount, refundReason);
            setShowRefundDialog(false);
            setSelectedPayment(null);
            setRefundAmount('');
            setRefundReason('');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get status badge
    const getStatusBadge = (status: PaymentStatus) => {
        const variants: Record<PaymentStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            [PaymentStatus.PAID]: { variant: 'default', label: 'Paid' },
            [PaymentStatus.PENDING]: { variant: 'secondary', label: 'Pending' },
            [PaymentStatus.PARTIAL]: { variant: 'secondary', label: 'Partial' },
            [PaymentStatus.UNPAID]: { variant: 'outline', label: 'Unpaid' },
            [PaymentStatus.FAILED]: { variant: 'destructive', label: 'Failed' },
            [PaymentStatus.REFUNDED]: { variant: 'destructive', label: 'Refunded' },
        };
        const config = variants[status] || variants[PaymentStatus.UNPAID];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    // Calculate total payments
    const totalPayments = payments.reduce((sum, p) => sum + (p.status === PaymentStatus.PAID ? p.amount : 0), 0);
    const totalRefunds = payments.reduce(
        (sum, p) => sum + (p.refunds?.reduce((r, ref) => r + ref.refund_amount, 0) || 0),
        0
    );

    return (
        <div className="space-y-6">
            {/* Payment Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                    <CardDescription>Overview of bill payment status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-xl font-semibold">
                                <CurrencyDisplay amount={bill.total_amount} currency={currency} />
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Amount Paid</p>
                            <p className="text-xl font-semibold text-green-600">
                                <CurrencyDisplay amount={totalPayments} currency={currency} />
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Balance Due</p>
                            <p className={cn('text-xl font-semibold', remainingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                                <CurrencyDisplay amount={remainingBalance} currency={currency} />
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Refunds</p>
                            <p className="text-xl font-semibold text-orange-600">
                                <CurrencyDisplay amount={totalRefunds} currency={currency} />
                            </p>
                        </div>
                    </div>

                    {remainingBalance > 0 && canRecordPayment && (
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setShowPaymentDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payments List */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>{payments.length} payment(s) recorded</CardDescription>
                </CardHeader>
                <CardContent>
                    {payments.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        {canRefund && <TableHead className="w-[100px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <React.Fragment key={payment.id}>
                                            <TableRow>
                                                <TableCell>
                                                    {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <PaymentMethodIcon
                                                        method={payment.payment_method}
                                                        size="sm"
                                                        showLabel
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {payment.reference_number || payment.transaction_id || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={payment.amount} currency={currency} />
                                                </TableCell>
                                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                                {canRefund && payment.status === PaymentStatus.PAID && (
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPayment(payment);
                                                                setRefundAmount(payment.amount.toString());
                                                                setShowRefundDialog(true);
                                                            }}
                                                        >
                                                            Refund
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                            {/* Show refunds if any */}
                                            {payment.refunds && payment.refunds.length > 0 && (
                                                <TableRow className="bg-muted/50">
                                                    <TableCell colSpan={canRefund ? 6 : 5} className="py-2">
                                                        <div className="pl-8 space-y-1">
                                                            {payment.refunds.map((refund) => (
                                                                <div
                                                                    key={refund.id}
                                                                    className="flex items-center justify-between text-sm"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <AlertCircle className="h-3 w-3 text-orange-500" />
                                                                        <span className="text-muted-foreground">
                                                                            Refund: {refund.refund_reason}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            ({format(new Date(refund.created_at || ''), 'MMM dd, yyyy')})
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-orange-600 font-medium">
                                                                        -<CurrencyDisplay amount={refund.refund_amount} currency={currency} />
                                                                    </span>
                                                                </div>
                                                            ))}
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
                            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No payments recorded yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Record Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a new payment for bill {bill.bill_number}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Balance Info */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Balance due: <CurrencyDisplay amount={remainingBalance} currency={currency} />
                            </AlertDescription>
                        </Alert>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select
                                value={formState.payment_method}
                                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map((method) => (
                                        <SelectItem key={method.value} value={method.value}>
                                            <div className="flex items-center gap-2">
                                                <method.icon className="h-4 w-4" />
                                                {method.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Payment Amount</Label>
                            <div className="relative">
                                <Currency className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    max={remainingBalance}
                                    step="0.01"
                                    value={formState.amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-9"
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-sm text-red-500">{errors.amount}</p>
                            )}
                        </div>

                        {/* Cash Payment - Amount Tendered */}
                        {isCashPayment && (
                            <div className="space-y-2">
                                <Label htmlFor="amount_tendered">Amount Tendered</Label>
                                <div className="relative">
                                    <Currency className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="amount_tendered"
                                        type="number"
                                        min={numericAmount}
                                        step="0.01"
                                        value={formState.amount_tendered}
                                        onChange={(e) => setAmountTendered(e.target.value)}
                                        className="pl-9"
                                        placeholder="0.00"
                                    />
                                </div>
                                {changeDue > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Change due: <CurrencyDisplay amount={changeDue} currency={currency} />
                                    </div>
                                )}
                                {errors.amount_tendered && (
                                    <p className="text-sm text-red-500">{errors.amount_tendered}</p>
                                )}
                            </div>
                        )}

                        {/* Reference Number */}
                        {requiresReference && (
                            <div className="space-y-2">
                                <Label htmlFor="reference_number">
                                    Reference Number {requiresReference && '*'}
                                </Label>
                                <Input
                                    id="reference_number"
                                    value={formState.reference_number}
                                    onChange={(e) => setFormField('reference_number', e.target.value)}
                                    placeholder="Transaction reference"
                                />
                                {errors.reference_number && (
                                    <p className="text-sm text-red-500">{errors.reference_number}</p>
                                )}
                            </div>
                        )}

                        {/* Card Details */}
                        {requiresCardDetails && (
                            <div className="space-y-2">
                                <Label htmlFor="card_last_four">Card Last 4 Digits *</Label>
                                <Input
                                    id="card_last_four"
                                    maxLength={4}
                                    value={formState.card_last_four}
                                    onChange={(e) => setFormField('card_last_four', e.target.value)}
                                    placeholder="1234"
                                />
                                {errors.card_last_four && (
                                    <p className="text-sm text-red-500">{errors.card_last_four}</p>
                                )}
                            </div>
                        )}

                        {/* Bank Details */}
                        {requiresBankDetails && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Bank Name *</Label>
                                    <Input
                                        id="bank_name"
                                        value={formState.bank_name}
                                        onChange={(e) => setFormField('bank_name', e.target.value)}
                                        placeholder="Bank name"
                                    />
                                    {errors.bank_name && (
                                        <p className="text-sm text-red-500">{errors.bank_name}</p>
                                    )}
                                </div>
                                {formState.payment_method === PaymentMethod.CHECK && (
                                    <div className="space-y-2">
                                        <Label htmlFor="check_number">Check Number *</Label>
                                        <Input
                                            id="check_number"
                                            value={formState.check_number}
                                            onChange={(e) => setFormField('check_number', e.target.value)}
                                            placeholder="Check number"
                                        />
                                        {errors.check_number && (
                                            <p className="text-sm text-red-500">{errors.check_number}</p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_date">Payment Date</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={formState.payment_date}
                                onChange={(e) => setFormField('payment_date', e.target.value)}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                value={formState.notes}
                                onChange={(e) => setFormField('notes', e.target.value)}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleSubmit()}
                            disabled={!isValid || isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>


                </DialogContent>
            </Dialog>

            {/* Refund Dialog */}
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Process Refund</DialogTitle>
                        <DialogDescription>
                            Refund payment for <CurrencyDisplay amount={selectedPayment?.amount || 0} currency={currency} />
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                This action cannot be undone. The refund will be processed immediately.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="refund_amount">Refund Amount *</Label>
                            <div className="relative">
                                <Currency className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="refund_amount"
                                    type="number"
                                    min="0.01"
                                    max={selectedPayment?.amount}
                                    step="0.01"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="refund_reason">Refund Reason *</Label>
                            <Input
                                id="refund_reason"
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Enter reason for refund"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRefund}
                            disabled={
                                isSubmitting ||
                                !refundReason.trim() ||
                                parseFloat(refundAmount) <= 0 ||
                                parseFloat(refundAmount) > (selectedPayment?.amount || 0)
                            }
                        >
                            {isSubmitting ? 'Processing...' : 'Process Refund'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
