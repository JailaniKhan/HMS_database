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
import { Switch } from '@/components/ui/switch';
import Heading from '@/components/heading';
import {
    Building,
    Search,
    Eye,
    Download,
    Filter,
    X,
    Plus,
    Edit,
    Phone,
    Mail,
    Globe,
    Shield,
    Users,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { type InsuranceProvider } from '@/types/billing';
import { format } from 'date-fns';

interface ProviderWithStats extends InsuranceProvider {
    patient_insurances_count?: number;
    total_claims?: number;
    approved_claims?: number;
    total_claimed_amount?: number;
    total_approved_amount?: number;
}

interface ProviderFilters {
    search?: string;
    active?: boolean | null;
    coverage_type?: string;
}

interface ProviderIndexProps {
    providers: {
        data: ProviderWithStats[];
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
    filters?: ProviderFilters;
    statistics?: {
        total_providers: number;
        active_providers: number;
        inactive_providers: number;
        total_patients_covered: number;
    };
}

const COVERAGE_TYPES = [
    { value: 'inpatient', label: 'Inpatient' },
    { value: 'outpatient', label: 'Outpatient' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'dental', label: 'Dental' },
    { value: 'vision', label: 'Vision' },
];

export default function ProviderIndex({ providers, filters = {}, statistics }: ProviderIndexProps) {
    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [activeFilter, setActiveFilter] = useState<string>(
        filters.active === true ? 'active' : filters.active === false ? 'inactive' : 'all'
    );
    const [coverageTypeFilter, setCoverageTypeFilter] = useState<string>(filters.coverage_type || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ProviderWithStats | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        if (searchTerm) params.search = searchTerm;
        if (activeFilter !== 'all') params.active = activeFilter === 'active' ? '1' : '0';
        if (coverageTypeFilter && coverageTypeFilter !== 'all') params.coverage_type = coverageTypeFilter;

        router.get('/insurance/providers', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [searchTerm, activeFilter, coverageTypeFilter]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setActiveFilter('all');
        setCoverageTypeFilter('all');

        router.get('/insurance/providers', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Name',
            'Code',
            'Phone',
            'Email',
            'Status',
            'Coverage Types',
            'Max Coverage',
            'Patients Covered',
        ];

        const rows = providers.data.map((provider) => [
            provider.name,
            provider.code,
            provider.phone || '',
            provider.email || '',
            provider.is_active ? 'Active' : 'Inactive',
            provider.coverage_types?.join(', ') || '',
            provider.max_coverage_amount || '',
            provider.patient_insurances_count || 0,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `insurance_providers_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    }, [providers.data]);

    // Check if any filter is active
    const hasActiveFilters =
        searchTerm ||
        activeFilter !== 'all' ||
        (coverageTypeFilter && coverageTypeFilter !== 'all');

    // View provider details
    const viewProviderDetails = (provider: ProviderWithStats) => {
        setSelectedProvider(provider);
        setShowDetailsDialog(true);
    };

    // Get coverage type badges
    const getCoverageTypeBadges = (types: string[] | undefined) => {
        if (!types || types.length === 0) return <span className="text-muted-foreground text-sm">-</span>;
        
        return (
            <div className="flex flex-wrap gap-1">
                {types.slice(0, 3).map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs capitalize">
                        {type.replace('_', ' ')}
                    </Badge>
                ))}
                {types.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                        +{types.length - 3}
                    </Badge>
                )}
            </div>
        );
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Insurance Providers" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Insurance Providers" />
                        <p className="text-muted-foreground mt-1">
                            Manage insurance companies and their coverage policies
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Provider
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Providers</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.total_providers}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Building className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.active_providers}</p>
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
                                        <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.inactive_providers}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <XCircle className="h-5 w-5 text-gray-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Patients Covered</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.total_patients_covered}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Provider name, code..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverage">Coverage Type</Label>
                                    <Select value={coverageTypeFilter} onValueChange={setCoverageTypeFilter}>
                                        <SelectTrigger id="coverage">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {COVERAGE_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Providers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Insurance Providers ({providers.meta.total})</CardTitle>
                        <CardDescription>
                            Showing {providers.meta.from || 0} to {providers.meta.to || 0} of {providers.meta.total} providers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Coverage Types</TableHead>
                                    <TableHead className="text-right">Max Coverage</TableHead>
                                    <TableHead className="text-center">Patients</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {providers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No providers found matching your criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    providers.data.map((provider) => (
                                        <TableRow key={provider.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{provider.name}</span>
                                                    <span className="text-sm text-muted-foreground">{provider.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {provider.phone && (
                                                        <span className="text-sm flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {provider.phone}
                                                        </span>
                                                    )}
                                                    {provider.email && (
                                                        <span className="text-sm flex items-center gap-1 text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            {provider.email}
                                                        </span>
                                                    )}
                                                    {provider.website && (
                                                        <span className="text-sm flex items-center gap-1 text-muted-foreground">
                                                            <Globe className="h-3 w-3" />
                                                            <a 
                                                                href={provider.website} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="hover:underline"
                                                            >
                                                                Website
                                                            </a>
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getCoverageTypeBadges(provider.coverage_types)}</TableCell>
                                            <TableCell className="text-right">
                                                {provider.max_coverage_amount ? (
                                                    <CurrencyDisplay amount={provider.max_coverage_amount} />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-medium">
                                                        {provider.patient_insurances_count || 0}
                                                    </span>
                                                    {provider.total_claims !== undefined && provider.total_claims > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {provider.total_claims} claims
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={provider.is_active ? 'default' : 'secondary'}
                                                    className={provider.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                                >
                                                    {provider.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => viewProviderDetails(provider)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Link href={`/insurance/providers/${provider.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Provider Details Dialog */}
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Provider Details</DialogTitle>
                            <DialogDescription>
                                {selectedProvider?.name} ({selectedProvider?.code})
                            </DialogDescription>
                        </DialogHeader>
                        {selectedProvider && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Provider Name</p>
                                        <p className="font-medium">{selectedProvider.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Code</p>
                                        <p className="font-medium">{selectedProvider.code}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedProvider.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{selectedProvider.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Website</p>
                                        <p className="font-medium">
                                            {selectedProvider.website ? (
                                                <a 
                                                    href={selectedProvider.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {selectedProvider.website}
                                                </a>
                                            ) : (
                                                'N/A'
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge 
                                            variant={selectedProvider.is_active ? 'default' : 'secondary'}
                                            className={selectedProvider.is_active ? 'bg-green-100 text-green-800' : ''}
                                        >
                                            {selectedProvider.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                {selectedProvider.description && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Description</p>
                                        <p className="font-medium">{selectedProvider.description}</p>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Coverage Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Coverage Types</p>
                                            <div className="mt-1">
                                                {getCoverageTypeBadges(selectedProvider.coverage_types)}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Maximum Coverage</p>
                                            <p className="font-medium">
                                                {selectedProvider.max_coverage_amount ? (
                                                    <CurrencyDisplay 
                                                        amount={selectedProvider.max_coverage_amount} 
                                                        weight="bold"
                                                    />
                                                ) : (
                                                    'Unlimited'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {(selectedProvider.patient_insurances_count !== undefined || 
                                  selectedProvider.total_claims !== undefined) && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Statistics
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-3 bg-muted rounded-lg text-center">
                                                <p className="text-sm text-muted-foreground">Patients Covered</p>
                                                <p className="font-bold text-lg">
                                                    {selectedProvider.patient_insurances_count || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg text-center">
                                                <p className="text-sm text-muted-foreground">Total Claims</p>
                                                <p className="font-bold text-lg">
                                                    {selectedProvider.total_claims || 0}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                                <p className="text-sm text-green-600">Approved Claims</p>
                                                <p className="font-bold text-lg text-green-700">
                                                    {selectedProvider.approved_claims || 0}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {(selectedProvider.total_claimed_amount !== undefined || 
                                          selectedProvider.total_approved_amount !== undefined) && (
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="p-3 bg-muted rounded-lg text-center">
                                                    <p className="text-sm text-muted-foreground">Total Claimed</p>
                                                    <p className="font-bold">
                                                        <CurrencyDisplay 
                                                            amount={selectedProvider.total_claimed_amount || 0} 
                                                        />
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                                    <p className="text-sm text-green-600">Total Approved</p>
                                                    <p className="font-bold text-green-700">
                                                        <CurrencyDisplay 
                                                            amount={selectedProvider.total_approved_amount || 0} 
                                                        />
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedProvider.has_api_integration && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600 font-medium flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            API Integration Enabled
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                Close
                            </Button>
                            {selectedProvider && (
                                <Link href={`/insurance/providers/${selectedProvider.id}/edit`}>
                                    <Button>Edit Provider</Button>
                                </Link>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Provider Dialog */}
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add Insurance Provider</DialogTitle>
                            <DialogDescription>
                                Create a new insurance provider record
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Provider Name *</Label>
                                <Input id="name" placeholder="e.g., Blue Cross Blue Shield" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Provider Code *</Label>
                                <Input id="code" placeholder="e.g., BCBS" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" placeholder="Contact number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="contact@provider.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input id="website" placeholder="https://www.provider.com" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="active" defaultChecked />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => {
                                // TODO: Implement add provider
                                setShowAddDialog(false);
                            }}>
                                Create Provider
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
