import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { canCreate } from '@/lib/auth';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Plus,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
    filters?: {
        status?: string;
        month?: string;
        year?: string;
        per_page?: string;
    };
}

export default function PayrollIndex({ payrolls, filters = {} }: Props) {
    const breadcrumbs = [{ title: 'Payroll', href: '/payroll' }];
    const [status, setStatus] = useState(filters.status || '');
    const [month, setMonth] = useState(filters.month || '');
    const [year, setYear] = useState(filters.year || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    // Count rejected payrolls that are not archived
    const rejectedCount = payrolls.data.filter(
        (p) => p.status === 'rejected' && !p.is_archived,
    ).length;

    // Auto-filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (month) params.append('month', month);
            if (year) params.append('year', year);
            if (perPage !== '10') params.append('per_page', perPage);

            router.get(
                `/payroll?${params.toString()}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [status, month, year, perPage]);

    const handleClearFilters = () => {
        setStatus('');
        setMonth('');
        setYear('');
        // The effect will handle the reload
    };

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

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount));
    };

    const handleArchive = (id: number) => {
        if (confirm('Archive this payroll?')) {
            router.post(
                `/payroll/${id}/archive`,
                {},
                {
                    onSuccess: () => {
                        // Success handled by flash message
                    },
                },
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Payroll
                            </h1>
                            {rejectedCount > 0 && (
                                <Badge variant="destructive">
                                    {rejectedCount} Pending Rejection
                                    {rejectedCount > 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            Manage employee payroll and DTR records
                            {rejectedCount > 0 && (
                                <span className="ml-2 text-red-600">
                                    • Archive rejected payrolls to view remarks
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/payroll/archive">
                            <Button variant="outline">
                                <Archive className="mr-2 h-4 w-4" />
                                Archives
                            </Button>
                        </Link>
                        {canCreate('payroll') && (
                            <Link href="/payroll/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Payroll
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="w-[200px] space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={status || 'all'}
                            onValueChange={(val) =>
                                setStatus(val === 'all' ? '' : val)
                            }
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">
                                    Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[200px] space-y-2">
                        <Label>Month</Label>
                        <Select
                            value={month || 'all'}
                            onValueChange={(val) =>
                                setMonth(val === 'all' ? '' : val)
                            }
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Months" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                <SelectItem value="January">January</SelectItem>
                                <SelectItem value="February">
                                    February
                                </SelectItem>
                                <SelectItem value="March">March</SelectItem>
                                <SelectItem value="April">April</SelectItem>
                                <SelectItem value="May">May</SelectItem>
                                <SelectItem value="June">June</SelectItem>
                                <SelectItem value="July">July</SelectItem>
                                <SelectItem value="August">August</SelectItem>
                                <SelectItem value="September">
                                    September
                                </SelectItem>
                                <SelectItem value="October">October</SelectItem>
                                <SelectItem value="November">
                                    November
                                </SelectItem>
                                <SelectItem value="December">
                                    December
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[200px] space-y-2">
                        <Label>Year</Label>
                        <Input
                            type="number"
                            placeholder="All Years"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            min="2020"
                            max="2030"
                            className="bg-background"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        {(status || month || year) && (
                            <Button
                                onClick={handleClearFilters}
                                variant="outline"
                                size="icon"
                                title="Clear Filters"
                                className="mt-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Payroll List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payroll Records</CardTitle>
                        <CardDescription>
                            View and manage all payroll periods
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {payrolls.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">
                                    No payroll records yet
                                </h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Get started by generating your first payroll
                                </p>
                                {/* <Link href="/payroll/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Generate Payroll
                                    </Button>
                                </Link> */}
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Period</TableHead>
                                            <TableHead>Month/Year</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Employees</TableHead>
                                            <TableHead>Gross Pay</TableHead>
                                            <TableHead>Deductions</TableHead>
                                            <TableHead>Net Pay</TableHead>
                                            <TableHead>Uploaded By</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrolls.data.map((payroll, index) => (
                                            <TableRow key={payroll.id}>
                                                <TableCell>
                                                    {(payrolls.current_page -
                                                        1) *
                                                        payrolls.per_page +
                                                        index +
                                                        1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {payroll.payroll_period}
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
                                                    {payroll.total_employees}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        payroll.total_gross,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        payroll.total_deductions,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(
                                                        payroll.total_net,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {payroll.uploaded_by.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {payroll.status !==
                                                            'rejected' && (
                                                            <Link
                                                                href={`/payroll/${payroll.id}`}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {payroll.status ===
                                                            'rejected' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleArchive(
                                                                        payroll.id,
                                                                    )
                                                                }
                                                                title="Archive payroll to view remarks"
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {payrolls.data.length} of{' '}
                                            {payrolls.total} payrolls
                                        </p>
                                        <Select
                                            value={perPage}
                                            onValueChange={setPerPage}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Items per page" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">
                                                    5 items
                                                </SelectItem>
                                                <SelectItem value="10">
                                                    10 items
                                                </SelectItem>
                                                <SelectItem value="15">
                                                    15 items
                                                </SelectItem>
                                                <SelectItem value="30">
                                                    30 items
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {payrolls.last_page > 1 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    payrolls.current_page === 1
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/payroll?page=${payrolls.current_page - 1}`,
                                                        {
                                                            status:
                                                                status ||
                                                                undefined,
                                                            month:
                                                                month ||
                                                                undefined,
                                                            year:
                                                                year ||
                                                                undefined,
                                                            per_page:
                                                                perPage !== '10'
                                                                    ? perPage
                                                                    : undefined,
                                                        },
                                                        { preserveState: true },
                                                    )
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from(
                                                {
                                                    length: payrolls.last_page,
                                                },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page ===
                                                        payrolls.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            `/payroll?page=${page}`,
                                                            {
                                                                status:
                                                                    status ||
                                                                    undefined,
                                                                month:
                                                                    month ||
                                                                    undefined,
                                                                year:
                                                                    year ||
                                                                    undefined,
                                                                per_page:
                                                                    perPage !==
                                                                    '10'
                                                                        ? perPage
                                                                        : undefined,
                                                            },
                                                            {
                                                                preserveState: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    payrolls.current_page ===
                                                    payrolls.last_page
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/payroll?page=${payrolls.current_page + 1}`,
                                                        {
                                                            status:
                                                                status ||
                                                                undefined,
                                                            month:
                                                                month ||
                                                                undefined,
                                                            year:
                                                                year ||
                                                                undefined,
                                                            per_page:
                                                                perPage !== '10'
                                                                    ? perPage
                                                                    : undefined,
                                                        },
                                                        { preserveState: true },
                                                    )
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
