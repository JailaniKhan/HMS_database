import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet as WalletIcon, TrendingUp, Calendar, DollarSign, Activity, RefreshCw } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';

interface Wallet {
    id: number;
    name: string;
    balance: number;
    created_at: string;
    updated_at: string;
}

interface Transaction {
    id: number;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    transaction_date: string;
    created_by: {
        name: string;
    } | null;
}

interface RevenueData {
    today: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
    this_week: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
    this_month: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
    this_year: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
}

interface Props {
    wallet: Wallet;
    displayBalance?: number;
    revenueData: RevenueData;
    transactions: Transaction[];
}

export default function Index({ wallet: initialWallet, displayBalance: initialDisplayBalance, revenueData: initialRevenueData, transactions: initialTransactions }: Props) {
    const [wallet, setWallet] = useState(initialWallet);
    const [revenueData, setRevenueData] = useState(initialRevenueData);
    const [transactions, setTransactions] = useState(initialTransactions);
    const [displayBalance, setDisplayBalance] = useState<number | undefined>(initialDisplayBalance);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'today': return 'Today';
            case 'this_week': return 'This Week';
            case 'this_month': return 'This Month';
            case 'this_year': return 'This Year';
            default: return period;
        }
    };

    // Fetch real-time data
    const fetchRealtimeData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/v1/wallet/realtime', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setWallet(data.wallet);
                setDisplayBalance(data.displayBalance);
                setRevenueData(data.revenueData);
                setTransactions(data.transactions);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch real-time data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchRealtimeData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Manual refresh
    const handleRefresh = () => {
        fetchRealtimeData();
    };

    return (
        <HospitalLayout>
            <Head title="Wallet & Revenue Tracking" />

            <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Wallet & Revenue Tracking"
                        description="Monitor hospital revenue and wallet balance across all departments"
                    />
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                        <Button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Wallet Balance Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900">Current Wallet Balance</CardTitle>
                        <div className="bg-blue-100 p-2 rounded-full">
                            <WalletIcon className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                                <div className="text-3xl font-bold text-blue-900">{formatCurrency(displayBalance ?? wallet.balance)}</div>
                                <p className="text-xs text-blue-600 mt-1">
                                    Last updated: {formatDate(wallet.updated_at)}
                                </p>
                    </CardContent>
                </Card>

                {/* Revenue Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(revenueData).map(([period, data]) => (
                        <Card key={period} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {getPeriodLabel(period)} Revenue
                                </CardTitle>
                                <div className="bg-green-100 p-1.5 rounded-full">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-900 mb-3">{formatCurrency(data.total)}</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-1">
                                            <Calendar className="h-3 w-3 text-blue-500" />
                                            <span>Appointments</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(data.appointments)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-1">
                                            <Activity className="h-3 w-3 text-green-500" />
                                            <span>Departments</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(data.departments)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-1">
                                            <DollarSign className="h-3 w-3 text-purple-500" />
                                            <span>Pharmacy</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(data.pharmacy)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-1">
                                            <Activity className="h-3 w-3 text-orange-500" />
                                            <span>Laboratory</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(data.laboratory)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Detailed Revenue Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            <span>Revenue Breakdown by Source</span>
                        </CardTitle>
                        <CardDescription>
                            Detailed revenue analysis across different time periods
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            {Object.entries(revenueData).map(([period, data]) => (
                                <div key={period} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-900">{getPeriodLabel(period)}</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-blue-100 p-2 rounded-full">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium">Appointments</span>
                                            </div>
                                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                                {formatCurrency(data.appointments)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-green-100 p-2 rounded-full">
                                                    <Activity className="h-4 w-4 text-green-600" />
                                                </div>
                                                <span className="font-medium">Department Services</span>
                                            </div>
                                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                                {formatCurrency(data.departments)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-purple-100 p-2 rounded-full">
                                                    <DollarSign className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <span className="font-medium">Pharmacy Sales</span>
                                            </div>
                                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                                {formatCurrency(data.pharmacy)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-orange-100 p-2 rounded-full">
                                                    <Activity className="h-4 w-4 text-orange-600" />
                                                </div>
                                                <span className="font-medium">Laboratory Tests</span>
                                            </div>
                                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                                {formatCurrency(data.laboratory)}
                                            </Badge>
                                        </div>
                                        <div className="border-t pt-3 mt-4">
                                            <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
                                                <span className="font-bold text-lg">Total</span>
                                                <Badge className="text-lg px-4 py-2 bg-blue-600">
                                                    {formatCurrency(data.total)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-green-600" />
                            <span>Transaction History</span>
                        </CardTitle>
                        <CardDescription>
                            Recent wallet transactions and balance changes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold">Date</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold">Description</TableHead>
                                        <TableHead className="font-semibold text-right">Amount</TableHead>
                                        <TableHead className="font-semibold">Created By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{formatDate(transaction.transaction_date)}</TableCell>
                                            <TableCell>
                                                <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'} className="font-medium">
                                                    {transaction.type.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={transaction.description}>
                                                {transaction.description}
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </TableCell>
                                            <TableCell>{transaction.created_by?.name || 'System'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {transactions.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No transactions found</p>
                                <p className="text-sm">Transaction history will appear here as revenue is recorded.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}