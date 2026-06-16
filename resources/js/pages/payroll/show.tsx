import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { canApprovePayroll, canGeneratePayslips } from '@/lib/auth';
import { Textarea } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
}

interface PayrollItem {
    id: number;
    employee: Employee;
    days_worked: number;
    hours_worked: number;
    late_minutes: number;
    absent_days: number;
    overtime_hours: number;
    basic_pay: string;
    allowance: string;
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
    loan_deduction: string;
    total_deductions: string;
    net_pay: string;
}

interface Payroll {
    id: number;
    payroll_period: string;
    month: string;
    year: number;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    total_employees: number;
    total_gross: string;
    total_deductions: string;
    total_net: string;
    apply_deductions: boolean;
    created_at: string;
    rejection_reason?: string;
    uploaded_by: {
        name: string;
    };
    items: PayrollItem[];
}

interface Props {
    payroll: Payroll;
    hasPayslips?: boolean;
}

export default function PayrollShow({ payroll, hasPayslips = false }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const breadcrumbs = [
        { title: 'Payroll', href: '/payroll' },
        {
            title: `${payroll.payroll_period} - ${payroll.month} ${payroll.year}`,
            href: `/payroll/${payroll.id}`,
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            draft: 'secondary',
            pending: 'outline',
            approved: 'default',
            rejected: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'default'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const handleApprove = () => {
        if (
            confirm(
                'Approve this payroll? This will generate payslips for all employees and process loan payments.',
            )
        ) {
            router.post(
                `/payroll/${payroll.id}/approve`,
                {},
                {
                    onSuccess: () => {
                        // Success handled by redirect
                    },
                },
            );
        }
    };

    const handleReject = () => {
        if (!rejectRemarks.trim()) {
            alert('Please provide remarks for rejection');
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/payroll/${payroll.id}/reject`,
            { remarks: rejectRemarks },
            {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectRemarks('');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleGeneratePayslips = () => {
        if (
            confirm(
                'Generate payslips for this approved payroll? This will create payslip records for all employees in this payroll.',
            )
        ) {
            router.post(
                `/payroll/${payroll.id}/generate-payslips`,
                {},
                {
                    onSuccess: () => {
                        // Redirect handled by server
                    },
                },
            );
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll - ${payroll.payroll_period}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {payroll.payroll_period} - {payroll.month}{' '}
                                    {payroll.year}
                                </h1>
                                {getStatusBadge(payroll.status)}
                            </div>
                            <p className="text-muted-foreground">
                                {payroll.total_employees} employees • Uploaded
                                by {payroll.uploaded_by.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {payroll.status === 'pending' &&
                            canApprovePayroll() && (
                                <>
                                    <Button onClick={handleApprove}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Approve Payroll
                                    </Button>
                                    <Button
                                        onClick={() => setShowRejectModal(true)}
                                        variant="destructive"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject Payroll
                                    </Button>
                                </>
                            )}
                        {payroll.status === 'approved' &&
                            !hasPayslips &&
                            canGeneratePayslips() && (
                                <Button onClick={handleGeneratePayslips}>
                                    Generate Payslips
                                </Button>
                            )}
                        {payroll.status === 'approved' && hasPayslips && (
                            <Link href={`/payslips?payroll_id=${payroll.id}`}>
                                <Button variant="outline">View Payslips</Button>
                            </Link>
                        )}
                        {payroll.status !== 'draft' && (
                            <Link href={`/payroll/${payroll.id}/draft`}>
                                <Button variant="outline">
                                    View Draft Payroll
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Rejection Remarks */}
                {payroll.status === 'rejected' && payroll.rejection_reason && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-900">
                                Rejection Remarks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-800">
                                {payroll.rejection_reason}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Gross Pay</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(payroll.total_gross)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Deductions</CardDescription>
                            <CardTitle className="text-2xl">
                                {formatCurrency(payroll.total_deductions)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Net Pay</CardDescription>
                            <CardTitle className="text-2xl text-green-600">
                                {formatCurrency(payroll.total_net)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Payroll Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payroll Details</CardTitle>
                        <CardDescription>
                            Computed payroll for all employees
                            {!payroll.apply_deductions && (
                                <span className="ml-2 text-yellow-600">
                                    (Statutory deductions not applied)
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Hours</TableHead>
                                        <TableHead>Basic Pay</TableHead>
                                        <TableHead>Premiums</TableHead>
                                        <TableHead>Gross Pay</TableHead>
                                        <TableHead>Deductions</TableHead>
                                        <TableHead>Net Pay</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payroll.items.map((item) => {
                                        // Premiums = Night Diff + Overtime + Holiday Pay + Restday Premium (NOT full restday_pay)
                                        // restday_pay is base pay, premium_restday is the 30% additional
                                        const premiums =
                                            parseFloat(
                                                item.overtime_pay || '0',
                                            ) +
                                            parseFloat(
                                                item.night_diff_pay || '0',
                                            ) +
                                            parseFloat(item.holiday_pay || '0');

                                        // Deductions = SSS + PHIC + HDMF + Tax + Loan + Late + Absence (to match draft)
                                        const deductions =
                                            parseFloat(
                                                item.sss_deduction || '0',
                                            ) +
                                            parseFloat(
                                                item.phic_deduction || '0',
                                            ) +
                                            parseFloat(
                                                item.hdmf_deduction || '0',
                                            ) +
                                            parseFloat(
                                                item.tax_deduction || '0',
                                            ) +
                                            parseFloat(
                                                item.loan_deduction || '0',
                                            ) +
                                            parseFloat(
                                                item.late_deduction || '0',
                                            ) +
                                            parseFloat(
                                                item.absence_deduction || '0',
                                            );

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {
                                                                item.employee
                                                                    .first_name
                                                            }{' '}
                                                            {
                                                                item.employee
                                                                    .last_name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                item.employee
                                                                    .employee_number
                                                            }
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.days_worked}
                                                </TableCell>
                                                <TableCell>
                                                    {item.hours_worked}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        item.basic_pay,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        premiums.toString(),
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(
                                                        item.gross_pay,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        deductions.toString(),
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-600">
                                                    {formatCurrency(
                                                        item.net_pay,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Reject Modal */}
                <Dialog
                    open={showRejectModal}
                    onOpenChange={setShowRejectModal}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Payroll</DialogTitle>
                            <DialogDescription>
                                Please provide remarks explaining why this
                                payroll is being rejected.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="remarks">
                                    Rejection Remarks
                                </Label>
                                <Textarea
                                    id="remarks"
                                    placeholder="Enter your remarks here..."
                                    value={rejectRemarks}
                                    onChange={(e) =>
                                        setRejectRemarks(e.target.value)
                                    }
                                    rows={4}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectRemarks('');
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={
                                        isSubmitting || !rejectRemarks.trim()
                                    }
                                >
                                    {isSubmitting ? 'Rejecting...' : 'Reject'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
