<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        #payslip-card {
            width: 384px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 0;
            margin: 0 auto;
        }
        
        .card-header {
            border-bottom: 1px solid #e5e7eb;
            padding: 12px 24px;
        }
        
        .card-header-content {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        
        .card-header-icon {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: rgba(59, 130, 246, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        
        .card-header-title {
            font-size: 16px;
            font-weight: 600;
        }
        
        .card-header-subtitle {
            font-size: 12px;
            color: #6b7280;
        }
        
        .card-content {
            padding: 12px 24px;
        }
        
        .section {
            margin-bottom: 12px;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
        }
        
        .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px dashed #d1d5db;
            padding-bottom: 4px;
            margin-bottom: 4px;
            font-size: 12px;
        }
        
        .row-label {
            color: #6b7280;
        }
        
        .row-value {
            font-weight: 600;
        }
        
        .row-total {
            border-bottom: 2px solid #111827;
            border-top: 1px solid #111827;
            padding-top: 4px;
            margin-top: 4px;
            font-weight: 600;
        }
        
        .row-total .row-value {
            color: #3b82f6;
        }
        
        .row-deduction-total .row-value {
            color: #ef4444;
        }
        
        .net-pay-section {
            background: rgba(59, 130, 246, 0.05);
            border-radius: 0 0 8px 8px;
            padding: 8px 24px;
            margin: 0 -24px -24px -24px;
        }
        
        .net-pay-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .net-pay-label {
            font-size: 12px;
            font-weight: 700;
            color: #111827;
        }
        
        .net-pay-value {
            font-size: 18px;
            font-weight: 700;
            color: #3b82f6;
        }
    </style>
</head>
<body>
    <div id="payslip-card">
        <!-- Header -->
        <div class="card-header">
            <div class="card-header-content">
                <div class="card-header-icon">👤</div>
                <div>
                    <div class="card-header-title">Payslip</div>
                    <div class="card-header-subtitle">{{ $payslip->month }} {{ $payslip->year }}</div>
                </div>
            </div>
        </div>

        <div class="card-content">
            <!-- Employee Information -->
            <div class="section">
                <div class="row">
                    <span class="row-label">Employee ID</span>
                    <span class="row-value">{{ $payslip->employee->employee_number }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Name</span>
                    <span class="row-value">{{ $payslip->employee->first_name }} {{ $payslip->employee->last_name }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Payroll Period</span>
                    <span class="row-value">{{ $payslip->payroll_period }}</span>
                </div>
            </div>

            <!-- Earnings Section -->
            <div class="section">
                <div class="section-title">Earnings</div>
                <div class="row">
                    <span class="row-label">Basic Pay</span>
                    <span class="row-value">₱{{ number_format($payslip->basic_pay, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Allowance</span>
                    <span class="row-value">₱{{ number_format($payslip->allowance, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Other Pay</span>
                    <span class="row-value">₱{{ number_format($payslip->other_pay, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Overtime Pay</span>
                    <span class="row-value">₱{{ number_format($payslip->overtime_pay, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Holiday & Restday Pay</span>
                    <span class="row-value">₱{{ number_format(floatval($payslip->holiday_pay) + floatval($payslip->restday_pay), 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Night Shift Differential</span>
                    <span class="row-value">₱{{ number_format($payslip->night_diff_pay, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Incentives</span>
                    <span class="row-value">{{ $payslip->incentives ? '₱' . number_format($payslip->incentives, 2) : '-' }}</span>
                </div>
                <div class="row row-total">
                    <span class="row-label">Total Earnings</span>
                    <span class="row-value">₱{{ number_format($totalPayWithIncentives, 2) }}</span>
                </div>
            </div>

            <!-- Deductions Section -->
            <div class="section">
                <div class="section-title">Deductions</div>
                <div class="row">
                    <span class="row-label">Late and Absences</span>
                    <span class="row-value">₱{{ number_format(floatval($payslip->late_deduction) + floatval($payslip->absence_deduction), 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Loans and Advances</span>
                    <span class="row-value">{{ $loanTotal !== null && $loanTotal !== 0 ? '₱' . number_format($loanTotal, 2) : '-' }}</span>
                </div>
                <div class="row">
                    <span class="row-label">SSS Contribution</span>
                    <span class="row-value">₱{{ number_format($payslip->sss_deduction, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">PHIC Contribution</span>
                    <span class="row-value">₱{{ number_format($payslip->phic_deduction, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">HDMF Contribution</span>
                    <span class="row-value">₱{{ number_format($payslip->hdmf_deduction, 2) }}</span>
                </div>
                <div class="row">
                    <span class="row-label">Tax</span>
                    <span class="row-value">₱{{ number_format($payslip->tax_deduction, 2) }}</span>
                </div>
                <div class="row row-total row-deduction-total">
                    <span class="row-label">Total Deductions</span>
                    <span class="row-value">₱{{ number_format($payslip->total_deductions, 2) }}</span>
                </div>
            </div>
        </div>

        <!-- Net Pay Section -->
        <div class="net-pay-section">
            <div class="net-pay-row">
                <span class="net-pay-label">NET PAY</span>
                <span class="net-pay-value">₱{{ number_format($payslip->net_pay, 2) }}</span>
            </div>
        </div>
    </div>
</body>
</html>
