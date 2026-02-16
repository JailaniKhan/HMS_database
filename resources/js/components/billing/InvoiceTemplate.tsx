// /**
//  * InvoiceTemplate Component
//  * 
//  * PDF template for invoice generation.
//  * Provides standardized invoice layout with hospital branding,
//  * bill details, itemized items, payment summary, and footer.
//  * Compatible with DOMPDF for PDF generation.
//  */

// import * as React from 'react';
// import { cn } from '@/lib/utils';
// import type { Bill, BillItem, Payment } from '@/types/billing';
// import { PaymentStatus, ClaimStatus } from '@/types/billing';
// import { CurrencyDisplay } from './CurrencyDisplay';
// import { BillStatusBadge } from './BillStatusBadge';

// // ============================================================================
// // Interfaces
// // ============================================================================

// /**
//  * Hospital branding information for the invoice header
//  */
// export interface HospitalBranding {
//   name: string;
//   logo?: string;
//   address?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   taxId?: string;
// }

// /**
//  * InvoiceTemplate component props
//  */
// export interface InvoiceTemplateProps {
//   /** The bill object to render */
//   bill: Bill;
//   /** Hospital branding information */
//   hospital?: HospitalBranding;
//   /** Whether to show the print header/footer (for screen display) */
//   showPrintHeaderFooter?: boolean;
//   /** Custom CSS classes */
//   className?: string;
//   /** Invoice number override (defaults to bill.invoice_number or bill_number) */
//   invoiceNumber?: string;
//   /** Invoice date override (defaults to bill.bill_date) */
//   invoiceDate?: string;
//   /** Due date override */
//   dueDate?: string;
// }

// /**
//  * Invoice item row props
//  */
// interface InvoiceItemRowProps {
//   item: BillItem;
//   currency: string;
//   index: number;
// }

// /**
//  * Payment info row props
//  */
// interface PaymentInfoRowProps {
//   payment: Payment;
//   currency: string;
// }

// // ============================================================================
// // Helper Functions
// // ============================================================================

// /**
//  * Format date for display
//  */
// function formatDate(dateString: string | undefined): string {
//   if (!dateString) return '-';
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });
// }

// /**
//  * Get item type label
//  */
// function getItemTypeLabel(type: string): string {
//   const labels: Record<string, string> = {
//     service: 'Service',
//     consultation: 'Consultation',
//     procedure: 'Procedure',
//     medication: 'Medication',
//     lab_test: 'Lab Test',
//     room_charge: 'Room Charge',
//     equipment: 'Equipment',
//     supply: 'Supply',
//     other: 'Other',
//   };
//   return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
// }

// /**
//  * Calculate subtotal from items
//  */
// function calculateSubtotal(items: BillItem[]): number {
//   return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
// }

// /**
//  * Calculate total discount from items
//  */
// function calculateTotalDiscount(items: BillItem[]): number {
//   return items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
// }

// // ============================================================================
// // Sub-Components
// // ============================================================================

// /**
//  * Invoice Item Row Component
//  */
// function InvoiceItemRow({ item, currency, index }: InvoiceItemRowProps) {
//   const quantity = item.quantity || 1;
//   const unitPrice = item.unit_price || 0;
//   const discountAmount = item.discount_amount || 0;
//   const totalPrice = item.total_price || (quantity * unitPrice - discountAmount);

//   return (
//     <tr className={cn(index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
//       <td className="px-4 py-3 text-sm text-left">{index + 1}</td>
//       <td className="px-4 py-3 text-sm text-left">
//         <div>
//           <span className="font-medium">{item.item_description}</span>
//           {item.category && (
//             <span className="block text-xs text-muted-foreground">{item.category}</span>
//           )}
//         </div>
//       </td>
//       <td className="px-4 py-3 text-sm text-center">
//         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
//           {getItemTypeLabel(item.item_type)}
//         </span>
//       </td>
//       <td className="px-4 py-3 text-sm text-center">{quantity}</td>
//       <td className="px-4 py-3 text-sm text-right">
//         <CurrencyDisplay amount={unitPrice} currency={currency} showSymbol={false} />
//       </td>
//       <td className="px-4 py-3 text-sm text-right">
//         <CurrencyDisplay amount={discountAmount} currency={currency} showSymbol={false} />
//       </td>
//       <td className="px-4 py-3 text-sm text-right font-medium">
//         <CurrencyDisplay amount={totalPrice} currency={currency} showSymbol={false} />
//       </td>
//     </tr>
//   );
// }

