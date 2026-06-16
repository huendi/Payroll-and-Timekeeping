import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface EmployeeSummary {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
}

interface PayrollSummary {
    id: number;
    payroll_period: string;
    month: string;
    year: number;
}

interface Payslip {
    id: number;
    payroll_id: number;
    employee_id: number;
    basic_pay: string;
    allowance: string;
    other_pay: string;
    incentives?: string | null;
    adjustments?: string | number | null;
    overtime_pay: string;
    night_diff_pay: string;
    holiday_pay: string;
    restday_pay: string;
    gross_pay: string;
    sss_deduction: string;
    phic_deduction: string;
    hdmf_deduction: string;
    tax_deduction: string;
    late_deduction: string;
    absence_deduction: string;
    loan_deductions: Record<string, number> | null;
    total_deductions: string;
    net_pay: string;
    hours_worked: string;
    days_worked: number;
    late_minutes: number;
    absent_days: string;
    leave_days_used: string;
    overtime_hours?: string | number;
    night_diff_hours?: string | number;
    holiday_restday_hours?: string | number;
    payroll_period: string;
    month: string;
    year: number;
    generated_at: string | null;
    is_archived: boolean;
    archived_at: string | null;
    employee: EmployeeSummary;
    payroll: PayrollSummary | null;
}

interface Props {
    payslip: Payslip;
}

