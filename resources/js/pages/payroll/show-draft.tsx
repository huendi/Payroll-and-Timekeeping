import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { canDelete, canGeneratePayroll } from '@/lib/auth';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    basic_rate: string;
    rate_type: string;
    allowance: string;
}

interface Attendance {
    id: number;
    date: string;
    clock_in: string;
    clock_out: string;
    hours_worked: number;
    late_minutes: number;
    overtime_hours: number;
    overtime_type: string;
    is_ot_paid: boolean;
    night_diff_hours: number;
    is_holiday: boolean;
    holiday_type: string | null;
    is_restday: boolean;
    remarks: string | null;
}

interface Payroll {
    id: number;
    payroll_period: string;
    month: string;
    year: number;
    status: string;
    total_employees: number;
    apply_deductions: boolean;
    created_at: string;
    uploaded_by: {
        name: string;
    };
}

interface Props {
    payroll: Payroll;
    computedPayrollItems?: Array<{
        employee: Employee;
        attendances: Attendance[];
        payroll: any; // Pre-computed payroll data from backend
        loan_deduction: number;
        scheduled_working_days: number;
        actual_working_days: number;
        absent_days: number;
    }>;
}

export default function PayrollShowDraft({
    payroll,
    computedPayrollItems,
}: Props) {
    const { flash } = usePage().props as any;

    const breadcrumbs = [
        { title: 'Payroll', href: '/payroll' },
        {
            title: 'Payroll Snapshot',
            href: `/payroll/${payroll.id}`,
        },
    ];

    const applyStatutoryDeductions = payroll.apply_deductions;

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
    }, [flash]);

    const handleGenerate = () => {
        if (!computedPayrollItems || computedPayrollItems.length === 0) {
            toast.error(
                'No DTR records found for this payroll. Please upload a DTR file for this period before generating.',
            );
            return;
        }

        if (
            confirm(
                'Submit payroll from attendance records? This will compute all earnings and deductions.',
            )
        ) {
            // Use pre-computed payroll data from backend
            const snapshotRows: any[] = [];
            const payrollItems = computedPayrollItems.map((item) => {
                const computed = item.payroll;

                snapshotRows.push({
                    employee: item.employee,
                    payroll: computed,
                });

                return {
                    employee_id: item.employee.id,
                    basic_pay: parseFloat(computed.basicPay),
                    restday_pay: parseFloat(computed.restdayPay),
                    allowance_pay:
                        parseFloat(computed.regularAllowance) +
                        parseFloat(computed.restdayAllowance),
                    regular_allowance: parseFloat(computed.regularAllowance),
                    restday_allowance: parseFloat(computed.restdayAllowance),
                    gross_pay: parseFloat(computed.totalPay),
                    sss_deduction: parseFloat(computed.sssDeduction),
                    phic_deduction: parseFloat(computed.phicDeduction),
                    hdmf_deduction: parseFloat(computed.hdmfDeduction),
                    tax_deduction: parseFloat(computed.taxDeduction),
                    late_deduction: parseFloat(computed.lateDeduction || '0'),
                    absence_deduction: parseFloat(
                        computed.absenceDeduction || '0',
                    ),
                    loan_deduction: parseFloat(computed.loanDeduction),
                    total_deductions: parseFloat(computed.totalDeductions),
                    net_pay: parseFloat(computed.netPay),
                    hours_worked:
                        parseFloat(computed.regularHours || '0') +
                        parseFloat(computed.restdayHours || '0'),
                    regular_hours: parseFloat(computed.regularHours || '0'),
                    restday_hours: parseFloat(computed.restdayHours || '0'),
                    overtime_hours: parseFloat(
                        computed.totalOvertimeHours || '0',
                    ),
                    night_diff_hours: parseFloat(
                        computed.totalNightDiffHours || '0',
                    ),
                    holiday_restday_hours: parseFloat(
                        computed.totalHolidayRestdayHours || '0',
                    ),
                    days_worked:
                        typeof computed.totalDays === 'number'
                            ? computed.totalDays
                            : parseFloat(computed.totalDays),
                    total_days:
                        typeof computed.totalDays === 'number'
                            ? computed.totalDays
                            : parseFloat(computed.totalDays),
                    late_minutes: computed.totalLateMinutes || 0,
                    absent_days: parseFloat(computed.absentDays || '0'),
                    // Night Differential
                    night_diff_ordinary_working: parseFloat(
                        computed.nightDiffOrdinaryWorking,
                    ),
                    night_diff_holiday:
                        parseFloat(computed.nightDiffHolidayRegular) +
                        parseFloat(computed.nightDiffHolidaySpecial),
                    night_diff_holiday_restday:
                        parseFloat(computed.nightDiffHolidayRDRegular) +
                        parseFloat(computed.nightDiffHolidayRDSpecial),
                    night_diff_restday: parseFloat(computed.nightDiffRestday),
                    night_diff_holiday_ot: parseFloat(
                        computed.nightDiffHolidayOT,
                    ),
                    night_diff_holiday_restday_ot: parseFloat(
                        computed.nightDiffHolidayRestdayOT,
                    ),
                    // Overtime Pay
                    ot_holiday: parseFloat(computed.otHoliday),
                    ot_holiday_restday: parseFloat(computed.otHolidayRestday),
                    ot_regular: parseFloat(computed.otRegular),
                    ot_restday: parseFloat(computed.otRestday),
                    ot_ordinary_working: parseFloat(computed.otOrdinaryWorking),
                    // Additional Premium Pay
                    premium_restday: parseFloat(computed.premiumRestday),
                    premium_holiday_regular: parseFloat(
                        computed.additionalHolidayRegular,
                    ),
                    premium_holiday_special: parseFloat(
                        computed.additionalHolidaySpecial,
                    ),
                    premium_holiday_rd_regular: parseFloat(
                        computed.additionalHolidayRDRegular,
                    ),
                    premium_holiday_rd_special: parseFloat(
                        computed.additionalHolidayRDSpecial,
                    ),
                };
            });

            console.log('Payroll Items:', payrollItems);

            router.post(
                `/payroll/${payroll.id}/generate`,
                {
                    payroll_items: payrollItems,
                    draft_snapshot: { rows: snapshotRows },
                },
                {
                    onSuccess: () => {
                        // Success handled by redirect
                    },
                },
            );
        }
    };

    const handleRemoveDTR = () => {
        if (
            confirm(
                'Remove this DTR and payroll draft? This action cannot be undone.',
            )
        ) {
            router.delete(`/payroll/${payroll.id}/remove-dtr`, {
                onSuccess: () => {
                    // Success handled by redirect
                },
            });
        }
    };

    // All payroll calculations are now done in the backend

    // Aggregate premium values across all rows to decide which columns to show
    const premiumVisibility = (() => {
        const totals = {
            // Night Differential (1st 8 hrs)
            nightDiffOrdinaryWorking: 0,
            nightDiffRestday: 0,
            nightDiffHolidayRegular: 0,
            nightDiffHolidaySpecial: 0,
            nightDiffHolidayRDRegular: 0,
            nightDiffHolidayRDSpecial: 0,

            // Night Differential (OT > 8 hrs)
            nightDiffOTRegular: 0,
            nightDiffOTRestday: 0,
            nightDiffHolidayOT: 0,
            nightDiffHolidaySpecialOT: 0,
            nightDiffHolidayRDOT: 0,
            nightDiffHolidayRDSpecialOT: 0,

            // Additional Premium Pay (1st 8 hrs)
            additionalRestday: 0,
            additionalHolidayRegular: 0,
            additionalHolidaySpecial: 0,
            additionalHolidayRDRegular: 0,
            additionalHolidayRDSpecial: 0,

            // Overtime Pay (excess of 8 hrs)
            otRegular: 0,
            otRestday: 0,
            otHolidayRegular: 0,
            otHolidaySpecial: 0,
            otHolidayRDRegular: 0,
            otHolidayRDSpecial: 0,
            otOrdinaryWorking: 0, // Legacy?
        };

        if (computedPayrollItems && Array.isArray(computedPayrollItems)) {
            // Use backend-computed payroll items
            computedPayrollItems.forEach((item) => {
                const payroll = item.payroll || {};

                // Night Differential (1st 8 hrs)
                totals.nightDiffOrdinaryWorking += parseFloat(
                    payroll.nightDiffOrdinaryWorking || '0',
                );
                totals.nightDiffRestday += parseFloat(
                    payroll.nightDiffRestday || '0',
                );
                totals.nightDiffHolidayRegular += parseFloat(
                    payroll.nightDiffHolidayRegular || '0',
                );
                totals.nightDiffHolidaySpecial += parseFloat(
                    payroll.nightDiffHolidaySpecial || '0',
                );
                totals.nightDiffHolidayRDRegular += parseFloat(
                    payroll.nightDiffHolidayRDRegular || '0',
                );
                totals.nightDiffHolidayRDSpecial += parseFloat(
                    payroll.nightDiffHolidayRDSpecial || '0',
                );

                // Night Differential (OT > 8 hrs)
                totals.nightDiffOTRegular += parseFloat(
                    payroll.nightDiffOTRegular || '0',
                );
                totals.nightDiffOTRestday += parseFloat(
                    payroll.nightDiffOTRestday || '0',
                );
                totals.nightDiffHolidayOT += parseFloat(
                    payroll.nightDiffHolidayOT || '0',
                );
                totals.nightDiffHolidaySpecialOT += parseFloat(
                    payroll.nightDiffHolidaySpecialOT || '0',
                );
                totals.nightDiffHolidayRDOT += parseFloat(
                    payroll.nightDiffHolidayRDOT || '0',
                );
                totals.nightDiffHolidayRDSpecialOT += parseFloat(
                    payroll.nightDiffHolidayRDSpecialOT || '0',
                );

                // Additional Premium Pay (1st 8 hrs)
                totals.additionalRestday += parseFloat(
                    payroll.additionalRestday || '0',
                );
                totals.additionalHolidayRegular += parseFloat(
                    payroll.additionalHolidayRegular || '0',
                );
                totals.additionalHolidaySpecial += parseFloat(
                    payroll.additionalHolidaySpecial || '0',
                );
                totals.additionalHolidayRDRegular += parseFloat(
                    payroll.additionalHolidayRDRegular || '0',
                );
                totals.additionalHolidayRDSpecial += parseFloat(
                    payroll.additionalHolidayRDSpecial || '0',
                );

                // Overtime Pay (excess of 8 hrs)
                totals.otRegular += parseFloat(payroll.otRegular || '0');
                totals.otRestday += parseFloat(payroll.otRestday || '0');
                totals.otHolidayRegular += parseFloat(
                    payroll.otHolidayRegular || '0',
                );
                totals.otHolidaySpecial += parseFloat(
                    payroll.otHolidaySpecial || '0',
                );
                totals.otHolidayRDRegular += parseFloat(
                    payroll.otHolidayRDRegular || '0',
                );
                totals.otHolidayRDSpecial += parseFloat(
                    payroll.otHolidayRDSpecial || '0',
                );
                totals.otOrdinaryWorking += parseFloat(
                    payroll.otOrdinaryWorking || '0',
                );
            });
        }

        const toBool = (value: number) => Math.abs(value) > 0.009;

        return {
            nightDiff: {
                // 1st 8 hrs
                ordinaryWorking: toBool(totals.nightDiffOrdinaryWorking),
                restday: toBool(totals.nightDiffRestday),
                holidayRegular: toBool(totals.nightDiffHolidayRegular),
                holidaySpecial: toBool(totals.nightDiffHolidaySpecial),
                holidayRDRegular: toBool(totals.nightDiffHolidayRDRegular),
                holidayRDSpecial: toBool(totals.nightDiffHolidayRDSpecial),
                // OT > 8 hrs
                otRegular: toBool(totals.nightDiffOTRegular),
                otRestday: toBool(totals.nightDiffOTRestday),
                holidayOT: toBool(totals.nightDiffHolidayOT),
                holidaySpecialOT: toBool(totals.nightDiffHolidaySpecialOT),
                holidayRestdayOT: toBool(totals.nightDiffHolidayRDOT),
                holidayRestdaySpecialOT: toBool(
                    totals.nightDiffHolidayRDSpecialOT,
                ),
            },
            additional: {
                restday: toBool(totals.additionalRestday),
                holidayRegular: toBool(totals.additionalHolidayRegular),
                holidaySpecial: toBool(totals.additionalHolidaySpecial),
                holidayRDRegular: toBool(totals.additionalHolidayRDRegular),
                holidayRDSpecial: toBool(totals.additionalHolidayRDSpecial),
            },
            overtime: {
                regularOT: toBool(totals.otRegular),
                restday: toBool(totals.otRestday),
                holidayRegular: toBool(totals.otHolidayRegular),
                holidaySpecial: toBool(totals.otHolidaySpecial),
                holidayRDRegular: toBool(totals.otHolidayRDRegular),
                holidayRDSpecial: toBool(totals.otHolidayRDSpecial),
                ordinaryWorking: toBool(totals.otOrdinaryWorking),
            },
        };
    })();

    const nightDiff1st8HrsCount = [
        premiumVisibility.nightDiff.ordinaryWorking,
        premiumVisibility.nightDiff.restday,
        premiumVisibility.nightDiff.holidayRegular,
        premiumVisibility.nightDiff.holidaySpecial,
        premiumVisibility.nightDiff.holidayRDRegular,
        premiumVisibility.nightDiff.holidayRDSpecial,
    ].filter(Boolean).length;

    const nightDiffOTCount = [
        premiumVisibility.nightDiff.otRegular,
        premiumVisibility.nightDiff.otRestday,
        premiumVisibility.nightDiff.holidayOT,
        premiumVisibility.nightDiff.holidaySpecialOT,
        premiumVisibility.nightDiff.holidayRestdayOT,
        premiumVisibility.nightDiff.holidayRestdaySpecialOT,
    ].filter(Boolean).length;

    const additionalColCount = Object.values(
        premiumVisibility.additional,
    ).filter(Boolean).length;
    const overtimeColCount = Object.values(premiumVisibility.overtime).filter(
        Boolean,
    ).length;

    // Calculate dynamic colSpan for SALARY COMPUTATION
    const premiumColCount =
        nightDiff1st8HrsCount +
        nightDiffOTCount +
        additionalColCount +
        overtimeColCount;
    const salaryComputationColSpan = 6 + premiumColCount; // 6 base columns (including 1 spacer) + dynamic premium columns

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
    };

    // Use backend-computed payroll items directly
    const rowSource: any[] = computedPayrollItems || [];

    const hasRows = rowSource.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Snapshot" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Payroll Snapshot
                                </h1>
                                <Badge variant="secondary">Draft</Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Review payroll computation before generating
                            </p>
                        </div>
                    </div>
                    {payroll.status === 'draft' && canGeneratePayroll() && (
                        <div className="flex gap-2">
                            {canDelete('payroll') && (
                                <Button
                                    variant="destructive"
                                    onClick={handleRemoveDTR}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove DTR
                                </Button>
                            )}
                            <Button onClick={handleGenerate}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Submit Payroll
                            </Button>
                        </div>
                    )}
                </div>

                {/* Payroll Table */}
                {!hasRows ? (
                    <Card>
                        <CardContent className="py-12">
                            <p className="text-center text-muted-foreground">
                                No attendance records found
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        {/* First Header Row - Section Titles */}
                                        <tr className="border-b">
                                            <th
                                                rowSpan={2}
                                                className="border-r bg-gray-100 p-3 font-bold"
                                            >
                                                NAME
                                            </th>
                                            <th
                                                colSpan={6}
                                                className="border-r bg-yellow-100 p-2 text-center font-bold"
                                            >
                                                WAGE RATE DETAILS
                                            </th>
                                            <th
                                                colSpan={2}
                                                className="border-r bg-green-100 p-2 text-center font-bold"
                                            >
                                                WORK SCHEDULE
                                            </th>
                                            <th
                                                colSpan={
                                                    salaryComputationColSpan
                                                }
                                                className="border-r bg-blue-100 p-2 text-center font-bold"
                                            >
                                                SALARY COMPUTATION
                                            </th>
                                            <th
                                                colSpan={5}
                                                className="border-r bg-gray-200 p-2 text-center font-bold"
                                            >
                                                DEDUCTION
                                            </th>
                                            <th
                                                rowSpan={2}
                                                className="bg-orange-100 p-2 text-center font-bold"
                                            >
                                                NET PAY
                                            </th>
                                        </tr>

                                        {/* Second Header Row - Column Names */}
                                        <tr className="border-b text-xs">
                                            {/* Wage Rate Details */}
                                            <th className="border-r bg-yellow-50 p-2">
                                                Payroll
                                            </th>
                                            <th className="border-r bg-yellow-50 p-2">
                                                Basic
                                                <br />
                                                Rate
                                            </th>
                                            <th className="border-r bg-yellow-50 p-2">
                                                Allowance
                                            </th>
                                            <th
                                                colSpan={3}
                                                className="border-r bg-yellow-50 p-2 font-semibold"
                                            >
                                                PER HOUR RATE
                                            </th>

                                            {/* Work Schedule */}
                                            <th className="border-r bg-green-50 p-2">
                                                Total No.
                                                <br />
                                                of work
                                                <br />
                                                days
                                            </th>
                                            <th className="border-r bg-green-50 p-2">
                                                LATE /<br />
                                                ABSENCES
                                                <br />
                                                (in mins.)
                                            </th>
                                            {/* <th className="border-r bg-green-50 p-2">
                                                Restday
                                                <br />
                                                OT (in Hrs.)
                                                <br />
                                                30%
                                            </th>
                                            <th className="border-r bg-green-50 p-2">
                                                Regular
                                                <br />
                                                OT (in Hrs.)
                                                <br />
                                                125%
                                            </th>
                                            <th className="border-r bg-green-50 p-2">
                                                Night Shift DF
                                                <br />
                                                Restday (in Hrs.)
                                                <br />
                                                13%
                                            </th> */}

                                            {/* Salary Computation */}
                                            <th className="border-r bg-blue-50 p-2">
                                                Basic
                                                <br />
                                                Pay
                                            </th>
                                            <th className="border-r bg-blue-50 p-2">
                                                Restday
                                                <br />
                                                Pay
                                            </th>
                                            <th className="border-r bg-blue-50 p-2">
                                                Lates
                                                <br />
                                                Deduction
                                            </th>
                                            <th
                                                colSpan={2}
                                                className="border-r bg-blue-50 p-2 font-semibold"
                                            >
                                                Allowance
                                            </th>

                                            {/* NIGHT DIFFERENTIAL - Premium Pay for 1st 8 hrs */}
                                            {nightDiff1st8HrsCount > 0 && (
                                                <th
                                                    colSpan={
                                                        nightDiff1st8HrsCount
                                                    }
                                                    className="border-r bg-purple-100 p-2 font-semibold"
                                                >
                                                    NIGHT DIFF (1st 8 hrs)
                                                </th>
                                            )}

                                            {/* NIGHT DIFFERENTIAL - Overtime Pay in excess of 8 hrs */}
                                            {nightDiffOTCount > 0 && (
                                                <th
                                                    colSpan={nightDiffOTCount}
                                                    className="border-r bg-purple-100 p-2 font-semibold"
                                                >
                                                    NIGHT DIFF (OT &gt; 8 hrs)
                                                </th>
                                            )}

                                            {/* ADDITIONAL PREMIUM PAY for 1st 8 hrs - only if any additional column has data */}
                                            {additionalColCount > 0 && (
                                                <th
                                                    colSpan={additionalColCount}
                                                    className="border-r bg-orange-100 p-2 font-semibold"
                                                >
                                                    ADDITIONAL PREMIUM PAY (1st
                                                    8 hrs)
                                                </th>
                                            )}

                                            {/* OVERTIME PAY in excess of 8 hrs - only if any OT column has data */}
                                            {overtimeColCount > 0 && (
                                                <th
                                                    colSpan={overtimeColCount}
                                                    className="border-r bg-green-100 p-2 font-semibold"
                                                >
                                                    OVERTIME PAY (excess of 8
                                                    hrs)
                                                </th>
                                            )}

                                            <th className="border-r bg-blue-50 p-2 font-bold">
                                                Gross Pay
                                            </th>

                                            {/* Deductions */}
                                            <th className="border-r bg-gray-100 p-2">
                                                SSS
                                            </th>
                                            <th className="border-r bg-gray-100 p-2">
                                                PHIC
                                            </th>
                                            <th className="border-r bg-gray-100 p-2">
                                                HDMF
                                            </th>
                                            <th className="border-r bg-gray-100 p-2">
                                                TAX
                                            </th>
                                            <th className="border-r bg-gray-100 p-2">
                                                LOAN
                                            </th>
                                        </tr>

                                        {/* Third Header Row - Sub-columns */}
                                        <tr className="border-b bg-gray-50 text-xs">
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r bg-yellow-50 p-2">
                                                Basic
                                            </th>
                                            <th className="border-r bg-yellow-50 p-2">
                                                Allowance
                                            </th>
                                            <th className="border-r bg-yellow-50 p-2">
                                                Total
                                            </th>
                                            {/* <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th> */}
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            {/* <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th> */}
                                            {/* Placeholder for commented-out columns: Restday OT, Regular OT, Night Shift DF Restday */}
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r p-2"></th>
                                            <th className="border-r bg-blue-50 p-2">
                                                Regular
                                            </th>
                                            <th className="border-r bg-blue-50 p-2">
                                                Restday
                                            </th>

                                            {/* Night Differential Sub-columns - per-column visibility */}
                                            {premiumVisibility.nightDiff
                                                .ordinaryWorking && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Ordinary
                                                    <br />
                                                    Working
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .restday && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Restday
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidayRegular && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Regular
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidaySpecial && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Special
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidayRDRegular && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Regular
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidayRDSpecial && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Special
                                                </th>
                                            )}
                                            {/* Night Differential (OT) Sub-columns */}
                                            {premiumVisibility.nightDiff
                                                .otRegular && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Regular
                                                    <br />
                                                    OT
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .otRestday && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Restday
                                                    <br />
                                                    OT
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidayOT && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    OT
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidaySpecialOT && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Special OT
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidayRestdayOT && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    OT
                                                </th>
                                            )}
                                            {premiumVisibility.nightDiff
                                                .holidayRestdaySpecialOT && (
                                                <th className="border-r bg-purple-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Special OT
                                                </th>
                                            )}

                                            {/* Additional Premium Pay Sub-columns - per-column visibility */}
                                            {premiumVisibility.additional
                                                .restday && (
                                                <th className="border-r bg-orange-50 p-2 text-xs">
                                                    Restday
                                                </th>
                                            )}
                                            {premiumVisibility.additional
                                                .holidayRegular && (
                                                <th className="border-r bg-orange-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Regular
                                                </th>
                                            )}
                                            {premiumVisibility.additional
                                                .holidaySpecial && (
                                                <th className="border-r bg-orange-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Special
                                                </th>
                                            )}
                                            {premiumVisibility.additional
                                                .holidayRDRegular && (
                                                <th className="border-r bg-orange-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Regular
                                                </th>
                                            )}
                                            {premiumVisibility.additional
                                                .holidayRDSpecial && (
                                                <th className="border-r bg-orange-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Special
                                                </th>
                                            )}

                                            {/* Overtime Pay Sub-columns - per-column visibility */}
                                            {premiumVisibility.overtime
                                                .regularOT && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Regular
                                                    <br />
                                                    OT
                                                </th>
                                            )}
                                            {premiumVisibility.overtime
                                                .restday && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Restday
                                                </th>
                                            )}
                                            {premiumVisibility.overtime
                                                .holidayRegular && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Regular
                                                </th>
                                            )}
                                            {premiumVisibility.overtime
                                                .holidaySpecial && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Holiday
                                                    <br />
                                                    Special
                                                </th>
                                            )}
                                            {premiumVisibility.overtime
                                                .holidayRDRegular && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Regular
                                                </th>
                                            )}
                                            {premiumVisibility.overtime
                                                .holidayRDSpecial && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Holiday RD
                                                    <br />
                                                    Special
                                                </th>
                                            )}
                                            {premiumVisibility.overtime
                                                .ordinaryWorking && (
                                                <th className="border-r bg-green-50 p-2 text-xs">
                                                    Ordinary
                                                    <br />
                                                    Working
                                                </th>
                                            )}

                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rowSource.map((row, index) => {
                                            const employee =
                                                row.employee as Employee;
                                            const payroll = row.payroll as any;

                                            return (
                                                <tr
                                                    key={employee.id}
                                                    className="border-b hover:bg-gray-50"
                                                >
                                                    {/* Name */}
                                                    <td className="border-r p-2 font-medium">
                                                        <div>
                                                            {
                                                                employee.first_name
                                                            }{' '}
                                                            {employee.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {
                                                                employee.employee_number
                                                            }
                                                        </div>
                                                    </td>

                                                    {/* Wage Rate Details */}
                                                    <td className="border-r p-2 text-center">
                                                        {payroll.payrollType}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.basicRate,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.allowanceRate,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.hourlyBasic,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.hourlyAllowance,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right font-semibold">
                                                        {formatCurrency(
                                                            payroll.hourlyTotal,
                                                        )}
                                                    </td>

                                                    {/* Work Schedule */}
                                                    <td className="border-r p-2 text-center">
                                                        {payroll.totalDays}
                                                    </td>
                                                    <td className="border-r p-2 text-center">
                                                        {
                                                            payroll.lateAndAbsMinutes
                                                        }
                                                    </td>
                                                    {/* <td className="border-r p-2 text-center">
                                                        {payroll.restdayOT}
                                                    </td>
                                                    <td className="border-r p-2 text-center">
                                                        {payroll.regularOT}
                                                    </td>
                                                    <td className="border-r p-2 text-center">
                                                        {
                                                            payroll.nightShiftRestday
                                                        }
                                                    </td> */}

                                                    {/* Salary Computation */}
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.basicPay,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.restdayPay,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right text-red-600">
                                                        {formatCurrency(
                                                            payroll.latesDeduction,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.regularAllowance,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.restdayAllowance,
                                                        )}
                                                    </td>

                                                    {/* Night Differential Columns - per-column visibility */}
                                                    {premiumVisibility.nightDiff
                                                        .ordinaryWorking && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffOrdinaryWorking,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffOrdinaryWorkingHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .restday && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffRestday,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffRestdayHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidayRegular && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidayRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidayRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidaySpecial && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidaySpecial,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidaySpecialHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidayRDRegular && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidayRDRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidayRDRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidayRDSpecial && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidayRDSpecial,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidayRDSpecialHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {/* Night Differential (OT) Columns */}
                                                    {premiumVisibility.nightDiff
                                                        .otRegular && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffOTRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffOTRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .otRestday && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffOTRestday,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffOTRestdayHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidayOT && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidayOT,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidayOTHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidaySpecialOT && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidaySpecialOT,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidaySpecialOTHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidayRestdayOT && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidayRestdayOT,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidayRDOTHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.nightDiff
                                                        .holidayRestdaySpecialOT && (
                                                        <td className="border-r bg-purple-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.nightDiffHolidayRDSpecialOT,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.nightDiffHolidayRDSpecialOTHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}

                                                    {/* Additional Premium Pay Columns - per-column visibility */}
                                                    {premiumVisibility
                                                        .additional.restday && (
                                                        <td className="border-r bg-orange-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.additionalRestday,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.additionalRestdayHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility
                                                        .additional
                                                        .holidayRegular && (
                                                        <td className="border-r bg-orange-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.additionalHolidayRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.additionalHolidayRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility
                                                        .additional
                                                        .holidaySpecial && (
                                                        <td className="border-r bg-orange-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.additionalHolidaySpecial,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.additionalHolidaySpecialHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility
                                                        .additional
                                                        .holidayRDRegular && (
                                                        <td className="border-r bg-orange-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.additionalHolidayRDRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.additionalHolidayRDRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility
                                                        .additional
                                                        .holidayRDSpecial && (
                                                        <td className="border-r bg-orange-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.additionalHolidayRDSpecial,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.additionalHolidayRDSpecialHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}

                                                    {/* Overtime Pay Columns - per-column visibility */}
                                                    {premiumVisibility.overtime
                                                        .regularOT && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.overtime
                                                        .restday && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otRestday,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otRestdayHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.overtime
                                                        .holidayRegular && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otHolidayRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otHolidayRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.overtime
                                                        .holidaySpecial && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otHolidaySpecial,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otHolidaySpecialHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.overtime
                                                        .holidayRDRegular && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otHolidayRDRegular,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otHolidayRDRegularHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.overtime
                                                        .holidayRDSpecial && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otHolidayRDSpecial,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otHolidayRDSpecialHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    {premiumVisibility.overtime
                                                        .ordinaryWorking && (
                                                        <td className="border-r bg-green-50 p-2 text-right text-xs">
                                                            <div>
                                                                {formatCurrency(
                                                                    payroll.otOrdinaryWorking,
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                (
                                                                {
                                                                    payroll.otOrdinaryWorkingHours
                                                                }{' '}
                                                                hrs)
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="border-r bg-yellow-50 p-2 text-right font-bold">
                                                        {formatCurrency(
                                                            payroll.totalPay,
                                                        )}
                                                    </td>

                                                    {/* Deductions */}
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.sssDeduction,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.phicDeduction,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.hdmfDeduction,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.taxDeduction,
                                                        )}
                                                    </td>
                                                    <td className="border-r p-2 text-right">
                                                        {formatCurrency(
                                                            payroll.loanDeduction,
                                                        )}
                                                    </td>

                                                    {/* Net Pay */}
                                                    <td className="bg-orange-50 p-2 text-right text-lg font-bold">
                                                        {formatCurrency(
                                                            payroll.netPay,
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
