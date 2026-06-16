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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';

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
    created_at: string;
    is_archived: boolean;
    archived_at: string;
    rejection_reason?: string | null;
    uploaded_by: {
        name: string;
    };
}

interface Props {
    payrolls: {
        data: Payroll[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function PayrollArchived({ payrolls }: Props) {
    const breadcrumbs = [
        { title: 'Payroll', href: '/payroll' },
        { title: 'Archives', href: '/payroll/archive' },
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

    const handleDelete = (id: number) => {
        if (
            confirm(
                'Are you sure you want to permanently delete this archived payroll? This action cannot be undone.',
            )
        ) {
            router.delete(`/payroll/${id}`, {
                onSuccess: () => {
                    // Success handled by flash message
                },
            });
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount));
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Archived Payrolls" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Archived Payrolls
                            </h1>
                            <p className="text-muted-foreground">
                                View and manage archived payroll records
                            </p>
                        </div>
                    </div>
                </div>

                {/* Archived Payrolls List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Archived Records</CardTitle>
                        <CardDescription>
                            Restore or permanently delete archived payrolls
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payrolls.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">
                                    No archived payrolls
                                </h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Archived payrolls will appear here
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Period</TableHead>
                                                <TableHead>
                                                    Month/Year
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Employees</TableHead>
                                                <TableHead>Remarks</TableHead>
                                                <TableHead>
                                                    Archived At
                                                </TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payrolls.data.map(
                                                (payroll, index) => (
                                                    <TableRow key={payroll.id}>
                                                        <TableCell>
                                                            {(payrolls.current_page -
                                                                1) *
                                                                payrolls.per_page +
                                                                index +
                                                                1}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {
                                                                payroll.payroll_period
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {payroll.month}{' '}
                                                            {payroll.year}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(
                                                                payroll.status,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                payroll.total_employees
                                                            }
                                                        </TableCell>
                                                        <TableCell className="max-w-md text-sm">
                                                            {payroll.rejection_reason ? (
                                                                <span className="text-foreground">
                                                                    {
                                                                        payroll.rejection_reason
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">
                                                                    No remarks
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatDate(
                                                                payroll.archived_at,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        payroll.id,
                                                                    )
                                                                }
                                                                title="Permanently delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {payrolls.last_page > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {payrolls.data.length} of{' '}
                                            {payrolls.total} archived payrolls
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    payrolls.current_page === 1
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/payroll/archive?page=${payrolls.current_page - 1}`,
                                                        {},
                                                        { preserveState: true },
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm">
                                                Page {payrolls.current_page} of{' '}
                                                {payrolls.last_page}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    payrolls.current_page ===
                                                    payrolls.last_page
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/payroll/archive?page=${payrolls.current_page + 1}`,
                                                        {},
                                                        { preserveState: true },
                                                    )
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
