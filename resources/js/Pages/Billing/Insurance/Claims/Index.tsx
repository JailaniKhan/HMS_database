import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    Shield,
    Calendar,
    Search,
    FileText,
    Eye,
    Download,
    Filter,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    Building,
    DollarSign,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { ClaimStatus, type InsuranceClaim } from '@/types/billing';
import { format, parseISO } from 'date-fns';

interface ClaimWithRelations extends Omit<InsuranceClaim, 'bill' | 'patient_insurance' | 'submitted_by_user' | 'processed_by_user'> {
    bill?: {
        id: number;
        bill_number: string;
        patient?: {
            full_name: string;
            patient_id: string;
        };
    };
    patient_insurance?: {
        policy_number: string;
        insurance_provider?: {
            name: string;
        };
    };
    submitted_by_user?: {
        name: string;
    };
    processed_by_user?: {
        name: string;
    };
}

interface ClaimFilters {
    search?: string;
    status?: ClaimStatus;
    provider_id?: number;
    date_from?: string;
    date_to?: string;
}

interface ClaimIndexProps {
    claims: {
        data: ClaimWithRelations[];
        links: Record<string, unknown>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    filters?: ClaimFilters;
    statistics?: {
        total_claims: number;
        pending_claims: number;
        approved_claims: number;
        rejected_claims: number;
        total_claimed: number;
        total_approved: number;
    };
    providers?: Array<{
        id: number;
        name: string;
    }>;
}

const CLAIM_STATUSES = [
    { value: ClaimStatus.DRAFT, label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: ClaimStatus.SUBMITTED, label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
    { value: ClaimStatus.PENDING, label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: ClaimStatus.APPROVED, label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: ClaimStatus.PARTIAL, label: 'Partial', color: 'bg-purple-100 text-purple-800' },
    { value: ClaimStatus.REJECTED, label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: ClaimStatus.APPEALED, label: 'Appealed', color: 'bg-orange-100 text-orange-800' },
    { value: ClaimStatus.CANCELLED, label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
];

export default function ClaimIndex({ claims, filters = {}, statistics, providers = [] }: ClaimIndexProps) {
    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status?.toString() || 'all');
    const [providerFilter, setProviderFilter] = useState<string>(filters.provider_id?.toString() || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<ClaimWithRelations | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (providerFilter && providerFilter !== 'all') params.provider_id = providerFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        router.get('/insurance/claims', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [searchTerm, statusFilter, providerFilter, dateFrom, dateTo]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('all');
        setProviderFilter('all');
        setDateFrom('');
        setDateTo('');

        router.get('/insurance/claims', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Claim Number',
            'Bill Number',
            'Patient',
            'Provider',
            'Policy Number',
            'Submission Date',
            'Claim Amount',
            'Approved Amount',
            'Status',
        ];

        const rows = claims.data.map((claim) => [
            claim.claim_number,
            claim.bill?.bill_number || 'N/A',
            claim.bill?.patient?.full_name || 'N/A',
            claim.patient_insurance?.insurance_provider?.name || 'N/A',
            claim.patient_insurance?.policy_number || 'N/A',
            claim.submission_date || '',
            claim.claim_amount,
            claim.approved_amount || 0,
            claim.status,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `insurance_claims_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    }, [claims.data]);

    // Check if any filter is active
    const hasActiveFilters =
        searchTerm ||
        (statusFilter && statusFilter !== 'all') ||
        (providerFilter && providerFilter !== 'all') ||
        dateFrom ||
        dateTo;

    // Format date
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return 'Invalid Date';
        }
    };

    // Get status badge
    const getStatusBadge = (status: ClaimStatus) => {
        const statusConfig = CLAIM_STATUSES.find((s) => s.value === status);
        return (
            <Badge className={statusConfig?.color || 'bg-gray-100'}>
                {statusConfig?.label || status}
            </Badge>
        );
    };

    // View claim details
    const viewClaimDetails = (claim: ClaimWithRelations) => {
        setSelectedClaim(claim);
        setShowDetailsDialog(true);
    };

    // Calculate claim progress
    const getClaimProgress = (claim: ClaimWithRelations) => {
        if (claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.PARTIAL) {
            const approved = claim.approved_amount || 0;
            const claimed = claim.claim_amount || 1;
            return Math.round((approved / claimed) * 100);
        }
        return 0;
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Insurance Claims" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Insurance Claims" />
                        <p className="text-muted-foreground mt-1">
                            Manage and track insurance claims across all patients
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/billing">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Back to Bills
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.total_claims}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.pending_claims}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.approved_claims}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.rejected_claims}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Financial Summary */}
                {statistics && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Financial Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Total Claimed</p>
                                    <p className="text-xl font-bold">
                                        <CurrencyDisplay amount={statistics.total_claimed} />
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-600">Total Approved</p>
                                    <p className="text-xl font-bold text-green-700">
                                        <CurrencyDisplay amount={statistics.total_approved} />
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600">Approval Rate</p>
                                    <p className="text-xl font-bold text-blue-700">
                                        {statistics.total_claimed > 0
                                            ? Math.round((statistics.total_approved / statistics.total_claimed) * 100)
                                            : 0}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Filters</CardTitle>
                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Claim #, bill #, patient..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {CLAIM_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="provider">Insurance Provider</Label>
                                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                                        <SelectTrigger id="provider">
                                            <SelectValue placeholder="All Providers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Providers</SelectItem>
                                            {providers.map((provider) => (
                                                <SelectItem key={provider.id} value={provider.id.toString()}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateFrom">Date From</Label>
                                    <Input
                                        id="dateFrom"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateTo">Date To</Label>
                                    <Input
                                        id="dateTo"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Claims Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Claims ({claims.meta.total})</CardTitle>
                        <CardDescription>
                            Showing {claims.meta.from || 0} to {claims.meta.to || 0} of {claims.meta.total} claims
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Claim Number</TableHead>
                                    <TableHead>Patient / Provider</TableHead>
                                    <TableHead>Submission Date</TableHead>
                                    <TableHead className="text-right">Claimed</TableHead>
                                    <TableHead className="text-right">Approved</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No claims found matching your criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    claims.data.map((claim) => (
                                        <TableRow key={claim.id}>
                                            <TableCell className="font-medium">
                                                {claim.claim_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {claim.bill?.patient?.full_name || 'N/A'}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Building className="h-3 w-3" />
                                                        {claim.patient_insurance?.insurance_provider?.name || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(claim.submission_date)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <CurrencyDisplay amount={claim.claim_amount} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {claim.approved_amount !== null && claim.approved_amount !== undefined ? (
                                                    <div className="flex flex-col items-end">
                                                        <CurrencyDisplay amount={claim.approved_amount} />
                                                        {(claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.PARTIAL) && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {getClaimProgress(claim)}% of claim
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(claim.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => viewClaimDetails(claim)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Claim Details Dialog */}
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Claim Details</DialogTitle>
                            <DialogDescription>
                                Claim Number: {selectedClaim?.claim_number}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedClaim && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bill Number</p>
                                        <p className="font-medium">{selectedClaim.bill?.bill_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Patient</p>
                                        <p className="font-medium">{selectedClaim.bill?.patient?.full_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Insurance Provider</p>
                                        <p className="font-medium">
                                            {selectedClaim.patient_insurance?.insurance_provider?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Policy Number</p>
                                        <p className="font-medium">
                                            {selectedClaim.patient_insurance?.policy_number || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Submission Date</p>
                                        <p className="font-medium">{formatDate(selectedClaim.submission_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <div className="mt-1">{getStatusBadge(selectedClaim.status)}</div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3">Financial Details</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-3 bg-muted rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground">Claimed Amount</p>
                                            <p className="font-bold">
                                                <CurrencyDisplay amount={selectedClaim.claim_amount} />
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-center">
                                            <p className="text-sm text-green-600">Approved Amount</p>
                                            <p className="font-bold text-green-700">
                                                <CurrencyDisplay amount={selectedClaim.approved_amount || 0} />
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                                            <p className="text-sm text-blue-600">Deductible</p>
                                            <p className="font-bold text-blue-700">
                                                <CurrencyDisplay amount={selectedClaim.deductible_amount || 0} />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {selectedClaim.submitted_by_user && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Submitted By</p>
                                        <p className="font-medium">{selectedClaim.submitted_by_user.name}</p>
                                    </div>
                                )}

                                {selectedClaim.processed_by_user && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Processed By</p>
                                        <p className="font-medium">{selectedClaim.processed_by_user.name}</p>
                                    </div>
                                )}

                                {selectedClaim.rejection_reason && (
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-red-600 font-medium">Rejection Reason</p>
                                        <p className="text-red-700">{selectedClaim.rejection_reason}</p>
                                    </div>
                                )}

                                {selectedClaim.notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Notes</p>
                                        <p className="font-medium">{selectedClaim.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                Close
                            </Button>
                            {selectedClaim?.bill && (
                                <Link href={`/billing/${selectedClaim.bill.id}`}>
                                    <Button>View Bill</Button>
                                </Link>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
