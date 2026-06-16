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
import { Archive, ArrowLeft, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';

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

interface User {
    id: number;
    name: string;
}

interface ThirteenthMonthPayRecord {
    id: number;
    year: number;
    status: 'active' | 'archived';
    generated_at: string | null;
    generated_by: User | null;
    archived_at: string | null;
    archived_by: User | null;
}

interface PaginatedItems {
    data: ThirteenthMonthPayItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    thirteenthMonthPay: ThirteenthMonthPayRecord;
    items: PaginatedItems;
}

export default function ThirteenthMonthPayShow({
    thirteenthMonthPay,
    items,
}: Props) {
    const [currentPage, setCurrentPage] = useState(items.current_page);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleArchive = () => {
        if (
            window.confirm(
                `Archive the 13th Month Pay for ${thirteenthMonthPay.year}? You can delete it later.`,
            )
        ) {
            setIsArchiving(true);
            router.post(
                `/thirteenth-month-pay/${thirteenthMonthPay.id}/archive`,
                {},
                {
                    onFinish: () => setIsArchiving(false),
                },
            );
        }
    };

    const handleDelete = () => {
        if (
            window.confirm(
                `Permanently delete the 13th Month Pay for ${thirteenthMonthPay.year}? This action cannot be undone.`,
            )
        ) {
            setIsDeleting(true);
            router.delete(`/thirteenth-month-pay/${thirteenthMonthPay.id}`, {
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    const totalGrossPay = items.data.reduce(
        (sum, item) => sum + parseFloat(item.gross_pay_total),
        0,
    );
    const totalOvertimePay = items.data.reduce(
        (sum, item) => sum + parseFloat(item.overtime_pay_total),
        0,
    );
    const totalThirteenthMonthPay = items.data.reduce(
        (sum, item) => sum + parseFloat(item.thirteenth_month_pay),
        0,
    );

    const handleExportCSV = () => {
        const headers = [
            'Employee Number',
            'Employee Name',
            'Gross Pay Total',
            'Overtime Pay Total',
            '13th Month Pay',
        ];

        const rows = items.data.map((item) => [
            item.employee.employee_number,
            `${item.employee.first_name} ${item.employee.last_name}`,
            parseFloat(item.gross_pay_total).toFixed(2),
            parseFloat(item.overtime_pay_total).toFixed(2),
            parseFloat(item.thirteenth_month_pay).toFixed(2),
        ]);

        const csv = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `13th-month-pay-${thirteenthMonthPay.year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <AppLayout>
            <Head title={`13th Month Pay - ${thirteenthMonthPay.year}`} />

            <div className="m-5 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                13th Month Pay - {thirteenthMonthPay.year}
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                {items.total} employees
                                {thirteenthMonthPay.generated_at &&
                                    ` • Generated on ${new Date(
                                        thirteenthMonthPay.generated_at,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleExportCSV}
                            variant="outline"
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                        {thirteenthMonthPay.status === 'active' ? (
                            <Button
                                onClick={handleArchive}
                                variant="outline"
                                className="gap-2"
                                disabled={isArchiving}
                            >
                                <Archive className="h-4 w-4" />
                                {isArchiving ? 'Archiving...' : 'Archive'}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleDelete}
                                variant="destructive"
                                className="gap-2"
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Gross Pay
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ₱
                                {totalGrossPay.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Overtime Pay
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ₱
                                {totalOvertimePay.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total 13th Month Pay
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                ₱
                                {totalThirteenthMonthPay.toLocaleString(
                                    'en-US',
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    },
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Employee 13th Month Pay Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Number</TableHead>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead className="text-right">
                                            Gross Pay Total
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Overtime Pay
                                        </TableHead>
                                        <TableHead className="text-right">
                                            13th Month Pay
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">
                                                {item.employee.employee_number}
                                            </TableCell>
                                            <TableCell>
                                                {item.employee.first_name}{' '}
                                                {item.employee.last_name}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                ₱
                                                {parseFloat(
                                                    item.gross_pay_total,
                                                ).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                ₱
                                                {parseFloat(
                                                    item.overtime_pay_total,
                                                ).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold">
                                                ₱
                                                {parseFloat(
                                                    item.thirteenth_month_pay,
                                                ).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {items.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing{' '}
                                    {(items.current_page - 1) * items.per_page +
                                        1}{' '}
                                    to{' '}
                                    {Math.min(
                                        items.current_page * items.per_page,
                                        items.total,
                                    )}{' '}
                                    of {items.total}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={items.current_page === 1}
                                        onClick={() =>
                                            setCurrentPage(
                                                items.current_page - 1,
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            items.current_page ===
                                            items.last_page
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                items.current_page + 1,
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
