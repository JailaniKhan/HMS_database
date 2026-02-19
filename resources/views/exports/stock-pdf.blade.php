<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
        }
        
        .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 10px;
            color: #666;
        }
        
        .summary {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .summary-box {
            width: 23%;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            text-align: center;
        }
        
        .summary-box h3 {
            font-size: 9px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .summary-box .value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }
        
        .status-summary {
            margin-bottom: 20px;
        }
        
        .status-summary h2 {
            font-size: 12px;
            margin-bottom: 10px;
            color: #333;
        }
        
        .status-grid {
            display: flex;
            gap: 10px;
        }
        
        .status-item {
            padding: 8px 15px;
            border-radius: 4px;
            font-size: 9px;
        }
        
        .status-in-stock {
            background: #d4edda;
            color: #155724;
        }
        
        .status-low-stock {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-out-of-stock {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-critical {
            background: #f5c6cb;
            color: #721c24;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background: #f5f5f5;
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
        }
        
        td {
            font-size: 9px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 8px;
            color: #666;
            text-align: center;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
        }
        
        .badge-in-stock {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-low-stock {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge-out-of-stock {
            background: #f8d7da;
            color: #721c24;
        }
        
        .badge-critical {
            background: #f5c6cb;
            color: #721c24;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $pharmacyName }}</h1>
        @if($pharmacyAddress)
        <p>{{ $pharmacyAddress }}</p>
        @endif
        @if($pharmacyPhone)
        <p>Phone: {{ $pharmacyPhone }}</p>
        @endif
        <h2 style="margin-top: 15px; font-size: 14px;">Stock Report</h2>
        <p>Generated: {{ $generatedAt }}</p>
    </div>
    
    <div class="summary">
        <div class="summary-box">
            <h3>Total Items</h3>
            <div class="value">{{ number_format($totalItems) }}</div>
        </div>
        <div class="summary-box">
            <h3>Total Units</h3>
            <div class="value">{{ number_format($totalUnits) }}</div>
        </div>
        <div class="summary-box">
            <h3>Total Value</h3>
            <div class="value">{{ config('pharmacy.currency', 'AFN') }} {{ number_format($totalValue, 2) }}</div>
        </div>
        <div class="summary-box">
            <h3>Avg. Unit Value</h3>
            <div class="value">{{ config('pharmacy.currency', 'AFN') }} {{ $totalUnits > 0 ? number_format($totalValue / $totalUnits, 2) : '0.00' }}</div>
        </div>
    </div>
    
    <div class="status-summary">
        <h2>Stock Status Summary</h2>
        <div class="status-grid">
            <div class="status-item status-in-stock">
                <strong>In Stock:</strong> {{ $statusCounts['in_stock'] ?? 0 }} items
            </div>
            <div class="status-item status-low-stock">
                <strong>Low Stock:</strong> {{ $statusCounts['low_stock'] ?? 0 }} items
            </div>
            <div class="status-item status-critical">
                <strong>Critical:</strong> {{ $statusCounts['critical'] ?? 0 }} items
            </div>
            <div class="status-item status-out-of-stock">
                <strong>Out of Stock:</strong> {{ $statusCounts['out_of_stock'] ?? 0 }} items
            </div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Medicine ID</th>
                <th>Name</th>
                <th>Category</th>
                <th class="text-center">Stock Qty</th>
                <th class="text-center">Reorder Level</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total Value</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @php $row = 1; @endphp
            @foreach($medicines as $medicine)
                @php
                    $itemValue = $medicine->stock_quantity * $medicine->unit_price;
                    $status = 'In Stock';
                    $statusClass = 'badge-in-stock';
                    if ($medicine->stock_quantity <= 0) {
                        $status = 'Out of Stock';
                        $statusClass = 'badge-out-of-stock';
                    } elseif ($medicine->stock_quantity <= $medicine->reorder_level * 0.5) {
                        $status = 'Critical';
                        $statusClass = 'badge-critical';
                    } elseif ($medicine->stock_quantity <= $medicine->reorder_level) {
                        $status = 'Low Stock';
                        $statusClass = 'badge-low-stock';
                    }
                @endphp
                <tr>
                    <td>{{ $row++ }}</td>
                    <td>{{ $medicine->medicine_id }}</td>
                    <td>{{ $medicine->name }}</td>
                    <td>{{ $medicine->category->name ?? 'Uncategorized' }}</td>
                    <td class="text-center">{{ number_format($medicine->stock_quantity) }}</td>
                    <td class="text-center">{{ number_format($medicine->reorder_level) }}</td>
                    <td class="text-right">{{ config('pharmacy.currency', 'AFN') }} {{ number_format($medicine->unit_price, 2) }}</td>
                    <td class="text-right">{{ config('pharmacy.currency', 'AFN') }} {{ number_format($itemValue, 2) }}</td>
                    <td class="text-center">
                        <span class="badge {{ $statusClass }}">{{ $status }}</span>
                    </td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="font-weight: bold; background: #f5f5f5;">
                <td colspan="4">Total</td>
                <td class="text-center">{{ number_format($totalUnits) }}</td>
                <td></td>
                <td></td>
                <td class="text-right">{{ config('pharmacy.currency', 'AFN') }} {{ number_format($totalValue, 2) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
    
    <div class="footer">
        <p>This report was generated automatically by the Hospital Management System.</p>
        <p>Report Date: {{ $generatedAt }}</p>
    </div>
</body>
</html>