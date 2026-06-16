import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
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
    net_pay: string;
    incentives: string | null;
    generated_at: string | null;
    is_archived: boolean;
    archived_at: string | null;
    payroll_period: string;
    month: string;
    year: number;
    employee: EmployeeSummary;
    payroll: PayrollSummary | null;
}

interface PaginatedPayslips {
    data: Payslip[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    payslips: PaginatedPayslips;
    filters: {
        payroll_id?: number | string | null;
        employee_id?: number | string | null;
    };
}

export default function PayslipsArchive({ payslips, filters }: Props) {
    const breadcrumbs = [
        { title: 'Payslips', href: '/payslips' },
        { title: 'Archive', href: '/payslips/archive' },
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

    const handleRestore = (payslipId: number) => {
        if (confirm('Restore this payslip?')) {
            router.post(
                `/payslips/${payslipId}/restore`,
                {},
                {
                    onSuccess: () => {
                        toast.success('Payslip restored successfully');
                    },
                    onError: () => {
                        toast.error('Failed to restore payslip');
                    },
                },
            );
        }
    };

    const handleDelete = (payslipId: number) => {
        if (
            confirm('Permanently delete this payslip? This cannot be undone.')
        ) {
            router.delete(`/payslips/${payslipId}`, {
                onSuccess: () => {
                    toast.success('Payslip deleted permanently');
                },
                onError: () => {
                    toast.error('Failed to delete payslip');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Archived Payslips" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Archived Payslips
                        </h1>
                        <p className="text-muted-foreground">
                            View and manage archived payslips
                        </p>
                    </div>
                    <Link href="/payslips">
                        <Button variant="outline">Back to Payslips</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Archived Records</CardTitle>
                        <CardDescription>
                            Total archived payslips: {payslips.total}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payslips.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Archive className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">
                                    No archived payslips
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Archived payslips will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Month/Year</TableHead>
                                            <TableHead className="text-right">
                                                Net Pay
                                            </TableHead>
                                            <TableHead>Archived At</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payslips.data.map((payslip) => (
                                            <TableRow key={payslip.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div>
                                                            {
                                                                payslip.employee
                                                                    .first_name
                                                            }{' '}
                                                            {
                                                                payslip.employee
                                                                    .last_name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                payslip.employee
                                                                    .employee_number
                                                            }
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {payslip.payroll_period}
                                                </TableCell>
                                                <TableCell>
                                                    {payslip.month}{' '}
                                                    {payslip.year}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(
                                                        payslip.net_pay,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDateTime(
                                                        payslip.archived_at,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleRestore(
                                                                    payslip.id,
                                                                )
                                                            }
                                                            title="Restore payslip"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    payslip.id,
                                                                )
                                                            }
                                                            title="Permanently delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
