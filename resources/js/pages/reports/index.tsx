import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Head, router } from '@inertiajs/react';
import { Download, Filter, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Payslip {
    id: number;
    employee_id: number;
    basic_pay: number;
    allowance: number;
    other_pay: number;
    incentives: number;
    overtime_pay: number;
    night_diff_pay: number;
    holiday_pay: number;
    restday_pay: number;
    gross_pay: number;
    sss_deduction: number;
    phic_deduction: number;
    hdmf_deduction: number;
    tax_deduction: number;
    late_deduction: number;
    absence_deduction: number;
    loan_deductions: Record<string, number>;
    total_deductions: number;
    net_pay: number;
    hours_worked: number;
    days_worked: number;
    late_minutes: number;
    absent_days: number;
    leave_days_used: number;
    overtime_hours: number;
    night_diff_hours: number;
    payroll_period: string;
    month: string;
    year: number;
    employee: {
        id: number;
        employee_id: string;
        first_name: string;
        last_name: string;
        department: string;
        status: string;
        tin: string;
        nationality: string;
    };
}

interface Props {
    payslips: { data: Payslip[]; links: any; meta: any };
    filters: Record<string, any>;
    months: string[];
    years: number[];
}

const COLUMN_GROUPS = {
    personal: {
        label: 'Personal Information',
        columns: [
            { key: 'employee_name', label: 'Full Name' },
            { key: 'status', label: 'Status' },
            { key: 'tin', label: 'TIN' },
            { key: 'nationality', label: 'Nationality' },
        ],
    },
    period: {
        label: 'Period Information',
        columns: [
            { key: 'payroll_period', label: 'Payroll Period' },
            { key: 'month', label: 'Month' },
            { key: 'year', label: 'Year' },
        ],
    },
    earnings: {
        label: 'Earnings',
        columns: [
            { key: 'basic_pay', label: 'Basic Pay' },
            { key: 'allowance', label: 'Allowance' },
            { key: 'other_pay', label: 'Other Pay' },
            { key: 'incentives', label: 'Incentives' },
            { key: 'overtime_pay', label: 'Overtime Pay' },
            { key: 'night_diff_pay', label: 'Night Differential' },
            { key: 'holiday_pay', label: 'Holiday Pay' },
            { key: 'restday_pay', label: 'Rest Day Pay' },
            { key: 'gross_pay', label: 'Gross Pay' },
        ],
    },
    deductions: {
        label: 'Deductions',
        columns: [
            { key: 'sss_deduction', label: 'SSS Deduction' },
            { key: 'phic_deduction', label: 'PhilHealth Deduction' },
            { key: 'hdmf_deduction', label: 'HDMF Deduction' },
            { key: 'tax_deduction', label: 'Tax Deduction' },
            { key: 'late_deduction', label: 'Late Deduction' },
            { key: 'absence_deduction', label: 'Absence Deduction' },
            { key: 'loan_deductions', label: 'Loan Deductions' },
            { key: 'total_deductions', label: 'Total Deductions' },
        ],
    },
    summary: {
        label: 'Summary',
        columns: [
            { key: 'net_pay', label: 'Net Pay' },
            { key: 'thirteenth_month_pay', label: '13th Month Pay' },
        ],
    },
};

export default function ReportsIndex({
    payslips,
    filters,
    months,
    years,
}: Props) {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([
        'employee_name',
        'status',
        'tin',
        'nationality',
        'payroll_period',
        'month',
        'year',
        'gross_pay',
        'total_deductions',
        'net_pay',
        'thirteenth_month_pay',
    ]);

    const [filterValues, setFilterValues] = useState(filters);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedDataCategories, setSelectedDataCategories] = useState<
        string[]
    >(['personal', 'period', 'earnings', 'deductions', 'summary']);

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filterValues, [key]: value };
        if (!value || (key === 'month' && value === 'all')) {
            delete newFilters[key];
        }
        setFilterValues(newFilters);
        router.get('/reports', newFilters, { preserveScroll: true });
    };

    const handleClearFilters = () => {
        setFilterValues({});
        router.get('/reports', {}, { preserveScroll: true });
    };

    const handleCategoryToggle = (categoryKey: string) => {
        setSelectedDataCategories((prev) =>
            prev.includes(categoryKey)
                ? prev.filter((c) => c !== categoryKey)
                : [...prev, categoryKey],
        );
    };

    const handleExport = () => {
        if (displayedColumns.length === 0) {
            toast.error('Please select at least one column to export');
            return;
        }

        setIsExporting(true);

        // Build query string
        const params = new URLSearchParams();
        displayedColumns.forEach((column) => {
            params.append('columns[]', column);
        });
        Object.entries(filterValues).forEach(([key, value]) => {
            params.append(key, value as string);
        });

        // Direct window navigation for file download
        window.location.href = `/reports/export?${params.toString()}`;

        // Reset after a delay
        setTimeout(() => {
            setIsExporting(false);
        }, 1000);
    };

    const filteredColumns = useMemo(() => {
        const filtered: string[] = [];
        selectedDataCategories.forEach((categoryKey) => {
            const category =
                COLUMN_GROUPS[categoryKey as keyof typeof COLUMN_GROUPS];
            if (category) {
                filtered.push(...category.columns.map((c) => c.key));
            }
        });
        return filtered;
    }, [selectedDataCategories]);

    // Update displayed columns when categories change
    const displayedColumns = useMemo(() => {
        return selectedColumns.filter((col) => filteredColumns.includes(col));
    }, [selectedColumns, filteredColumns]);

    const displayedPayslips = useMemo(() => {
        return payslips.data.map((payslip) => {
            const row: Record<string, any> = {};
            displayedColumns.forEach((col) => {
                switch (col) {
                    case 'employee_name':
                        row[col] =
                            `${payslip.employee.first_name} ${payslip.employee.last_name}`;
                        break;
                    case 'status':
                        row[col] = payslip.employee.status || 'N/A';
                        break;
                    case 'tin':
                        row[col] = payslip.employee.tin || 'N/A';
                        break;
                    case 'nationality':
                        row[col] = payslip.employee.nationality || 'N/A';
                        break;
                    case 'loan_deductions':
                        row[col] = payslip.loan_deductions?.total || 0;
                        break;
                    default:
                        row[col] = payslip[col as keyof Payslip];
                }
            });
            return row;
        });
    }, [payslips.data, displayedColumns]);

    const hasActiveFilters = Object.keys(filterValues).length > 0;
    const currencyFields = [
        'basic_pay',
        'allowance',
        'other_pay',
        'incentives',
        'overtime_pay',
        'night_diff_pay',
        'holiday_pay',
        'restday_pay',
        'gross_pay',
        'sss_deduction',
        'phic_deduction',
        'hdmf_deduction',
        'tax_deduction',
        'late_deduction',
        'absence_deduction',
        'loan_deductions',
        'total_deductions',
        'net_pay',
        'thirteenth_month_pay',
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/' },
                { title: 'Reports', href: '/reports' },
            ]}
        >
            <Head title="Payroll Reports" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Payroll Reports
                    </h1>
                    <p className="text-gray-600">
                        Generate and export payroll reports with custom
                        filtering
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Data Categories
                        </CardTitle>
                        <CardDescription>
                            Refine your report data and select which categories
                            to include
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="mb-3 text-sm font-semibold">
                                Payroll Filters
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="month">Month</Label>
                                    <Select
                                        value={
                                            filterValues.month?.toString() || ''
                                        }
                                        onValueChange={(value) =>
                                            handleFilterChange('month', value)
                                        }
                                    >
                                        <SelectTrigger id="month">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Months
                                            </SelectItem>
                                            {months.map((month) => (
                                                <SelectItem
                                                    key={month}
                                                    value={month.toString()}
                                                >
                                                    {month}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Select
                                        value={
                                            filterValues.year?.toString() || ''
                                        }
                                        onValueChange={(value) =>
                                            handleFilterChange('year', value)
                                        }
                                    >
                                        <SelectTrigger id="year">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
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
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="mb-3 text-sm font-semibold">
                                Data Categories
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {Object.entries(COLUMN_GROUPS).map(
                                    ([categoryKey, category]) => (
                                        <div
                                            key={categoryKey}
                                            className="flex items-center space-x-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                                        >
                                            <Checkbox
                                                id={`category-${categoryKey}`}
                                                checked={selectedDataCategories.includes(
                                                    categoryKey,
                                                )}
                                                onCheckedChange={() =>
                                                    handleCategoryToggle(
                                                        categoryKey,
                                                    )
                                                }
                                            />
                                            <label
                                                htmlFor={`category-${categoryKey}`}
                                                className="flex-1 cursor-pointer text-sm font-medium"
                                                onClick={() =>
                                                    handleCategoryToggle(
                                                        categoryKey,
                                                    )
                                                }
                                            >
                                                {category.label}
                                            </label>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || displayedColumns.length === 0}
                        className="gap-2"
                        size="lg"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export to Excel'}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Report Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payslips.data.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                No payslips found. Try adjusting your filters.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {displayedColumns.map((col) => {
                                                let label = col;
                                                Object.values(
                                                    COLUMN_GROUPS,
                                                ).forEach((group) => {
                                                    const found =
                                                        group.columns.find(
                                                            (c) =>
                                                                c.key === col,
                                                        );
                                                    if (found)
                                                        label = found.label;
                                                });
                                                return (
                                                    <TableHead
                                                        key={col}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {label}
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayedPayslips.map((row, idx) => (
                                            <TableRow key={idx}>
                                                {displayedColumns.map((col) => (
                                                    <TableCell
                                                        key={`${idx}-${col}`}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {typeof row[col] ===
                                                            'number' &&
                                                        currencyFields.includes(
                                                            col,
                                                        ) ? (
                                                            <span className="font-mono">
                                                                ₱
                                                                {Number(
                                                                    row[col],
                                                                ).toLocaleString(
                                                                    'en-US',
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    },
                                                                )}
                                                            </span>
                                                        ) : (
                                                            row[col]
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {payslips.meta && payslips.meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Page {payslips.meta.current_page} of{' '}
                            {payslips.meta.last_page}
                        </p>
                        <div className="flex gap-2">
                            {payslips.links &&
                                payslips.links.map((link: any, idx: number) => (
                                    <Button
                                        key={idx}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