export default function PayslipShow({ payslip }: Props) {
    const breadcrumbs = [
        { title: 'Payslips', href: '/payslips' },
        {
            title: `${payslip.employee.first_name} ${payslip.employee.last_name}`,
            href: `/payslips?employee_id=${payslip.employee_id}`,
        },
        {
            title: `${payslip.payroll_period} - ${payslip.month} ${payslip.year}`,
            href: `/payslips/${payslip.id}`,
        },
    ];

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount));
    };

    const formatDateTime = (value: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Normalize loan_deductions.total to a number (or null if not present/valid)
    const loanTotalRaw =
        payslip.loan_deductions &&
        (payslip.loan_deductions as any).total !== undefined
            ? (payslip.loan_deductions as any).total
            : null;

    const loanTotal: number | null =
        loanTotalRaw === null
            ? null
            : typeof loanTotalRaw === 'number'
              ? loanTotalRaw
              : (() => {
                    const parsed = parseFloat(String(loanTotalRaw));
                    return Number.isNaN(parsed) ? null : parsed;
                })();

    const totalPayWithIncentives = parseFloat(payslip.gross_pay).toFixed(2);

    const hasLateMinutes = payslip.late_minutes > 0;
    const lateAndAbsencesUnit = hasLateMinutes ? 'Mins.' : 'Days';
    const lateAndAbsencesQty = hasLateMinutes
        ? payslip.late_minutes.toString()
        : parseFloat(payslip.absent_days).toFixed(2);

    const handleDownloadPayslip = async () => {
        try {
            const html2canvasModule = await import('html2canvas-pro');
            const html2canvas = html2canvasModule.default;

            // Fetch the Blade template HTML from the API
            const response = await fetch(`/api/payslips/${payslip.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch payslip data');
            }

            const data = await response.json();
            const html = data.html;

            // Create a temporary container with the Blade template HTML
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '384px';
            container.style.backgroundColor = '#ffffff';
            container.innerHTML = html;
            document.body.appendChild(container);

            // Wait for content to render
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Capture the payslip card
            const payslipElement = container.querySelector(
                '#payslip-card',
            ) as HTMLElement;
            if (payslipElement) {
                const canvas = await html2canvas(payslipElement, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                });

                const link = document.createElement('a');
                link.download = `payslip_${payslip.employee.last_name},${payslip.employee.first_name}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                toast.success('Payslip downloaded successfully');
            } else {
                throw new Error('Payslip card element not found');
            }

            // Remove container
            document.body.removeChild(container);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download payslip');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`Payslip - ${payslip.employee.first_name} ${payslip.employee.last_name}`}
            />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Payslip
                        </h1>
                        <p className="text-lg font-medium text-muted-foreground">
                            {payslip.month}{' '}
                            {payslip.payroll_period === '1st Half'
                                ? '1-15'
                                : '16-End'}
                            , {payslip.year}
                        </p>
                        <p className="text-muted-foreground">
                            {payslip.employee.first_name}{' '}
                            {payslip.employee.last_name} •{' '}
                            {payslip.employee.employee_number}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDownloadPayslip}
                            disabled={
                                payslip.incentives === null ||
                                payslip.adjustments === null
                            }
                            title={
                                payslip.incentives === null ||
                                payslip.adjustments === null
                                    ? 'Incentives and Adjustments must be set before downloading'
                                    : ''
                            }
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-full">
                    {/* View Layout - 4 Cards Horizontal */}
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4 print:hidden">
                        {/* Card 1: Employee Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Employee Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Employee ID
                                    </p>
                                    <p className="font-semibold">
                                        {payslip.employee.employee_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Name
                                    </p>
                                    <p className="font-semibold">
                                        {payslip.employee.first_name}{' '}
                                        {payslip.employee.last_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Payroll Period
                                    </p>
                                    <p className="font-semibold">
                                        {payslip.payroll_period}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 2: Earnings */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Earnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Basic Pay</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payslip.basic_pay)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Allowance</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payslip.allowance)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="w-1/3 text-left">
                                        OT Pay
                                    </span>
                                    {/* <span className="w-1/3 text-center text-xs text-muted-foreground">
                                        {payslip.overtime_hours
                                            ? parseFloat(
                                                  String(payslip.overtime_hours),
                                              )
                                            : '-'}
                                    </span> */}
                                    <span className="w-1/3 text-right font-semibold">
                                        {formatCurrency(payslip.overtime_pay)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="w-1/3 text-left">
                                        Holiday/RD
                                    </span>
                                    <span className="w-1/3 text-center text-xs text-muted-foreground">
                                        {/* {payslip.holiday_restday_hours
                                            ? parseFloat(
                                                  String(
                                                      payslip.holiday_restday_hours,
                                                  ),
                                              )
                                            : '-'} */}
                                    </span>
                                    <span className="w-1/3 text-right font-semibold">
                                        {formatCurrency(
                                            (
                                                parseFloat(
                                                    payslip.holiday_pay,
                                                ) +
                                                parseFloat(payslip.restday_pay)
                                            ).toFixed(2),
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="w-1/3 text-left">
                                        Night Diff
                                    </span>
                                    <span className="w-1/3 text-center text-xs text-muted-foreground">
                                        {/* {payslip.night_diff_hours
                                            ? parseFloat(
                                                  String(
                                                      payslip.night_diff_hours,
                                                  ),
                                              )
                                            : '-'} */}
                                    </span>
                                    <span className="w-1/3 text-right font-semibold">
                                        {formatCurrency(payslip.night_diff_pay)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Incentives</span>
                                    <span className="font-semibold">
                                        {payslip.incentives
                                            ? formatCurrency(payslip.incentives)
                                            : '-'}
                                    </span>
                                </div>
                                {/* <div className="flex justify-between">
                                    <span>Adjustments</span>
                                    <span className="font-semibold">
                                        {payslip.adjustments
                                            ? formatCurrency(
                                                  String(payslip.adjustments),
                                              )
                                            : '-'}
                                    </span>
                                </div> */}
                                <div className="flex justify-between">
                                    <span>Adjustments</span>
                                    <span className="font-semibold">
                                        {payslip.adjustments
                                            ? formatCurrency(
                                                  String(payslip.adjustments),
                                              )
                                            : '-'}
                                    </span>
                                </div>
                                <div className="border-t pt-2 font-semibold">
                                    <div className="flex justify-between">
                                        <span>Total</span>
                                        <span className="text-primary">
                                            {formatCurrency(
                                                totalPayWithIncentives,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 3: Deductions */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Deductions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Late/Absence</span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            (
                                                parseFloat(
                                                    payslip.late_deduction,
                                                ) +
                                                parseFloat(
                                                    payslip.absence_deduction,
                                                )
                                            ).toFixed(2),
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Loans</span>
                                    <span className="font-semibold">
                                        {loanTotal !== null && loanTotal !== 0
                                            ? formatCurrency(
                                                  loanTotal.toFixed(2),
                                              )
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>SSS</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payslip.sss_deduction)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PhilHealth</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payslip.phic_deduction)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>HDMF</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payslip.hdmf_deduction)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span className="font-semibold">
                                        {formatCurrency(payslip.tax_deduction)}
                                    </span>
                                </div>
                                <div className="border-t pt-2 font-semibold">
                                    <div className="flex justify-between">
                                        <span>Total</span>
                                        <span className="text-destructive">
                                            {formatCurrency(
                                                payslip.total_deductions,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 4: Net Pay */}
                        <Card className="bg-primary/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Total Earnings
                                    </p>
                                    <p className="font-semibold">
                                        {formatCurrency(totalPayWithIncentives)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Total Deductions
                                    </p>
                                    <p className="font-semibold text-destructive">
                                        {formatCurrency(
                                            payslip.total_deductions,
                                        )}
                                    </p>
                                </div>
                                <div className="border-t pt-3">
                                    <p className="text-xs text-muted-foreground">
                                        NET PAY
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {formatCurrency(payslip.net_pay)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Print Layout - Vertical Design */}
                    <Card
                        id="payslip-card"
                        className="hidden w-96 border-none shadow-lg print:block"
                    >
                        {/* Header Section */}
                        <CardHeader className="border-b pb-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/favicon.svg"
                                    className="h-10 w-10 object-contain"
                                    alt="Logo"
                                />
                                <div>
                                    <CardTitle className="text-lg">
                                        TechnoPark Hotel
                                    </CardTitle>
                                    <p className="text-xs text-gray-500">
                                        {payslip.month} {payslip.year}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-3">
                            {/* Employee Information */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs text-muted-foreground">
                                        Employee ID
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {payslip.employee.employee_number}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs text-muted-foreground">
                                        Name
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {payslip.employee.first_name}{' '}
                                        {payslip.employee.last_name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs text-muted-foreground">
                                        Payroll Period
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {payslip.payroll_period}
                                    </span>
                                </div>
                            </div>

                            {/* Earnings Section */}
                            <div className="space-y-1 border-t pt-2">
                                <h3 className="text-xs font-semibold text-foreground">
                                    Earnings
                                </h3>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">Basic Pay</span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.basic_pay)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">Allowance</span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.allowance)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">Other Pay</span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.other_pay)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        Overtime Pay
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.overtime_pay)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        Holiday &amp; Restday Pay
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(
                                            (
                                                parseFloat(
                                                    payslip.holiday_pay,
                                                ) +
                                                parseFloat(payslip.restday_pay)
                                            ).toFixed(2),
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        Night Shift Differential
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.night_diff_pay)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">Incentives</span>
                                    <span className="text-xs font-semibold">
                                        {payslip.incentives
                                            ? formatCurrency(payslip.incentives)
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t-2 border-foreground pt-1 text-xs font-semibold">
                                    <span>Total Earnings</span>
                                    <span className="text-primary">
                                        {formatCurrency(totalPayWithIncentives)}
                                    </span>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="space-y-1 border-t pt-2">
                                <h3 className="text-xs font-semibold text-foreground">
                                    Deductions
                                </h3>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        Late and Absences
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(
                                            (
                                                parseFloat(
                                                    payslip.late_deduction,
                                                ) +
                                                parseFloat(
                                                    payslip.absence_deduction,
                                                )
                                            ).toFixed(2),
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        Loans and Advances
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {loanTotal !== null && loanTotal !== 0
                                            ? formatCurrency(
                                                  loanTotal.toFixed(2),
                                              )
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        SSS Contribution
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.sss_deduction)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        PHIC Contribution
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.phic_deduction)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">
                                        HDMF Contribution
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.hdmf_deduction)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-1">
                                    <span className="text-xs">Tax</span>
                                    <span className="text-xs font-semibold">
                                        {formatCurrency(payslip.tax_deduction)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t-2 border-foreground pt-1 text-xs font-semibold">
                                    <span>Total Deductions</span>
                                    <span className="text-destructive">
                                        {formatCurrency(
                                            payslip.total_deductions,
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Net Pay Section */}
                            <div className="-mx-6 -mb-6 rounded-b-lg border-t bg-blue-50 px-6 py-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">
                                        NET PAY
                                    </span>
                                    <span className="text-lg font-bold text-primary">
                                        {formatCurrency(payslip.net_pay)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Generated At */}
                    {payslip.generated_at && (
                        <div className="mt-4 text-center text-xs text-muted-foreground print:hidden">
                            Generated: {formatDateTime(payslip.generated_at)}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
