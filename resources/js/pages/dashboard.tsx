import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useRole } from '@/lib/auth';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ChevronDown,
    DollarSign,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface GenderData {
    name: string;
    count: number;
}

interface OnTimeData {
    month: string;
    percentage: number;
    count: number;
}

interface LateReportData {
    month: string;
    lateCount: number;
    onTimeCount: number;
    total: number;
}

interface PayslipReportData {
    month: string;
    totalReleased: number;
    totalDeductions: number;
    count: number;
}

interface BestEmployeeData {
    name: string;
    employee_id: string;
    lateMinutes: number;
}

interface DepartmentGenderData {
    [gender: string]: {
        gender: string;
        count: number;
    };
}

interface Props {
    totalEmployees: number;
    employeesByGender: GenderData[];
    employeesByDepartmentAndGender: Record<string, DepartmentGenderData>;
    onTimePercentageByMonth: OnTimeData[];
    lateReportByMonth: LateReportData[];
    payslipReportByMonth: PayslipReportData[];
    selectedYear: number;
    yearOptions: number[];
    bestEmployee: BestEmployeeData | null;
    totalPayslipsCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({
    totalEmployees = 0,
    employeesByGender = [],
    employeesByDepartmentAndGender = {},
    onTimePercentageByMonth = [],
    lateReportByMonth = [],
    payslipReportByMonth = [],
    selectedYear = new Date().getFullYear(),
    yearOptions = [],
    bestEmployee = null,
    totalPayslipsCount = 0,
}: Props) {
    const role = useRole();
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState(selectedYear.toString());

    // Handle year change
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                `/dashboard?year=${filterYear}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [filterYear]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    // Calculate average on-time percentage
    const avgOnTimePercentage =
        onTimePercentageByMonth.length > 0
            ? Math.round(
                  onTimePercentageByMonth.reduce(
                      (sum, item) => sum + item.percentage,
                      0,
                  ) / onTimePercentageByMonth.length,
              )
            : 0;

    // Calculate total late count
    const totalLateCount = lateReportByMonth.reduce(
        (sum, item) => sum + item.lateCount,
        0,
    );

    // Calculate total money released
    const totalMoneyReleased = payslipReportByMonth.reduce(
        (sum, item) => sum + item.totalReleased,
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-0">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Dashboard
                            </h1>
                            <p className="text-muted-foreground">
                                Year {filterYear}
                            </p>
                        </div>
                        <div className="w-[200px]">
                            <Select
                                value={filterYear}
                                onValueChange={setFilterYear}
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
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
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto px-4 py-6">
                    {/* Main Cards - Row 1 */}
                    <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {/* Card 1: Total Employees */}
                        <Card
                            className="cursor-pointer transition-all hover:shadow-lg"
                            onClick={() =>
                                setExpandedCard(
                                    expandedCard === 'employees'
                                        ? null
                                        : 'employees',
                                )
                            }
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                        Total Employees
                                    </CardTitle>
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {totalEmployees}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Click to view gender distribution
                                </p>
                                <div className="mt-3 flex items-center gap-1 text-xs">
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                            expandedCard === 'employees'
                                                ? 'rotate-180'
                                                : ''
                                        }`}
                                    />
                                    {expandedCard === 'employees'
                                        ? 'Hide'
                                        : 'Show'}{' '}
                                    details
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 2: On Time Percentage */}
                        <Card
                            className="cursor-pointer transition-all hover:shadow-lg"
                            onClick={() =>
                                setExpandedCard(
                                    expandedCard === 'ontime' ? null : 'ontime',
                                )
                            }
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                        On Time Percentage
                                    </CardTitle>
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {avgOnTimePercentage}%
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Average across all months
                                </p>
                                <div className="mt-3 flex items-center gap-1 text-xs">
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                            expandedCard === 'ontime'
                                                ? 'rotate-180'
                                                : ''
                                        }`}
                                    />
                                    {expandedCard === 'ontime'
                                        ? 'Hide'
                                        : 'Show'}{' '}
                                    chart
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 3: Late Report */}
                        <Card
                            className="cursor-pointer transition-all hover:shadow-lg"
                            onClick={() =>
                                setExpandedCard(
                                    expandedCard === 'late' ? null : 'late',
                                )
                            }
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium">
                                        Late Report
                                    </CardTitle>
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {totalLateCount}%
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Total late records
                                </p>
                                <div className="mt-3 flex items-center gap-1 text-xs">
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                            expandedCard === 'late'
                                                ? 'rotate-180'
                                                : ''
                                        }`}
                                    />
                                    {expandedCard === 'late' ? 'Hide' : 'Show'}{' '}
                                    chart
                                </div>
                            </CardContent>
                        </Card>

                        {role !== 'hr' && (
                            <>
                                {/* Card 4: Payslip Report (Net Pay) */}
                                <Card
                                    className="cursor-pointer transition-all hover:shadow-lg"
                                    onClick={() =>
                                        setExpandedCard(
                                            expandedCard === 'payslip'
                                                ? null
                                                : 'payslip',
                                        )
                                    }
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">
                                                Payslip Report
                                            </CardTitle>
                                            <DollarSign className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {
                                                formatCurrency(
                                                    totalMoneyReleased,
                                                ).split('.')[0]
                                            }
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Total net pay
                                        </p>
                                        <div className="mt-3 flex items-center gap-1 text-xs">
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform ${
                                                    expandedCard === 'payslip'
                                                        ? 'rotate-180'
                                                        : ''
                                                }`}
                                            />
                                            {expandedCard === 'payslip'
                                                ? 'Hide'
                                                : 'Show'}{' '}
                                            chart
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card 5: Total Payslips */}
                                <Card
                                    className="cursor-pointer transition-all hover:shadow-lg"
                                    onClick={() =>
                                        setExpandedCard(
                                            expandedCard === 'payslips'
                                                ? null
                                                : 'payslips',
                                        )
                                    }
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium">
                                                Total Payslips
                                            </CardTitle>
                                            <DollarSign className="h-5 w-5 text-indigo-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {totalPayslipsCount}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Payslips generated
                                        </p>
                                        <div className="mt-3 flex items-center gap-1 text-xs">
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform ${
                                                    expandedCard === 'payslips'
                                                        ? 'rotate-180'
                                                        : ''
                                                }`}
                                            />
                                            {expandedCard === 'payslips'
                                                ? 'Hide'
                                                : 'Show'}{' '}
                                            chart
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    {/* Row 2: First Expanded Chart and Best Employee */}
                    <div className="mb-6 grid gap-4 lg:grid-cols-3">
                        {/* First Expanded Chart (spans 2 columns) */}
                        {expandedCard === 'employees' && (
                            <div className="lg:col-span-2">
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>
                                            Employee Distribution
                                        </CardTitle>
                                        <CardDescription>
                                            Gender breakdown by department
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* Gender Summary Cards */}
                                            <div className="grid gap-4 md:grid-cols-3">
                                                {employeesByGender.map(
                                                    (gender) => (
                                                        <div
                                                            key={gender.name}
                                                            className="rounded-lg border p-4"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        {
                                                                            gender.name
                                                                        }
                                                                    </p>
                                                                    <p className="mt-2 text-2xl font-bold">
                                                                        {
                                                                            gender.count
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="text-3xl">
                                                                    {gender.name.toLowerCase() ===
                                                                    'male'
                                                                        ? '👨'
                                                                        : '👩'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>

                                            {/* Department and Gender Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted/50">
                                                            <th className="px-4 py-3 text-left font-medium">
                                                                Department
                                                            </th>
                                                            <th className="px-4 py-3 text-center font-medium">
                                                                Male
                                                            </th>
                                                            <th className="px-4 py-3 text-center font-medium">
                                                                Female
                                                            </th>
                                                            <th className="px-4 py-3 text-center font-medium">
                                                                Total
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(
                                                            employeesByDepartmentAndGender,
                                                        ).map(
                                                            ([
                                                                department,
                                                                genderData,
                                                            ]) => {
                                                                const male =
                                                                    genderData[
                                                                        'Male'
                                                                    ]?.count ||
                                                                    0;
                                                                const female =
                                                                    genderData[
                                                                        'Female'
                                                                    ]?.count ||
                                                                    0;
                                                                const total =
                                                                    male +
                                                                    female;

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            department
                                                                        }
                                                                        className="border-b hover:bg-muted/50"
                                                                    >
                                                                        <td className="px-4 py-3 font-medium">
                                                                            {
                                                                                department
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {
                                                                                male
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {
                                                                                female
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center font-semibold">
                                                                            {
                                                                                total
                                                                            }
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {expandedCard === 'ontime' && (
                            <div className="lg:col-span-2">
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>
                                            On Time Percentage by Month
                                        </CardTitle>
                                        <CardDescription>
                                            Monthly on-time attendance rate for{' '}
                                            {filterYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px]">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={
                                                        onTimePercentageByMonth
                                                    }
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis domain={[0, 100]} />
                                                    <Tooltip
                                                        formatter={(
                                                            value: any,
                                                        ) => `${value}%`}
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="percentage"
                                                        fill="#10b981"
                                                        name="On Time %"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {expandedCard === 'late' && (
                            <div className="lg:col-span-2">
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>
                                            Late Report by Month
                                        </CardTitle>
                                        <CardDescription>
                                            Late vs On Time employees by month
                                            for {filterYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px]">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={lateReportByMonth}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="onTimeCount"
                                                        fill="#10b981"
                                                        name="On Time"
                                                    />
                                                    <Bar
                                                        dataKey="lateCount"
                                                        fill="#ef4444"
                                                        name="Late"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {role !== 'hr' && expandedCard === 'payslip' && (
                            <div className="lg:col-span-2">
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>
                                            Payroll Summary by Month
                                        </CardTitle>
                                        <CardDescription>
                                            Net pay and deductions for{' '}
                                            {filterYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px]">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={payslipReportByMonth}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip
                                                        formatter={(
                                                            value: any,
                                                        ) =>
                                                            formatCurrency(
                                                                value,
                                                            )
                                                        }
                                                    />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="totalReleased"
                                                        fill="#8b5cf6"
                                                        name="Net Pay"
                                                    />
                                                    <Bar
                                                        dataKey="totalDeductions"
                                                        fill="#ef4444"
                                                        name="Deductions"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {role !== 'hr' && expandedCard === 'payslips' && (
                            <div className="lg:col-span-2">
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>
                                            Payslips Generated by Month
                                        </CardTitle>
                                        <CardDescription>
                                            Number of payslips generated each
                                            month for {filterYear}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px]">
                                            <ResponsiveContainer
                                                width="100%"
                                                height="100%"
                                            >
                                                <BarChart
                                                    data={payslipReportByMonth}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="count"
                                                        fill="#6366f1"
                                                        name="Payslips Generated"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Best Employee Card - spans 1 column */}
                        {bestEmployee && (
                            <Card className="h-fit border-gray-200 bg-white">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🏆</span>
                                        <CardTitle className="text-sm font-semibold text-gray-800">
                                            Best Employee
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {bestEmployee.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {bestEmployee.employee_id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-medium text-green-600">
                                            <span>✓</span>
                                            {bestEmployee.lateMinutes === 0
                                                ? 'No late records'
                                                : `${bestEmployee.lateMinutes} min late`}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
