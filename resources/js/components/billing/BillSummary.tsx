// /**
//  * BillSummary Component
//  * 
//  * Displays bill totals including subtotal, discount, tax, total, paid, and balance.
//  * Uses the Card component from the UI library for consistent styling.
//  */

// import * as React from 'react';
// import { cn } from '@/lib/utils';
// import type { Bill, BillCalculations } from '@/types/billing';
// import { useBillCalculationsFromBill } from '@/hooks/billing/useBillCalculations';

// // UI Components
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator';
// import { CurrencyDisplay } from './CurrencyDisplay';
// import { BillStatusBadge } from './BillStatusBadge';

// // Types
// interface BillSummaryProps {
//   /** Bill object to display summary for */
//   bill?: Bill | null;
//   /** Pre-calculated calculations (optional, will be computed from bill if not provided) */
//   calculations?: BillCalculations;
//   /** Currency code for display */
//   currency?: string;
//   /** Visual variant */
//   variant?: 'default' | 'compact' | 'detailed' | 'receipt';
//   /** Additional CSS classes */
//   className?: string;
//   /** Whether to show the header */
//   showHeader?: boolean;
//   /** Custom title */
//   title?: string;
//   /** Whether to show insurance information */
//   showInsurance?: boolean;
//   /** Whether to show status badge */
//   showStatus?: boolean;
//   /** Whether to highlight balance if outstanding */
//   highlightBalance?: boolean;
//   /** Callback when a row is clicked (for detailed view) */
//   onRowClick?: (rowType: string) => void;
// }

// interface SummaryRowProps {
//   label: string;
//   amount: number;
//   currency: string;
//   isNegative?: boolean;
//   isBold?: boolean;
//   isTotal?: boolean;
//   className?: string;
//   showWhenZero?: boolean;
//   tooltip?: string;
// }

// /**
//  * Individual summary row component
//  */
// function SummaryRow({
//   label,
//   amount,
//   currency,
//   isNegative = false,
//   isBold = false,
//   isTotal = false,
//   className,
//   showWhenZero = true,
//   tooltip,
// }: SummaryRowProps) {
//   if (!showWhenZero && amount === 0) {
//     return null;
//   }

//   return (
//     <div
//       className={cn(
//         'flex justify-between items-center py-1.5',
//         isTotal && 'pt-3 border-t',
//         className
//       )}
//       title={tooltip}
//     >
//       <span
//         className={cn(
//           'text-muted-foreground',
//           isBold && 'font-medium text-foreground',
//           isTotal && 'font-semibold text-foreground'
//         )}
//       >
//         {label}
//       </span>
//       <CurrencyDisplay
//         amount={isNegative ? -amount : amount}
//         currency={currency}
//         weight={isTotal ? 'bold' : isBold ? 'semibold' : 'medium'}
//         size="sm"
//         color={isNegative ? 'success' : 'default'}
//         useParentheses={isNegative}
//       />
//     </div>
//   );
// }

// /**
//  * BillSummary Component
//  * 
//  * Displays a summary of bill totals with various layout options.
//  */
// export function BillSummary({
//   bill,
//   calculations: externalCalculations,
//   currency = 'AFN',
//   variant = 'default',
//   className,
//   showHeader = true,
//   title = 'Bill Summary',
//   showInsurance = true,
//   showStatus = true,
//   highlightBalance = true,
//   onRowClick,
// }: BillSummaryProps) {
//   // Use provided calculations or compute from bill
//   const hookCalculations = useBillCalculationsFromBill(bill).calculations;
//   const calculations = externalCalculations || hookCalculations;

//   // Determine if there's an outstanding balance
//   const hasBalance = calculations.balanceDue > 0;
//   const isOverpaid = calculations.balanceDue < 0;

//   // Compact variant - minimal display
//   if (variant === 'compact') {
//     return (
//       <div className={cn('space-y-2', className)}>
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-muted-foreground">Total</span>
//           <CurrencyDisplay
//             amount={calculations.totalAmount}
//             currency={currency}
//             weight="bold"
//             size="lg"
//           />
//         </div>
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-muted-foreground">Paid</span>
//           <CurrencyDisplay
//             amount={calculations.amountPaid}
//             currency={currency}
//             color="success"
//             size="sm"
//           />
//         </div>
//         <Separator />
//         <div className="flex justify-between items-center">
//           <span className="text-sm font-medium">Balance</span>
//           <CurrencyDisplay
//             amount={Math.abs(calculations.balanceDue)}
//             currency={currency}
//             weight="bold"
//             color={hasBalance ? 'danger' : 'success'}
//           />
//         </div>
//       </div>
//     );
//   }

//   // Receipt variant - like a printed receipt
//   if (variant === 'receipt') {
//     return (
//       <div
//         className={cn(
//           'bg-white p-6 font-mono text-sm',
//           'border border-dashed border-gray-300',
//           className
//         )}
//       >
//         {showHeader && (
//           <div className="text-center mb-4">
//             <h3 className="font-bold text-lg">{title}</h3>
//             {bill?.bill_number && (
//               <p className="text-muted-foreground">{bill.bill_number}</p>
//             )}
//           </div>
//         )}

