import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { FileText, Calendar, User, ArrowLeft, Pencil } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
}

interface Bill {
    id: number;
    bill_id: string;
    patient_id: number;
    total_amount: number;
    discount: number;
    tax: number;
    net_amount: number;
    status: string;
    due_date: string;
    created_at: string;
    updated_at: string;
    notes: string;
    patient: Patient;
}

interface BillShowProps {
    bill: Bill;
}

export default function BillShow({ bill }: BillShowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
        }).format(amount);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'overdue':
                return 'destructive';
            case 'cancelled':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <>
            <Head title={`Bill Details - ${bill.bill_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Bill: ${bill.bill_id}`} />
                    
                    <div className="flex space-x-2">
                        <Link href={`/billing/${bill.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Link href="/billing">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Bills
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bill Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Bill Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Bill ID</h3>
                                    <p className="text-lg font-semibold">{bill.bill_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Patient</h3>
                                    <div className="flex items-center pt-1">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{bill.patient.first_name} {bill.patient.last_name}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                    <div className="pt-1">
                                        <Badge variant={getStatusBadgeVariant(bill.status)}>
                                            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                                    <div className="flex items-center pt-1">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{new Date(bill.due_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                                        <div className="flex items-center pt-1">
                                            <span className="mr-2 h-4 w-4 text-muted-foreground">؋</span>
                                            <span className="text-lg font-semibold">{formatCurrency(bill.total_amount)}</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Net Amount</h3>
                                        <div className="flex items-center pt-1">
                                            <span className="mr-2 h-4 w-4 text-muted-foreground">؋</span>
                                            <span className="text-lg font-semibold">{formatCurrency(bill.net_amount)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Discount</h3>
                                        <span className="mr-2 h-4 w-4 text-muted-foreground">؋</span>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Tax</h3>
                                        <span className="mr-2 h-4 w-4 text-muted-foreground">؋</span>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Balance</h3>
                                        <span className="mr-2 h-4 w-4 text-muted-foreground">؋</span>
                                    </div>
                                </div>
                                
                                {bill.notes && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                                        <p className="pt-1">{bill.notes}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bill Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Bill Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                <p className="text-sm">{formatDate(bill.created_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                <p className="text-sm">{formatDate(bill.updated_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Payment Status</h3>
                                <Badge variant={getStatusBadgeVariant(bill.status)}>
                                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                                </Badge>
                            </div>
                            
                            <div className="pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Related Actions</h3>
                                <div className="flex flex-col space-y-2 pt-2">
                                    <Link href={`/patients/${bill.patient_id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Patient
                                        </Button>
                                    </Link>
                                    
                                    <Link href={`/billing?patient_id=${bill.patient_id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Patient Bills
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Information Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none">
                            <p>This bill contains all relevant financial information for services rendered to {bill.patient.first_name} {bill.patient.last_name}. 
                            Please ensure payment is made by the due date to avoid late fees.</p>
                            
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <h4 className="font-medium mb-2">Payment Instructions</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Total amount due: {formatCurrency(bill.net_amount)}</li>
                                    <li>Due date: {new Date(bill.due_date).toLocaleDateString()}</li>
                                    <li>Payment methods accepted: Cash, Credit Card, Bank Transfer</li>
                                    <li>Late payment fee: 5% after due date</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}