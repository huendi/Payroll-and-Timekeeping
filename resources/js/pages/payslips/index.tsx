import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useAuth } from '@/lib/auth';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface PayslipItem {
    id: number;
    payroll_id: number;
    employee_id: number;
    payroll_period: string;
    month: string;
    year: number;
    net_pay: string;
    incentives: string | number | null;
    generated_at: string | null;
    employee: EmployeeSummary;
    payroll: PayrollSummary | null;
}

interface PaginatedPayslips {
    data: PayslipItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    payslips: PaginatedPayslips;
    filters: {
        payroll_id?: number | string | null;
        employee_id?: number | string | null;
        period?: string;
        month?: string;
        year?: string;
        per_page?: string;
    };
    payroll: PayrollSummary | null;
    employee: EmployeeSummary | null;
    payslipsNeedingIncentivesCount?: number;
}

export default function PayslipsIndex({
    payslips,
    filters,
    payroll,
    employee,
    payslipsNeedingIncentivesCount = 0,
}: Props) {
    const user = useAuth();
    const [searchPeriod, setSearchPeriod] = useState(filters.period || '');
    const [filterMonth, setFilterMonth] = useState(filters.month || '');
    const [filterYear, setFilterYear] = useState(filters.year || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    // Generate year options (current year and 5 years back)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from(
        { length: 6 },
        (_, i) => currentYear - i,
    ).sort((a, b) => b - a);

    // Auto-filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchPeriod) params.append('period', searchPeriod);
            if (filterMonth) params.append('month', filterMonth);
            if (filterYear) params.append('year', filterYear);
            if (perPage !== '10') params.append('per_page', perPage);

            router.get(
                `/payslips?${params.toString()}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchPeriod, filterMonth, filterYear, perPage]);

    const handleClearFilters = () => {
        setSearchPeriod('');
        setFilterMonth('');
        setFilterYear('');
    };

    const breadcrumbs = [{ title: 'Payslips', href: '/payslips' }];

    if (payroll) {
        breadcrumbs.push({
            title: `${payroll.payroll_period} - ${payroll.month} ${payroll.year}`,
            href: `/payslips?payroll_id=${payroll.id}`,
        });
    }

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

    const countPayslipsNeedingIncentives = (payslipGroup: PayslipItem[]) => {
        return payslipGroup.filter((p) => p.incentives === null).length;
    };

    const titleParts: string[] = ['Payslips'];
    if (employee) {
        titleParts.push(`for ${employee.first_name} ${employee.last_name}`);
    }
    if (payroll) {
        titleParts.push(
            `- ${payroll.payroll_period} ${payroll.month} ${payroll.year}`,
        );
    }

    const pageTitle = titleParts.join(' ');

    // Group payslips by payroll period
    const groupedPayslips = payslips.data.reduce(
        (acc, payslip) => {
            const key = `${payslip.payroll_period}-${payslip.month}-${payslip.year}`;
            if (!acc[key]) {
                acc[key] = {
                    period: payslip.payroll_period,
                    month: payslip.month,
                    year: payslip.year,
                    payslips: [],
                };
            }
            acc[key].payslips.push(payslip);
            return acc;
        },
        {} as Record<
            string,
            {
                period: string;
                month: string;
                year: number;
                payslips: PayslipItem[];
            }
        >,
    );

    // Sort groups by year and month (descending)
    const sortedGroups = Object.values(groupedPayslips).sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        const monthOrder: Record<string, number> = {
            January: 1,
            February: 2,
            March: 3,
            April: 4,
            May: 5,
            June: 6,
            July: 7,
            August: 8,
            September: 9,
            October: 10,
            November: 11,
            December: 12,
        };
        return (monthOrder[b.month] || 0) - (monthOrder[a.month] || 0);
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {pageTitle}
                        </h1>
                        <p className="text-muted-foreground">
                            View generated payslips
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {filters.payroll_id && (
                            <Link href={`/payroll/${filters.payroll_id}`}>
                                <Button variant="outline">
                                    Back to Payroll
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="w-[200px] space-y-2">
                        <Label>Search Period</Label>
                        <div className="relative">
                            <Input
                                placeholder="e.g., 1st Half, 2nd Half"
                                value={searchPeriod}
                                onChange={(e) =>
                                    setSearchPeriod(e.target.value)
                                }
                                className="bg-background pr-10"
                            />
                            {searchPeriod && (
                                <button
                                    onClick={() => setSearchPeriod('')}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    title="Clear"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-[200px] space-y-2">
                        <Label>Month</Label>
                        <Select
                            value={filterMonth || 'all'}
                            onValueChange={(val) =>
                                setFilterMonth(val === 'all' ? '' : val)
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
                        <Select
                            value={filterYear || 'all'}
                            onValueChange={(val) =>
                                setFilterYear(val === 'all' ? '' : val)
                            }
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {yearOptions.map((year) => (
                                    <SelectItem
                                        key={year}
                                        value={year.toString()}
                                    >
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end gap-2">
                        {(searchPeriod || filterMonth || filterYear) && (
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

                <Card>
                    <CardContent>
                        {payslips.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No payslips found.
                            </p>
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
                                                <TableHead>Payslips</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedGroups.map(
                                                (group, index) => {
                                                    const groupKey = `${group.period}-${group.month}-${group.year}`;
                                                    const needingIncentives =
                                                        countPayslipsNeedingIncentives(
                                                            group.payslips,
                                                        );

                                                    return (
                                                        <TableRow
                                                            key={groupKey}
                                                        >
                                                            <TableCell>
                                                                {(payslips.current_page -
                                                                    1) *
                                                                    payslips.per_page +
                                                                    index +
                                                                    1}
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {
                                                                        group.period
                                                                    }
                                                                    {user?.role ===
                                                                        'admin' &&
                                                                        needingIncentives >
                                                                            0 && (
                                                                            <Badge variant="destructive">
                                                                                {
                                                                                    needingIncentives
                                                                                }{' '}
                                                                                need
                                                                                incentives
                                                                            </Badge>
                                                                        )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {group.month}{' '}
                                                                {group.year}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {
                                                                        group
                                                                            .payslips
                                                                            .length
                                                                    }
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Link
                                                                    href={`/payslips/group/${encodeURIComponent(group.period)}/${group.month}/${group.year}`}
                                                                >
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                },
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {payslips.data.length} of{' '}
                                            {payslips.total} payslip groups
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
                                    {payslips.last_page > 1 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    payslips.current_page === 1
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/payslips?page=${payslips.current_page - 1}`,
                                                        {
                                                            period:
                                                                searchPeriod ||
                                                                undefined,
                                                            month:
                                                                filterMonth ||
                                                                undefined,
                                                            year:
                                                                filterYear ||
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
                                                    length: payslips.last_page,
                                                },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page ===
                                                        payslips.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            `/payslips?page=${page}`,
                                                            {
                                                                period:
                                                                    searchPeriod ||
                                                                    undefined,
                                                                month:
                                                                    filterMonth ||
                                                                    undefined,
                                                                year:
                                                                    filterYear ||
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
                                                    payslips.current_page ===
                                                    payslips.last_page
                                                }
                                                onClick={() =>
                                                    router.get(
                                                        `/payslips?page=${payslips.current_page + 1}`,
                                                        {
                                                            period:
                                                                searchPeriod ||
                                                                undefined,
                                                            month:
                                                                filterMonth ||
                                                                undefined,
                                                            year:
                                                                filterYear ||
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
