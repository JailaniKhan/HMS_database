import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { useRef } from 'react';

interface AppointmentPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: {
        appointment_id: string;
        patient?: {
            first_name: string;
            father_name?: string;
            gender?: string;
            age?: number;
        };
        doctor?: {
            id?: number;
            full_name: string;
        };
        department?: {
            name: string;
        };
        appointment_date: string;
        fee: number;
        discount: number;
        grand_total?: number;
        created_at?: string;
    } | null;
}

export function AppointmentPrintModal({ isOpen, onClose, appointment }: AppointmentPrintModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current || !appointment) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printStyles = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;l
                    padding: 15px;
                    background: white;
                    color: #333;
                }
                .print-container {
                    max-width: 350px;
                    margin: 0 auto;
                    border: 2px solid #000;
                    padding: 15px;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                .logo { width: 60px; height: auto; margin-bottom: 5px; }
                .hospital-name { font-size: 16px; font-weight: bold; margin: 3px 0; }
                .receipt-title { font-size: 12px; color: #666; }
                .token-section {
                    background: #f0f0f0;
                    padding: 12px;
                    text-align: center;
                    margin: 15px 0;
                    border: 1px solid #ccc;
                }
                .token-label { font-size: 10px; color: #666; margin-bottom: 3px; }
                .token-number { font-size: 28px; font-weight: bold; color: #000; letter-spacing: 2px; }
                .info-section { margin: 12px 0; }
                .section-title {
                    font-size: 11px;
                    font-weight: bold;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 3px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    color: #333;
                }
                .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
                .info-label { font-weight: 600; color: #555; font-size: 11px; }
                .info-value { text-align: right; font-weight: 500; font-size: 11px; }
                .financial-section { margin-top: 15px; padding-top: 12px; border-top: 2px solid #000; }
                .financial-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 8px;
                    background: #f9f9f9;
                    border: 1px solid #ccc;
                    margin-top: 8px;
                    font-weight: bold;
                    font-size: 13px;
                }
                .discount-row { color: #16a34a; }
                .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
                .footer p { margin: 2px 0; }
                @media print {
                    body { padding: 0; }
                    .print-container { border: none; }
                    @page { margin: 10mm; size: 80mm auto; }
                }
            </style>
        `;

        const patientName = appointment.patient?.first_name || 'N/A';
        const fatherName = appointment.patient?.father_name || 'N/A';
        const gender = appointment.patient?.gender || 'N/A';
        const age = appointment.patient?.age ? `${appointment.patient.age} years` : 'N/A';
        const doctorName = appointment.doctor?.full_name || 'N/A';
        const deptName = appointment.department?.name || 'N/A';
        const appointmentId = appointment.appointment_id || 'N/A';
        const createdDate = appointment.created_at || new Date().toISOString();
        
        const consultationFee = parseFloat(appointment.fee?.toString() || '0');
        const discount = parseFloat(appointment.discount?.toString() || '0');
        const grandTotal = appointment.grand_total || Math.max(0, consultationFee - discount);
        
        const formatDate = (dateString: string) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        
        const formatCurrency = (amount: number) => `؋${(amount || 0).toFixed(2)}`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Appointment Receipt - ${appointmentId}</title>
                ${printStyles}
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <img src="/logo.svg" alt="Hospital Logo" class="logo" />
                        <div class="hospital-name">Hospital Management System</div>
                        <div class="receipt-title">Appointment Receipt</div>
                    </div>
                    <div class="token-section">
                        <div class="token-label">TOKEN NUMBER</div>
                        <div class="token-number">${appointmentId}</div>
                    </div>
                    <div class="info-section">
                        <div class="section-title">Patient Information</div>
                        <div class="info-row">
                            <span class="info-label">Patient Name:</span>
                            <span class="info-value">${patientName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Father Name:</span>
                            <span class="info-value">${fatherName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Gender:</span>
                            <span class="info-value">${gender}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Age:</span>
                            <span class="info-value">${age}</span>
                        </div>
                    </div>
                    <div class="info-section">
                        <div class="section-title">Appointment Details</div>
                        <div class="info-row">
                            <span class="info-label">Doctor:</span>
                            <span class="info-value">Dr. ${doctorName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Department:</span>
                            <span class="info-value">${deptName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Created Date:</span>
                            <span class="info-value">${formatDate(createdDate)}</span>
                        </div>
                    </div>
                    <div class="financial-section">
                        <div class="section-title">Financial Summary</div>
                        <div class="financial-row">
                            <span>Consultation Fee:</span>
                            <span>${formatCurrency(consultationFee)}</span>
                        </div>
                        <div class="financial-row discount-row">
                            <span>Total Discount:</span>
                            <span>-${formatCurrency(discount)}</span>
                        </div>
                        <div class="total-row">
                            <span>Amount Paid:</span>
                            <span>${formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing our hospital</p>
                        <p>Please arrive 15 minutes before your appointment</p>
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    if (!appointment) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => `؋${(amount || 0).toFixed(2)}`;

    const consultationFee = parseFloat(appointment.fee?.toString() || '0');
    const discount = parseFloat(appointment.discount?.toString() || '0');
    const grandTotal = appointment.grand_total || Math.max(0, consultationFee - discount);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Appointment Receipt Preview
                    </DialogTitle>
                </DialogHeader>

                <div ref={printRef} className="bg-white p-4 border rounded-lg">
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                        <img 
                            src="/Logo.png" 
                            alt="Hospital Logo" 
                            className="mx-auto w-16 h-16 object-contain mb-2"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <h2 className="text-xl font-bold">Hospital Management System</h2>
                        <p className="text-sm text-gray-600">Appointment Receipt</p>
                    </div>

                    <div className="bg-gray-100 p-4 text-center rounded-lg mb-4">
                        <p className="text-sm text-gray-600 mb-1">Token Number</p>
                        <p className="text-2xl font-bold text-gray-800">{appointment.appointment_id}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                        <h3 className="font-semibold text-gray-800 border-b pb-1">Patient Information</h3>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Patient Name:</span>
                            <span className="font-medium">{appointment.patient?.first_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Father Name:</span>
                            <span className="font-medium">{appointment.patient?.father_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Gender:</span>
                            <span className="font-medium capitalize">{appointment.patient?.gender || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Age:</span>
                            <span className="font-medium">{appointment.patient?.age ? `${appointment.patient.age} years` : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <h3 className="font-semibold text-gray-800 border-b pb-1">Appointment Details</h3>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Doctor:</span>
                            <span className="font-medium">Dr. {appointment.doctor?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Department:</span>
                            <span className="font-medium">{appointment.department?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Created Date:</span>
                            <span className="font-medium">{formatDate(appointment.created_at || new Date().toISOString())}</span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t-2 border-gray-800 pt-4">
                        <h3 className="font-semibold text-gray-800">Financial Summary</h3>
                        <div className="flex justify-between py-1">
                            <span className="text-gray-600">Consultation Fee:</span>
                            <span className="font-medium">{formatCurrency(consultationFee)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-green-600">
                            <span>Total Discount:</span>
                            <span className="font-medium">-{formatCurrency(discount)}</span>
                        </div>
                        <div className="flex justify-between py-2 bg-gray-100 px-2 rounded mt-2">
                            <span className="font-bold text-lg">Amount Paid:</span>
                            <span className="font-bold text-lg text-gray-800">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>

                    <div className="text-center mt-6 pt-4 border-t text-sm text-gray-500">
                        <p>Thank you for choosing our hospital</p>
                        <p className="mt-1">Please arrive 15 minutes before your appointment</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-4 no-print">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        Okay
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
