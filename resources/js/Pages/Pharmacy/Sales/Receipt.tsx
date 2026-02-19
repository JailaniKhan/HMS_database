import { Head } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Printer,
    Download,
    Share2,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
    Mail,
} from 'lucide-react';
import { useRef } from 'react';
import type { Sale, SalesItem } from '@/types/pharmacy';

interface SaleWithDetails extends Sale {
    patient: {
        id: number;
        patient_id: string;
        first_name: string;
        last_name: string;
        phone?: string;
        email?: string;
    } | null;
    user: {
        id: number;
        name: string;
    };
    items: SalesItem[];
}

interface ReceiptProps {
    sale: SaleWithDetails;
    pharmacy?: {
        name: string;
        address: string;
        phone: string;
        email?: string;
        website?: string;
        license?: string;
    };
}

export default function Receipt({ sale, pharmacy }: ReceiptProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // PDF generation is not currently implemented.
        // In a production environment, this would use a library like jsPDF, pdfmake, or
        // a server-side PDF generation service to create and download a PDF receipt.
        // For now, this opens the print view which can be printed to PDF via the browser.
        window.open(`/pharmacy/sales/${sale.id}/print`, '_blank');
    };

    // Default pharmacy info if not provided
    const pharmacyInfo = pharmacy || {
        name: 'Hospital Pharmacy',
        address: '123 Medical Center Drive, Healthcare City, HC 12345',
        phone: '+1 (555) 123-4567',
        email: 'pharmacy@hospital.com',
        website: 'www.hospital.com',
        license: 'PHARM-12345',
    };

    return (
        <PharmacyLayout>
            <Head title={`Receipt - ${sale.sale_id}`} />
            
            {/* Print-only styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    body {
                        background: white;
                    }
                    .receipt-container {
                        box-shadow: none;
                        max-width: 80mm;
                        margin: 0 auto;
                    }
                }
                @media screen {
                    .print-only {
                        display: none;
                    }
                }
            `}</style>

            {/* Action Bar - Hidden when printing */}
            <div className="no-print bg-background border-b p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Receipt Generated</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button variant="outline">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </div>
            </div>

            {/* Receipt Content */}
            <div className="min-h-screen bg-muted/30 py-8 px-4">
                <div 
                    ref={printRef}
                    className="receipt-container max-w-md mx-auto bg-white shadow-lg"
                >
                    {/* Thermal Printer Optimized Receipt */}
                    <Card className="border-0 shadow-none print:shadow-none">
                        <CardContent className="p-6 space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <h1 className="text-xl font-bold uppercase tracking-wide">
                                    {pharmacyInfo.name}
                                </h1>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p className="flex items-center justify-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {pharmacyInfo.address}
                                    </p>
                                    <p className="flex items-center justify-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {pharmacyInfo.phone}
                                    </p>
                                    {pharmacyInfo.email && (
                                        <p className="flex items-center justify-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {pharmacyInfo.email}
                                        </p>
                                    )}
                                    {pharmacyInfo.license && (
                                        <p className="text-xs">License: {pharmacyInfo.license}</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Receipt Info */}
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Receipt #:</span>
                                    <span className="font-mono font-medium">{sale.sale_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span>{formatDate(sale.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cashier:</span>
                                    <span>{sale.user?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment:</span>
                                    <span className="capitalize">{sale.payment_method}</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Customer Info */}
                            {sale.patient && (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                                            Customer
                                        </p>
                                        <p className="font-medium">
                                            {sale.patient.first_name} {sale.patient.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            ID: {sale.patient.patient_id}
                                        </p>
                                        {sale.patient.phone && (
                                            <p className="text-xs text-muted-foreground">
                                                {sale.patient.phone}
                                            </p>
                                        )}
                                    </div>
                                    <Separator />
                                </>
                            )}

                            {/* Items */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                    Items
                                </p>
                                <div className="space-y-2">
                                    {sale.items?.map((item) => (
                                        <div key={item.id} className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{item.medicine?.name}</span>
                                                <span>{formatCurrency(item.total_price)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>
                                                    {item.quantity} x {formatCurrency(item.unit_price)}
                                                </span>
                                                {item.discount > 0 && (
                                                    <span className="text-emerald-600">
                                                        -{item.discount}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Totals */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(sale.total_amount)}</span>
                                </div>
                                {sale.discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="text-emerald-600">-{formatCurrency(sale.discount)}</span>
                                    </div>
                                )}
                                {sale.tax > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(sale.tax)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>TOTAL</span>
                                    <span>{formatCurrency(sale.grand_total || sale.total_amount)}</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Barcode */}
                            <div className="text-center space-y-2">
                                <div className="bg-black text-white p-2 font-mono text-center tracking-widest">
                                    {sale.sale_id}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Scan for verification
                                </p>
                            </div>

                            <Separator />

                            {/* Footer */}
                            <div className="text-center space-y-2 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    Thank you for your business!
                                </p>
                                <p>
                                    This receipt is valid for returns within 7 days with original packaging.
                                </p>
                                <p>
                                    For any questions, please contact us at {pharmacyInfo.phone}
                                </p>
                                <div className="pt-2 flex items-center justify-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Printed: {formatDate(new Date().toISOString())}</span>
                                </div>
                            </div>

                            {/* QR Code Placeholder */}
                            {/* Note: This is a placeholder QR code visual. In a production implementation,
                               this would encode actual sale data (e.g., sale ID, timestamp, total)
                               using a QR code library like qrcode.react to enable digital verification. */}
                            <div className="flex justify-center pt-4">
                                <div className="w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="grid grid-cols-5 gap-0.5 w-16 h-16 mx-auto">
                                            {Array.from({ length: 25 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-full h-full ${i % 3 === 0 || i % 7 === 0 ? 'bg-black' : 'bg-white'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[8px] mt-1 text-muted-foreground">Scan for digital receipt</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PharmacyLayout>
    );
}