//         <div className="space-y-1">
//           <SummaryRow
//             label="Subtotal"
//             amount={calculations.subtotal}
//             currency={currency}
//           />
//           {calculations.itemDiscounts > 0 && (
//             <SummaryRow
//               label="Item Discounts"
//               amount={calculations.itemDiscounts}
//               currency={currency}
//               isNegative
//             />
//           )}
//           {calculations.billDiscount > 0 && (
//             <SummaryRow
//               label="Bill Discount"
//               amount={calculations.billDiscount}
//               currency={currency}
//               isNegative
//             />
//           )}
//           {calculations.taxAmount > 0 && (
//             <SummaryRow
//               label="Tax"
//               amount={calculations.taxAmount}
//               currency={currency}
//             />
//           )}
//           <Separator className="my-2" />
//           <SummaryRow
//             label="TOTAL"
//             amount={calculations.totalAmount}
//             currency={currency}
//             isBold
//             isTotal
//           />
//           <SummaryRow
//             label="Amount Paid"
//             amount={calculations.amountPaid}
//             currency={currency}
//             isNegative
//           />
//           {showInsurance && calculations.insuranceClaimAmount > 0 && (
//             <SummaryRow
//               label="Insurance"
//               amount={calculations.insuranceClaimAmount}
//               currency={currency}
//               isNegative
//             />
//           )}
//           <Separator className="my-2" />
//           <SummaryRow
//             label="BALANCE DUE"
//             amount={calculations.balanceDue}
//             currency={currency}
//             isBold
//             isTotal
//           />
//         </div>

//         {showStatus && bill && (
//           <div className="mt-4 pt-4 border-t text-center">
//             <BillStatusBadge status={bill.payment_status} size="lg" />
//           </div>
//         )}
//       </div>
//     );
//   }

//   // Detailed variant - shows all breakdowns
//   if (variant === 'detailed') {
//     return (
//       <Card className={cn('overflow-hidden', className)}>
//         {showHeader && (
//           <CardHeader className="pb-3">
//             <div className="flex justify-between items-start">
//               <div>
//                 <CardTitle>{title}</CardTitle>
//                 {bill?.bill_number && (
//                   <CardDescription>Bill #{bill.bill_number}</CardDescription>
//                 )}
//               </div>
//               {showStatus && bill && (
//                 <BillStatusBadge status={bill.payment_status} />
//               )}
//             </div>
//           </CardHeader>
//         )}
//         <CardContent className="space-y-1">
//           {/* Charges Section */}
//           <div
//             className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2')}
//             onClick={() => onRowClick?.('subtotal')}
//           >
//             <SummaryRow
//               label="Subtotal"
//               amount={calculations.subtotal}
//               currency={currency}
//               tooltip="Total before discounts and taxes"
//             />
//           </div>

//           {/* Discounts Section */}
//           {calculations.itemDiscounts > 0 && (
//             <div
//               className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2')}
//               onClick={() => onRowClick?.('discounts')}
//             >
//               <SummaryRow
//                 label="Item Discounts"
//                 amount={calculations.itemDiscounts}
//                 currency={currency}
//                 isNegative
//                 tooltip="Discounts applied to individual items"
//               />
//             </div>
//           )}

//           {calculations.billDiscount > 0 && (
//             <SummaryRow
//               label="Bill Discount"
//               amount={calculations.billDiscount}
//               currency={currency}
//               isNegative
//               tooltip="Overall bill discount"
//             />
//           )}

//           {calculations.totalDiscount > 0 && (
//             <SummaryRow
//               label="Total Discounts"
//               amount={calculations.totalDiscount}
//               currency={currency}
//               isNegative
//               isBold
//               className="text-green-600"
//             />
//           )}

//           {/* Tax Section */}
//           {calculations.taxAmount > 0 && (
//             <SummaryRow
//               label="Tax"
//               amount={calculations.taxAmount}
//               currency={currency}
//               tooltip="Applicable taxes"
//             />
//           )}

//           <Separator className="my-3" />

//           {/* Total Section */}
//           <SummaryRow
//             label="Total Amount"
//             amount={calculations.totalAmount}
//             currency={currency}
//             isBold
//             isTotal
//           />

//           {/* Payments Section */}
//           <div className="pt-2 space-y-1">
//             <SummaryRow
//               label="Amount Paid"
//               amount={calculations.amountPaid}
//               currency={currency}
//               isNegative
//               showWhenZero={false}
//             />

//             {showInsurance && calculations.insuranceClaimAmount > 0 && (
//               <SummaryRow
//                 label="Insurance Coverage"
//                 amount={calculations.insuranceClaimAmount}
//                 currency={currency}
//                 isNegative
//               />
//             )}

