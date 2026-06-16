import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    full_name: string;
    has_payslips: boolean;
}

interface Props {
    employees: Employee[];
}

export default function GenerateThirteenthMonthPay({ employees }: Props) {
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [fromMonth, setFromMonth] = useState<string>('1');
    const [fromYear, setFromYear] = useState<string>(
        new Date().getFullYear().toString(),
    );
    const [toMonth, setToMonth] = useState<string>('12');
    const [toYear, setToYear] = useState<string>(
        new Date().getFullYear().toString(),
    );
    const [isLoading, setIsLoading] = useState(false);

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from(
        { length: 10 },
        (_, i) => currentYear - i,
    ).sort((a, b) => a - b);

    const handleEmployeeToggle = (employeeId: number) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId],
        );
    };

    const handleSelectAll = () => {
        const eligibleEmployees = employees.filter((e) => e.has_payslips);
        if (selectedEmployees.length === eligibleEmployees.length) {
            // Deselect all
            setSelectedEmployees([]);
        } else {
            // Select all eligible
            setSelectedEmployees(eligibleEmployees.map((emp) => emp.id));
        }
    };

    const handleGenerate = async () => {
        if (selectedEmployees.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        if (!fromMonth || !fromYear || !toMonth || !toYear) {
            toast.error('Please select date range');
            return;
        }

        setIsLoading(true);

        router.post(
            '/thirteenth-month-pay/generate',
            {
                employee_ids: selectedEmployees,
                from_month: parseInt(fromMonth),
                from_year: parseInt(fromYear),
                to_month: parseInt(toMonth),
                to_year: parseInt(toYear),
            },
            {
                onSuccess: () => {
                    toast.success('13th Month Pay generated successfully');
                    router.visit('/thirteenth-month-pay');
                },
                onFinish: () => {
                    setIsLoading(false);
                },
                onError: (errors: any) => {
                    console.error('Error:', errors);
                    toast.error('Failed to generate 13th Month Pay');
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Generate 13th Month Pay" />

            <div className="m-5 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get('/thirteenth-month-pay')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button> */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Generate 13th Month Pay
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Select employees and date range to generate 13th
                            month pay
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Date Range Card */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Date Range</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>From Month</Label>
                                <Select
                                    value={fromMonth}
                                    onValueChange={setFromMonth}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((month, idx) => (
                                            <SelectItem
                                                key={idx}
                                                value={String(idx + 1)}
                                            >
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>From Year</Label>
                                <Select
                                    value={fromYear}
                                    onValueChange={setFromYear}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map((year) => (
                                            <SelectItem
                                                key={year}
                                                value={String(year)}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-center py-2">
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="space-y-2">
                                <Label>To Month</Label>
                                <Select
                                    value={toMonth}
                                    onValueChange={setToMonth}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((month, idx) => (
                                            <SelectItem
                                                key={idx}
                                                value={String(idx + 1)}
                                            >
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>To Year</Label>
                                <Select
                                    value={toYear}
                                    onValueChange={setToYear}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map((year) => (
                                            <SelectItem
                                                key={year}
                                                value={String(year)}
                                            >
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                                <p className="font-semibold">Selected:</p>
                                <p>
                                    {months[parseInt(fromMonth) - 1]} {fromYear}{' '}
                                    to {months[parseInt(toMonth) - 1]} {toYear}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Selection Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>
                                Select Employees ({selectedEmployees.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {employees.length > 0 && (
                                <label className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 p-3">
                                    <input
                                        type="checkbox"
                                        checked={
                                            employees.filter(
                                                (e) => e.has_payslips,
                                            ).length > 0 &&
                                            selectedEmployees.length ===
                                                employees.filter(
                                                    (e) => e.has_payslips,
                                                ).length
                                        }
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-900">
                                            Select All Employees
                                        </p>
                                    </div>
                                </label>
                            )}
                            <div className="max-h-96 space-y-2 overflow-y-auto">
                                {employees.length === 0 ? (
                                    <p className="text-center text-muted-foreground">
                                        No employees found
                                    </p>
                                ) : (
                                    employees.map((employee) => {
                                        const displayName = `${employee.last_name}, ${employee.first_name}${
                                            employee.middle_name
                                                ? ` ${employee.middle_name}`
                                                : ''
                                        }`;
                                        return (
                                            <label
                                                key={employee.id}
                                                className={`flex items-center gap-3 rounded-lg border p-3 ${
                                                    !employee.has_payslips
                                                        ? 'cursor-not-allowed opacity-50'
                                                        : 'hover:bg-muted'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.includes(
                                                        employee.id,
                                                    )}
                                                    onChange={() =>
                                                        handleEmployeeToggle(
                                                            employee.id,
                                                        )
                                                    }
                                                    disabled={
                                                        !employee.has_payslips
                                                    }
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">
                                                            {displayName}
                                                        </p>
                                                        {!employee.has_payslips && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                                No Payslips
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            employee.employee_number
                                                        }
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.get('/thirteenth-month-pay')}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
