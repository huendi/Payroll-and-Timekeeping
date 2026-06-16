import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/lib/auth';
import { Head, Link, router } from '@inertiajs/react';
import { Archive, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
}

interface ThirteenthMonthPayItem {
    id: number;
    employee_id: number;
    gross_pay_total: string;
    overtime_pay_total: string;
    thirteenth_month_pay: string;
    employee: Employee;
}

interface ThirteenthMonthPayRecord {
    id: number;
    year: number;
    from_month: number;
    from_year: number;
    to_month: number;
    to_year: number;
    status: 'active' | 'archived';
    generated_at: string | null;
    items: ThirteenthMonthPayItem[];
}

interface PaginatedData {
    data: ThirteenthMonthPayRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    thirteenthMonthPays: PaginatedData;
    filters?: {
        per_page?: string;
    };
}

export default function ThirteenthMonthPayIndex({
    thirteenthMonthPays,
    filters = {},
}: Props) {
    const user = useAuth();
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    // Auto-filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (perPage !== '10') params.append('per_page', perPage);

            router.get(
                `/thirteenth-month-pay?${params.toString()}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [perPage]);

    const getMonthName = (month: number) => {
        const date = new Date();
        date.setMonth(month - 1);
        return date.toLocaleString('en-US', { month: 'short' });
    };

    const formatDateRange = (record: ThirteenthMonthPayRecord) => {
        if (!record.from_month || !record.from_year || !record.to_month || !record.to_year) {
            return 'N/A';
        }
        return `${getMonthName(record.from_month)} ${record.from_year} - ${getMonthName(record.to_month)} ${record.to_year}`;
    };

    return (
        <AppLayout>
            <Head title="13th Month Pay" />

            <div className="m-5 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            13th Month Pay
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Manage and generate 13th month pay for employees
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/thirteenth-month-pay/archive">
                            <Button variant="outline" className="gap-2">
                                <Archive className="h-4 w-4" />
                                Archives
                            </Button>
                        </Link>
                        {user?.role === 'finance' && (
                            <Link href="/thirteenth-month-pay/generate">
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Generate 13th Month Pay
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Records Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>13th Month Pay Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {thirteenthMonthPays.data.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground">
                                    No 13th month pay records found. Click
                                    "Generate 13th Month Pay" to create one.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Year</TableHead>
                                                <TableHead>Date Range</TableHead>
                                                <TableHead>Employees</TableHead>
                                                <TableHead>
                                                    Generated Date
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {thirteenthMonthPays.data.map(
                                                (record, index) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>
                                                            {(thirteenthMonthPays.current_page -
                                                                1) *
                                                                thirteenthMonthPays.per_page +
                                                                index +
                                                                1}
                                                        </TableCell>
                                                        <TableCell className="font-semibold">
                                                            {record.year}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDateRange(record)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                record.items
                                                                    .length
                                                            }{' '}
                                                            employees
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.generated_at
                                                                ? new Date(
                                                                      record.generated_at,
                                                                  ).toLocaleDateString(
                                                                      'en-US',
                                                                      {
                                                                          year: 'numeric',
                                                                          month: 'short',
                                                                          day: 'numeric',
                                                                          hour: '2-digit',
                                                                          minute: '2-digit',
                                                                      },
                                                                  )
                                                                : 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Link
                                                                    href={`/thirteenth-month-pay/${record.id}`}
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="gap-2"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                {user?.role ===
                                                                    'finance' && (
                                                                    <>
                                                                        {record.status ===
                                                                        'active' ? (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="gap-2"
                                                                                onClick={() => {
                                                                                    if (
                                                                                        window.confirm(
                                                                                            `Archive 13th Month Pay for ${record.year}?`,
                                                                                        )
                                                                                    ) {
                                                                                        router.post(
                                                                                            `/thirteenth-month-pay/${record.id}/archive`,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Archive className="h-4 w-4" />
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                className="gap-2"
                                                                                onClick={() => {
                                                                                    if (
                                                                                        window.confirm(
                                                                                            `Permanently delete 13th Month Pay for ${record.year}? This cannot be undone.`,
                                                                                        )
                                                                                    ) {
                                                                                        router.delete(
                                                                                            `/thirteenth-month-pay/${record.id}`,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing{' '}
                                            {thirteenthMonthPays.data.length} of{' '}
                                            {thirteenthMonthPays.total} records
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
                                    {thirteenthMonthPays.last_page > 1 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    thirteenthMonthPays.current_page ===
                                                    1
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/thirteenth-month-pay?page=${thirteenthMonthPays.current_page - 1}`,
                                                        {
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
                                                    length: thirteenthMonthPays.last_page,
                                                },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page ===
                                                        thirteenthMonthPays.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            `/thirteenth-month-pay?page=${page}`,
                                                            {
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
                                                    thirteenthMonthPays.current_page ===
                                                    thirteenthMonthPays.last_page
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/thirteenth-month-pay?page=${thirteenthMonthPays.current_page + 1}`,
                                                        {
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