// /**
//  * Payment Info Row Component
//  */
// function PaymentInfoRow({ payment, currency }: PaymentInfoRowProps) {
//   return (
//     <div className="flex justify-between items-center py-2 border-b last:border-b-0">
//       <div className="flex items-center gap-3">
//         <div className="flex flex-col">
//           <span className="text-sm font-medium">
//             {payment.payment_method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
//           </span>
//           <span className="text-xs text-muted-foreground">
//             {formatDate(payment.payment_date)}
//             {payment.reference_number && ` • Ref: ${payment.reference_number}`}
//           </span>
//         </div>
//       </div>
//       <div className="text-right">
//         <CurrencyDisplay
//           amount={payment.amount}
//           currency={currency}
//           color="success"
//           weight="medium"
//         />
//         {payment.status && payment.status !== PaymentStatus.PAID && (
//           <span className="ml-2">
//             <BillStatusBadge status={payment.status} size="sm" />
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ============================================================================
// // Main Component
// // ============================================================================

// /**
//  * InvoiceTemplate Component
//  * 
//  * A standardized invoice template for PDF generation.
//  * Includes hospital branding, bill details, itemized items,
//  * payment summary, and footer with terms/conditions.
//  */
// export function InvoiceTemplate({
//   bill,
//   hospital = {
//     name: 'Hospital Management System',
//     address: '123 Medical Center Drive',
//     phone: '+1 (555) 123-4567',
//     email: 'billing@hospital.com',
//   },
//   showPrintHeaderFooter = true,
//   className,
//   invoiceNumber,
//   invoiceDate,
//   dueDate,
// }: InvoiceTemplateProps) {
//   // Extract data from bill
//   const patient = bill.patient;
//   const doctor = bill.doctor;
//   const items = bill.items || [];
//   const payments = bill.payments || [];
//   const insuranceClaims = bill.insurance_claims || [];
//   const primaryInsurance = bill.primary_insurance;

//   // Calculate totals
//   const subtotal = React.useMemo(() => calculateSubtotal(items), [items]);
//   const totalDiscount = React.useMemo(() => calculateTotalDiscount(items), [items]);
//   const taxableAmount = subtotal - totalDiscount;
//   const taxAmount = bill.total_tax || 0;
//   const totalAmount = bill.total_amount || taxableAmount + taxAmount;
//   const amountPaid = payments
//     .filter((p) => p.status === PaymentStatus.PAID)
//     .reduce((sum, p) => sum + p.amount, 0);
//   const balanceDue = bill.balance_due || Math.max(0, totalAmount - amountPaid);

//   // Get active insurance claim
//   const activeInsuranceClaim = insuranceClaims.find(
//     (c) =>
//       c.status === ClaimStatus.APPROVED ||
//       c.status === ClaimStatus.PENDING ||
//       c.status === ClaimStatus.SUBMITTED
//   );

//   // Effective invoice number and dates
//   const effectiveInvoiceNumber = invoiceNumber || bill.invoice_number || bill.bill_number;
//   const effectiveInvoiceDate = invoiceDate || bill.bill_date;
//   const effectiveDueDate = dueDate || bill.due_date;

//   return (
//     <div
//       className={cn(
//         'invoice-template bg-white max-w-4xl mx-auto',
//         showPrintHeaderFooter && 'print:p-8',
//         className
//       )}
//     >
//       {/* Print Header */}
//       {showPrintHeaderFooter && (
//         <div className="hidden print:block mb-6 border-b pb-4">
//           <h1 className="text-2xl font-bold text-center">INVOICE</h1>
//         </div>
//       )}