//             {showInsurance && calculations.patientResponsibility > 0 && (
//               <SummaryRow
//                 label="Patient Responsibility"
//                 amount={calculations.patientResponsibility}
//                 currency={currency}
//                 tooltip="Amount patient is responsible for"
//               />
//             )}
//           </div>

//           <Separator className="my-3" />

//           {/* Balance Section */}
//           <div
//             className={cn(
//               'bg-muted/50 rounded-lg p-3 -mx-2',
//               highlightBalance && hasBalance && 'bg-red-50',
//               highlightBalance && isOverpaid && 'bg-green-50'
//             )}
//           >
//             <div className="flex justify-between items-center">
//               <span
//                 className={cn(
//                   'font-semibold',
//                   highlightBalance && hasBalance && 'text-red-700',
//                   highlightBalance && isOverpaid && 'text-green-700'
//                 )}
//               >
//                 {isOverpaid ? 'Overpayment' : 'Balance Due'}
//               </span>
//               <CurrencyDisplay
//                 amount={Math.abs(calculations.balanceDue)}
//                 currency={currency}
//                 weight="bold"
//                 size="lg"
//                 color={
//                   highlightBalance
//                     ? hasBalance
//                       ? 'danger'
//                       : isOverpaid
//                         ? 'success'
//                         : 'default'
//                     : 'default'
//                 }
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   // Default variant
//   return (
//     <Card className={className}>
//       {showHeader && (
//         <CardHeader className="pb-3">
//           <div className="flex justify-between items-center">
//             <CardTitle className="text-lg">{title}</CardTitle>
//             {showStatus && bill && (
//               <BillStatusBadge status={bill.payment_status} />
//             )}
//           </div>
//         </CardHeader>
//       )}
//       <CardContent className="space-y-2">
//         <SummaryRow
//           label="Subtotal"
//           amount={calculations.subtotal}
//           currency={currency}
//         />

//         {calculations.totalDiscount > 0 && (
//           <SummaryRow
//             label="Discounts"
//             amount={calculations.totalDiscount}
//             currency={currency}
//             isNegative
//           />
//         )}

//         {calculations.taxAmount > 0 && (
//           <SummaryRow
//             label="Tax"
//             amount={calculations.taxAmount}
//             currency={currency}
//           />
//         )}

//         <Separator />

//         <SummaryRow
//           label="Total"
//           amount={calculations.totalAmount}
//           currency={currency}
//           isBold
//         />

//         {calculations.amountPaid > 0 && (
//           <SummaryRow
//             label="Paid"
//             amount={calculations.amountPaid}
//             currency={currency}
//             isNegative
//           />
//         )}

//         {showInsurance && calculations.insuranceClaimAmount > 0 && (
//           <SummaryRow
//             label="Insurance"
//             amount={calculations.insuranceClaimAmount}
//             currency={currency}
//             isNegative
//           />
//         )}

//         <Separator />

//         <div className="flex justify-between items-center pt-1">
//           <span
//             className={cn(
//               'font-semibold',
//               highlightBalance && hasBalance && 'text-red-600'
//             )}
//           >
//             Balance
//           </span>
//           <CurrencyDisplay
//             amount={calculations.balanceDue}
//             currency={currency}
//             weight="bold"
//             color={highlightBalance && hasBalance ? 'danger' : 'default'}
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// /**
//  * BillSummarySkeleton - Loading state for BillSummary
//  */
// export function BillSummarySkeleton({
//   className,
//   rows = 5,
// }: {
//   className?: string;
//   rows?: number;
// }) {
//   return (
//     <Card className={cn('animate-pulse', className)}>
//       <CardHeader className="pb-3">
//         <div className="h-5 bg-muted rounded w-1/3" />
//       </CardHeader>
//       <CardContent className="space-y-3">
//         {Array.from({ length: rows }).map((_, i) => (
//           <div key={i} className="flex justify-between">
//             <div className="h-4 bg-muted rounded w-1/4" />
//             <div className="h-4 bg-muted rounded w-1/4" />
//           </div>
//         ))}
//       </CardContent>
//     </Card>
//   );
// }

// /**
//  * MiniBillSummary - Ultra-compact summary for lists/tables
//  */
// export function MiniBillSummary({
//   bill,
//   className,
// }: {
//   bill?: Bill | null;
//   className?: string;
// }) {
//   const { calculations } = useBillCalculationsFromBill(bill);

//   return (
//     <div className={cn('flex items-center gap-4 text-sm', className)}>
//       <div className="text-right">
//         <div className="text-muted-foreground text-xs">Total</div>
//         <CurrencyDisplay
//           amount={calculations.totalAmount}
//           showSymbol={false}
//           size="sm"
//           weight="medium"
//         />
//       </div>
//       <div className="text-right">
//         <div className="text-muted-foreground text-xs">Balance</div>
//         <CurrencyDisplay
//           amount={calculations.balanceDue}
//           showSymbol={false}
//           size="sm"
//           weight="semibold"
//           color={calculations.balanceDue > 0 ? 'danger' : 'default'}
//         />
//       </div>
//     </div>
//   );
// }

// export default BillSummary;
