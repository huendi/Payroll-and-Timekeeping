import { Alert, AlertDescription } from '@/components/ui/alert';
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
// RadioGroup component - using native radio inputs
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Info, Upload } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import { toast } from 'sonner';

interface Schedule {
    id: number;
    name: string;
    year: number;
}

interface Props {
    schedules: Schedule[];
}

export default function PayrollCreate({ schedules }: Props) {
    const { flash } = usePage().props as any;

    const { data, setData, post, processing, errors } = useForm({
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        payroll_period: '1st Half',
        apply_deductions: 'yes',
        excel_file: null as File | null,
    });

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
    }, [flash]);

    const breadcrumbs = [
        { title: 'Payroll', href: '/payroll' },
        { title: 'Generate Payroll', href: '/payroll/create' },
    ];

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

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/payroll');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generate Payroll" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Generate Payroll
                        </h1>
                        <p className="text-muted-foreground">
                            Upload DTR Excel file to generate payroll
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Payroll Information</CardTitle>
                                <CardDescription>
                                    Fill in the payroll period details and
                                    upload DTR
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {schedules.length === 0 && (
                                    <Alert className="mb-4">
                                        <AlertDescription>
                                            <strong>Error:</strong> No schedule
                                            found. Please create a schedule
                                            first in Schedule Management.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    {/* Month, Year, and Cutoff Period in one row */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {/* Month */}
                                        <div className="space-y-2">
                                            <Label>
                                                Month{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Select
                                                value={data.month}
                                                onValueChange={(value) =>
                                                    setData('month', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map((month) => (
                                                        <SelectItem
                                                            key={month}
                                                            value={month}
                                                        >
                                                            {month}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.month && (
                                                <p className="text-sm text-destructive">
                                                    {errors.month}
                                                </p>
                                            )}
                                        </div>

                                        {/* Year */}
                                        <div className="space-y-2">
                                            <Label>
                                                Year{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                type="number"
                                                min="2020"
                                                max="2030"
                                                value={data.year}
                                                onChange={(e) =>
                                                    setData(
                                                        'year',
                                                        parseInt(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                            />
                                            {errors.year && (
                                                <p className="text-sm text-destructive">
                                                    {errors.year}
                                                </p>
                                            )}
                                        </div>

                                        {/* Cutoff Period */}
                                        <div className="space-y-2">
                                            <Label>
                                                Cutoff Period{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </Label>
                                            <Select
                                                value={data.payroll_period}
                                                onValueChange={(value) =>
                                                    setData(
                                                        'payroll_period',
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1st Half">
                                                        1st Half (1-15)
                                                    </SelectItem>
                                                    <SelectItem value="2nd Half">
                                                        2nd Half (16-31)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.payroll_period && (
                                                <p className="text-sm text-destructive">
                                                    {errors.payroll_period}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Deduction Option */}
                                    <div className="space-y-2">
                                        <Label>
                                            Include Statutory Deductions?{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                <strong>
                                                    Statutory Deductions:
                                                </strong>{' '}
                                                SSS, PhilHealth, Pag-IBIG,
                                                Withholding Tax
                                                <br />
                                                <strong>Note:</strong> Late,
                                                Absence, and Loan deductions are{' '}
                                                <strong>always applied</strong>{' '}
                                                regardless of this setting.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="deduct_yes"
                                                    name="apply_deductions"
                                                    value="yes"
                                                    checked={
                                                        data.apply_deductions ===
                                                        'yes'
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'apply_deductions',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <Label
                                                    htmlFor="deduct_yes"
                                                    className="cursor-pointer font-normal"
                                                >
                                                    <strong>Yes</strong> - Apply
                                                    all statutory deductions
                                                    (usual for 2nd Half cutoff)
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    id="deduct_no"
                                                    name="apply_deductions"
                                                    value="no"
                                                    checked={
                                                        data.apply_deductions ===
                                                        'no'
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'apply_deductions',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <Label
                                                    htmlFor="deduct_no"
                                                    className="cursor-pointer font-normal"
                                                >
                                                    <strong>No</strong> - Skip
                                                    statutory deductions (usual
                                                    for 1st Half cutoff)
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Excel File Upload */}
                                    <div className="space-y-2">
                                        <Label>
                                            DTR Excel File{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex flex-1 overflow-hidden rounded-lg border border-black bg-white">
                                                <input
                                                    type="file"
                                                    accept=".xlsx,.xls"
                                                    onChange={(e) =>
                                                        setData(
                                                            'excel_file',
                                                            e.target
                                                                .files?.[0] ||
                                                                null,
                                                        )
                                                    }
                                                    className="absolute inset-0 cursor-pointer opacity-0"
                                                />
                                                <div className="flex w-full items-center">
                                                    <div className="bg-black px-6 py-[0.3rem] font-semibold whitespace-nowrap text-white">
                                                        Choose File
                                                    </div>
                                                    <div className="flex-1 px-4 py-[0.3rem] text-slate-500">
                                                        {data.excel_file
                                                            ? data.excel_file
                                                                  .name
                                                            : 'No file chosen'}
                                                    </div>
                                                </div>
                                            </div>
                                            <a
                                                href="/payroll/download-sample"
                                                target="_blank"
                                            >
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Template
                                                </Button>
                                            </a>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Upload the Daily Time Record (DTR)
                                            in Excel format.
                                            <strong>
                                                {' '}
                                                Don't have a template?
                                            </strong>{' '}
                                            Download the sample file above.
                                        </p>
                                        {errors.excel_file && (
                                            <p className="text-sm text-destructive">
                                                {errors.excel_file}
                                            </p>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Link href="/payroll">
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                schedules.length === 0
                                            }
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {processing
                                                ? 'Uploading...'
                                                : 'Generate Payroll'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Excel Format Guide */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Excel Format Guide
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="mb-1 font-semibold">
                                        Required Columns (9):
                                    </p>
                                    <ul className="space-y-1 text-xs">
                                        <li>
                                            • <strong>A:</strong> Employee
                                            Number
                                        </li>
                                        <li>
                                            • <strong>B:</strong> Name
                                        </li>
                                        <li>
                                            • <strong>C:</strong> Date
                                            (MM-DD-YYYY)
                                        </li>
                                        <li>
                                            • <strong>D:</strong> Time In
                                            (HH:MM)
                                        </li>
                                        <li>
                                            • <strong>E:</strong> Time Out
                                            (HH:MM)
                                        </li>
                                        <li>
                                            • <strong>F:</strong> Total Hours
                                            (auto)
                                        </li>
                                        <li>
                                            • <strong>G:</strong> OT Hours
                                            (auto)
                                        </li>
                                        <li>
                                            • <strong>H:</strong> OT Type
                                            (PAID/UNPAID)
                                        </li>
                                        <li>
                                            • <strong>I:</strong> Remarks
                                        </li>
                                    </ul>
                                </div>
                                <Alert>
                                    <AlertDescription className="text-xs">
                                        <strong>Important:</strong>
                                        <ul className="mt-1 space-y-1">
                                            <li>• Regular work = 9 hours</li>
                                            <li>
                                                • Columns F & G have formulas
                                            </li>
                                            <li>
                                                • Night shifts: single row
                                                format
                                            </li>
                                            <li>
                                                • OT TYPE required if OT &gt; 0
                                            </li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
