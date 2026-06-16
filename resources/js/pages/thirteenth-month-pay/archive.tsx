import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Eye } from 'lucide-react';

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
}

export default function ThirteenthMonthPayArchive({
    thirteenthMonthPays,
}: Props) {
    const handlePageChange = (page: number) => {
        router.get(`/thirteenth-month-pay/archive?page=${page}`);
    };

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
            <Head title="13th Month Pay Archive" />

            <div className="m-5 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            13th Month Pay Archive
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            View all generated 13th month pay records
                        </p>
                    </div>
                </div>

                {/* Records Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All 13th Month Pay Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {thirteenthMonthPays.data.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground">
                                    No 13th month pay records found.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
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
                                                (record) => (
                                                    <TableRow key={record.id}>
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
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {thirteenthMonthPays.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing{' '}
                                            {(thirteenthMonthPays.current_page -
                                                1) *
                                                thirteenthMonthPays.per_page +
                                                1}{' '}
                                            to{' '}
                                            {Math.min(
                                                thirteenthMonthPays.current_page *
                                                    thirteenthMonthPays.per_page,
                                                thirteenthMonthPays.total,
                                            )}{' '}
                                            of {thirteenthMonthPays.total}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    thirteenthMonthPays.current_page ===
                                                    1
                                                }
                                                onClick={() =>
                                                    handlePageChange(
                                                        thirteenthMonthPays.current_page -
                                                            1,
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    thirteenthMonthPays.current_page ===
                                                    thirteenthMonthPays.last_page
                                                }
                                                onClick={() =>
                                                    handlePageChange(
                                                        thirteenthMonthPays.current_page +
                                                            1,
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