//       {/* Hospital Branding Header */}
//       <div className="flex justify-between items-start mb-8">
//         <div className="flex items-start gap-4">
//           {hospital.logo && (
//             <img
//               src={hospital.logo}
//               alt={`${hospital.name} Logo`}
//               className="w-16 h-16 object-contain"
//             />
//           )}
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
//             {hospital.address && (
//               <p className="text-sm text-muted-foreground mt-1">{hospital.address}</p>
//             )}
//             <div className="flex flex-col mt-1">
//               {hospital.phone && (
//                 <span className="text-sm text-muted-foreground">Phone: {hospital.phone}</span>
//               )}
//               {hospital.email && (
//                 <span className="text-sm text-muted-foreground">Email: {hospital.email}</span>
//               )}
//               {hospital.website && (
//                 <span className="text-sm text-muted-foreground">Web: {hospital.website}</span>
//               )}
//             </div>
//             {hospital.taxId && (
//               <p className="text-sm text-muted-foreground mt-1">Tax ID: {hospital.taxId}</p>
//             )}
//           </div>
//         </div>
//         <div className="text-right">
//           <h2 className="text-xl font-semibold text-gray-800">INVOICE</h2>
//           <div className="mt-2 space-y-1">
//             <p className="text-sm">
//               <span className="text-muted-foreground">Invoice #:</span>{' '}
//               <span className="font-medium">{effectiveInvoiceNumber}</span>
//             </p>
//             <p className="text-sm">
//               <span className="text-muted-foreground">Date:</span>{' '}
//               <span className="font-medium">{formatDate(effectiveInvoiceDate)}</span>
//             </p>
//             {effectiveDueDate && (
//               <p className="text-sm">
//                 <span className="text-muted-foreground">Due Date:</span>{' '}
//                 <span className="font-medium">{formatDate(effectiveDueDate)}</span>
//               </p>
//             )}
//           </div>
//           <div className="mt-3">
//             <BillStatusBadge
//               status={bill.payment_status}
//               size="lg"
//               showDot
//             />
//           </div>
//         </div>
//       </div>

//       {/* Patient & Billing Information */}
//       <div className="grid grid-cols-2 gap-8 mb-8">
//         {/* Bill To / Patient Information */}
//         <div>
//           <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
//             Bill To
//           </h3>
//           <div className="bg-gray-50 rounded-lg p-4">
//             <div className="space-y-2">
//               <div>
//                 <p className="font-semibold text-lg">{patient?.full_name || 'N/A'}</p>
//                 {patient?.patient_id && (
//                   <p className="text-sm text-muted-foreground">ID: {patient.patient_id}</p>
//                 )}
//               </div>
//               {patient?.phone && (
//                 <p className="text-sm">Phone: {patient.phone}</p>
//               )}
//               {patient?.address && (
//                 <div className="text-sm">
//                   {patient.address.street && <p>{patient.address.street}</p>}
//                   {(patient.address.city || patient.address.state) && (
//                     <p>
//                       {patient.address.city}
//                       {patient.address.city && patient.address.state && ', '}
//                       {patient.address.state} {patient.address.postal_code}
//                     </p>
//                   )}
//                   {patient.address.country && <p>{patient.address.country}</p>}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Doctor / Attending Physician */}
//         {doctor && (
//           <div>
//             <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
//               Attending Physician
//             </h3>
//             <div className="bg-gray-50 rounded-lg p-4">
//               <div className="space-y-2">
//                 <p className="font-semibold">{doctor.full_name}</p>
//                 {doctor.specialization && (
//                   <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
//                 )}
//                 {doctor.phone_number && (
//                   <p className="text-sm">Phone: {doctor.phone_number}</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Insurance Claim Details (if applicable) */}
//       {activeInsuranceClaim && primaryInsurance && (
//         <div className="mb-8">
//           <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
//             Insurance Information
//           </h3>
//           <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-xs text-muted-foreground uppercase">Insurance Provider</p>
//                 <p className="font-medium">{primaryInsurance.insurance_provider?.name || 'N/A'}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-muted-foreground uppercase">Policy Number</p>
//                 <p className="font-medium">{primaryInsurance.policy_number}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-muted-foreground uppercase">Claim Number</p>
//                 <p className="font-medium">{activeInsuranceClaim.claim_number}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-muted-foreground uppercase">Claim Status</p>
//                 <BillStatusBadge status={activeInsuranceClaim.status} size="sm" />
//               </div>
//               <div>
//                 <p className="text-xs text-muted-foreground uppercase">Claim Amount</p>
//                 <CurrencyDisplay
//                   amount={activeInsuranceClaim.claim_amount}
//                   currency="AFN"
//                   weight="medium"
//                 />
//               </div>
//               {activeInsuranceClaim.approved_amount && (
//                 <div>
//                   <p className="text-xs text-muted-foreground uppercase">Approved Amount</p>
//                   <CurrencyDisplay
//                     amount={activeInsuranceClaim.approved_amount}
//                     currency="AFN"
//                     weight="medium"
//                     color="success"
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Itemized Bill Items */}
//       <div className="mb-8">
//         <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
//           Itemized Charges
//         </h3>
//         <div className="border rounded-lg overflow-hidden">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
//                 <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
//                 <th className="px-4 py-3 text-center font-semibold text-gray-700">Type</th>
//                 <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
//                 <th className="px-4 py-3 text-right font-semibold text-gray-700">Unit Price</th>
//                 <th className="px-4 py-3 text-right font-semibold text-gray-700">Discount</th>
//                 <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               {items.length > 0 ? (
//                 items.map((item, index) => (
//                   <InvoiceItemRow
//                     key={item.id || index}
//                     item={item}
//                     currency="AFN"
//                     index={index}
//                   />
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
//                     No items to display
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Payment Summary */}
//       <div className="grid grid-cols-2 gap-8 mb-8">
//         {/* Payment History */}
//         <div>
//           <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
//             Payment History
//           </h3>
//           <div className="bg-gray-50 rounded-lg p-4">
//             {payments.length > 0 ? (
//               <div className="space-y-2">
//                 {payments.map((payment) => (
//                   <PaymentInfoRow
//                     key={payment.id}
//                     payment={payment}
//                     currency="AFN"
//                   />
//                 ))}
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground">No payments recorded</p>
//             )}
//           </div>
//         </div>

