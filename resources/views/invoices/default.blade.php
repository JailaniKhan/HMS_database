<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoice['number'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            background: #fff;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        
        .hospital-info {
            flex: 1;
        }
        
        .hospital-name {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .hospital-details {
            color: #666;
            font-size: 11px;
        }
        
        .invoice-title {
            text-align: right;
        }
        
        .invoice-title h1 {
            font-size: 28px;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .invoice-number {
            font-size: 14px;
            color: #666;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: flex;
            gap: 40px;
        }
        
        .info-block {
            flex: 1;
        }
        
        .info-label {
            font-weight: bold;
            color: #666;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        
        .info-value {
            font-size: 12px;
            color: #333;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-paid {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-partial {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .status-overdue {
            background: #fee2e2;
            color: #991b1b;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        thead {
            background: #f8fafc;
        }
        
        th {
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .summary-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .summary-table {
            width: 300px;
        }
        
        .summary-table td {
            padding: 8px 12px;
            border: none;
        }
        
        .summary-table .label {
            text-align: right;
            color: #666;
        }
        
        .summary-table .value {
            text-align: right;
            font-weight: bold;
        }
        
        .summary-table .total-row {
            background: #f8fafc;
            font-size: 14px;
        }
        
        .summary-table .total-row td {
            padding: 12px;
            border-top: 2px solid #2563eb;
            border-bottom: 2px solid #2563eb;
        }
        
        .balance-due {
            background: #eff6ff;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            text-align: center;
        }
        
        .balance-due-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        
        .balance-due-amount {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        
        .footer-note {
            margin-bottom: 10px;
            font-style: italic;
        }
        
        .payment-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        
        .payment-info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1e40af;
        }
        
        .insurance-info {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #22c55e;
        }
        
        .insurance-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #166534;
        }
        
        .notes-section {
            margin-top: 30px;
            padding: 15px;
            background: #fefce8;
            border-radius: 6px;
            border-left: 4px solid #eab308;
        }
        
        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #854d0e;
        }
        
        @media print {
            .invoice-container {
                padding: 20px;
            }
            
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="hospital-info">
                <div class="hospital-name">{{ $hospital['name'] }}</div>
                <div class="hospital-details">
                    @if($hospital['address'])
                        {{ $hospital['address'] }}<br>
                    @endif
                    @if($hospital['phone'])
                        Phone: {{ $hospital['phone'] }}<br>
                    @endif
                    @if($hospital['email'])
                        Email: {{ $hospital['email'] }}
                    @endif
                </div>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-number">
                    #{{ $invoice['number'] }}<br>
                    Bill: {{ $invoice['bill_number'] }}
                </div>
            </div>
        </div>
        
        <!-- Invoice Details & Patient Info -->
        <div class="section">
            <div class="info-grid">
                <div class="info-block">
                    <div class="section-title">Bill To</div>
                    <div style="margin-top: 10px;">
                        <strong>{{ $patient['name'] }}</strong><br>
                        Patient ID: {{ $patient['id'] }}<br>
                        @if($patient['address'])
                            {{ is_array($patient['address']) ? implode(', ', $patient['address']) : $patient['address'] }}<br>
                        @endif
                        @if($patient['phone'])
                            Phone: {{ $patient['phone'] }}
                        @endif
                    </div>
                </div>
                <div class="info-block">
                    <div class="section-title">Invoice Details</div>
                    <div style="margin-top: 10px;">
                        <div style="margin-bottom: 8px;">
                            <span class="info-label">Invoice Date:</span>
                            <span class="info-value">{{ $invoice['date'] }}</span>
                        </div>
                        @if($invoice['due_date'])
                        <div style="margin-bottom: 8px;">
                            <span class="info-label">Due Date:</span>
                            <span class="info-value">{{ $invoice['due_date'] }}</span>
                        </div>
                        @endif
                        <div style="margin-bottom: 8px;">
                            <span class="info-label">Status:</span>
                            <span class="status-badge status-{{ $invoice['status'] }}">
                                {{ ucfirst($invoice['status']) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        @if($doctor)
        <div class="section">
            <div class="section-title">Attending Physician</div>
            <div class="info-value">
                Dr. {{ $doctor['name'] }}
                @if($doctor['specialization'])
                    - {{ $doctor['specialization'] }}
                @endif
            </div>
        </div>
        @endif
        
        <!-- Items Table -->
        <div class="section">
            <div class="section-title">Services & Items</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%;">Description</th>
                        <th class="text-center">Category</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Discount</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                    <tr>
                        <td>{{ $item['description'] }}</td>
                        <td class="text-center">{{ ucfirst($item['category']) }}</td>
                        <td class="text-center">{{ $item['quantity'] }}</td>
                        <td class="text-right">؋{{ number_format($item['unit_price'], 2) }}</td>
                        <td class="text-right">
                            @if($item['discount'] > 0)
                                -؋{{ number_format($item['discount'], 2) }}
                            @else
                                -
                            @endif
                        </td>
                        <td class="text-right">؋{{ number_format($item['total'], 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        
        <!-- Summary -->
        <div class="summary-section">
            <table class="summary-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="value">؋{{ number_format($summary['subtotal'], 2) }}</td>
                </tr>
                @if($summary['discount'] > 0)
                <tr>
                    <td class="label">Discount:</td>
                    <td class="value" style="color: #dc2626;">-؋{{ number_format($summary['discount'], 2) }}</td>
                </tr>
                @endif
                @if($summary['tax'] > 0)
                <tr>
                    <td class="label">Tax:</td>
                    <td class="value">؋{{ number_format($summary['tax'], 2) }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="label">Total Amount:</td>
                    <td class="value">؋{{ number_format($summary['total'], 2) }}</td>
                </tr>
                @if($summary['amount_paid'] > 0)
                <tr>
                    <td class="label">Amount Paid:</td>
                    <td class="value" style="color: #16a34a;">؋{{ number_format($summary['amount_paid'], 2) }}</td>
                </tr>
                @endif
            </table>
        </div>
        
        <!-- Balance Due -->
        @if($summary['balance_due'] > 0)
        <div class="balance-due">
            <div class="balance-due-label">Balance Due</div>
            <div class="balance-due-amount">؋{{ number_format($summary['balance_due'], 2) }}</div>
        </div>
        @endif
        
        <!-- Insurance Information -->
        @if($insurance)
        <div class="insurance-info">
            <div class="insurance-title">Insurance Information</div>
            <div>
                <strong>Provider:</strong> {{ $insurance['provider'] }}<br>
                <strong>Policy Number:</strong> {{ $insurance['policy_number'] }}<br>
                @if($insurance['claim_amount'] > 0)
                    <strong>Claim Amount:</strong> ؋{{ number_format($insurance['claim_amount'], 2) }}<br>
                @endif
                @if($insurance['approved_amount'] > 0)
                    <strong>Approved Amount:</strong> ؋{{ number_format($insurance['approved_amount'], 2) }}
                @endif
            </div>
        </div>
        @endif
        
        <!-- Payment History -->
        @if(count($payments) > 0)
        <div class="section">
            <div class="section-title">Payment History</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Transaction ID</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($payments as $payment)
                    <tr>
                        <td>{{ $payment['date'] }}</td>
                        <td>{{ $payment['method'] }}</td>
                        <td>{{ $payment['transaction_id'] ?? 'N/A' }}</td>
                        <td class="text-right">؋{{ number_format($payment['amount'], 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
        
        <!-- Notes -->
        @if($notes)
        <div class="notes-section">
            <div class="notes-title">Notes</div>
            <div>{{ $notes }}</div>
        </div>
        @endif
        
        <!-- Payment Instructions -->
        <div class="payment-info">
            <div class="payment-info-title">Payment Instructions</div>
            <div style="font-size: 11px; color: #666;">
                Please make payment by the due date to avoid any late fees. For questions regarding this invoice, 
                please contact our billing department at {{ $hospital['phone'] ?? 'the number provided above' }} 
                or email us at {{ $hospital['email'] ?? 'the email provided above' }}.
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-note">
                {{ $hospital['name'] }} - {{ $invoice['footer_text'] ?? 'Thank you for choosing our healthcare services!' }}
            </div>
            <div>
                This invoice was generated on {{ now()->format('F d, Y') }} at {{ now()->format('h:i A') }}
            </div>
        </div>
    </div>
</body>
</html>