//         {/* Totals */}
//         <div>
//           <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
//             Summary
//           </h3>
//           <div className="bg-gray-50 rounded-lg p-4">
//             <div className="space-y-3">
//               <div className="flex justify-between text-sm">
//                 <span className="text-muted-foreground">Subtotal</span>
//                 <span>
//                   <CurrencyDisplay amount={subtotal} currency="AFN" showSymbol={false} />
//                 </span>
//               </div>
//               {totalDiscount > 0 && (
//                 <div className="flex justify-between text-sm text-green-600">
//                   <span>Discount</span>
//                   <span>
//                     <CurrencyDisplay amount={-totalDiscount} currency="AFN" showSymbol={false} />
//                   </span>
//                 </div>
//               )}
//               {taxAmount > 0 && (
//                 <div className="flex justify-between text-sm">
//                   <span className="text-muted-foreground">Tax</span>
//                   <span>
//                     <CurrencyDisplay amount={taxAmount} currency="AFN" showSymbol={false} />
//                   </span>
//                 </div>
//               )}
//               <div className="border-t pt-3 flex justify-between font-semibold">
//                 <span>Total</span>
//                 <span>
//                   <CurrencyDisplay amount={totalAmount} currency="AFN" weight="bold" />
//                 </span>
//               </div>
//               {amountPaid > 0 && (
//                 <div className="flex justify-between text-sm text-green-600">
//                   <span>Amount Paid</span>
//                   <span>
//                     <CurrencyDisplay amount={-amountPaid} currency="AFN" showSymbol={false} />
//                   </span>
//                 </div>
//               )}
//               {bill.insurance_claim_amount && bill.insurance_claim_amount > 0 && (
//                 <div className="flex justify-between text-sm text-blue-600">
//                   <span>Insurance Coverage</span>
//                   <span>
//                     <CurrencyDisplay
//                       amount={-bill.insurance_claim_amount}
//                       currency="AFN"
//                       showSymbol={false}
//                     />
//                   </span>
//                 </div>
//               )}
//               <div className="border-t pt-3 flex justify-between font-bold text-lg">
//                 <span>Balance Due</span>
//                 <span>
//                   <CurrencyDisplay
//                     amount={balanceDue}
//                     currency="AFN"
//                     weight="bold"
//                     color={balanceDue > 0 ? 'danger' : 'success'}
//                   />
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="border-t pt-6">
//         {/* Terms & Conditions */}
//         <div className="mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
//           <ul className="text-xs text-muted-foreground space-y-1">
//             <li>• Payment is due within 30 days of invoice date</li>
//             <li>• Please include invoice number with your payment</li>
//             <li>• For questions regarding this invoice, please contact our billing department</li>
//             <li>• Late payments may be subject to additional fees</li>
//           </ul>
//         </div>

//         {/* Bank Details */}
//         <div className="mb-6">
//           <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Information</h4>
//           <div className="text-xs text-muted-foreground">
//             <p>Bank: National Bank of Afghanistan</p>
//             <p>Account: 1234567890</p>
//             <p>SWIFT: NBAAAFKA</p>
//           </div>
//         </div>

//         {/* Print Footer */}
//         {showPrintHeaderFooter && (
//           <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
//             <p>Thank you for choosing {hospital.name} for your healthcare needs.</p>
//             <p className="mt-1">
//               This invoice was generated on {new Date().toLocaleDateString('en-US', {
//                 year: 'numeric',
//                 month: 'long',
//                 day: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//               })}
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ============================================================================
// // Default Export
// // ============================================================================

// export default InvoiceTemplate;
