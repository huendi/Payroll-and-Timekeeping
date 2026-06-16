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
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface Attendance {
    id: number;
    employee_id: number;
    payroll_id: number;
    date: string;
    formatted_date?: string;
    clock_in: string | null;
    formatted_clock_in?: string;
    clock_out: string | null;
    formatted_clock_out?: string;
    hours_worked: string;
    overtime_hours: string;
    night_diff_hours: string;
    late_minutes: number;
    is_late: boolean;
    is_holiday: boolean;
    is_restday: boolean;
    remarks: string | null;
}

interface AttendancePayroll {
    id: number;
    payroll_period: string;
    month: string;
    year: number;
    count: number;
}

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
}

interface Props {
    employee: Employee;
    attendancePayroll: AttendancePayroll;
    attendances: Attendance[];
}

export default function AttendanceView({
    employee,
    attendancePayroll,
    attendances,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: '/employees' },
        {
            title: `${employee.first_name} ${employee.last_name}`,
            href: `/employees/${employee.id}`,
        },
        { title: 'Attendance', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Records" />

            <div className="m-5 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Attendance Records
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            {employee.first_name} {employee.last_name} •{' '}
                            {attendancePayroll.payroll_period} -{' '}
                            {attendancePayroll.month} {attendancePayroll.year}
                        </p>
                    </div>
                </div>

                {/* Attendance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Details</CardTitle>
                        <CardDescription>
                            Total records: {attendances.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attendances.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No attendance records found.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time In</TableHead>
                                            <TableHead>Time Out</TableHead>
                                            <TableHead>Hours</TableHead>
                                            <TableHead>OT</TableHead>
                                            <TableHead>Night Diff</TableHead>
                                            <TableHead>Late (mins)</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendances.map((attendance) => (
                                            <TableRow key={attendance.id}>
                                                <TableCell className="font-medium">
                                                    {attendance.formatted_date ||
                                                        new Date(
                                                            attendance.date,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                </TableCell>
                                                <TableCell>
                                                    {attendance.formatted_clock_in ||
                                                        attendance.clock_in ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {attendance.formatted_clock_out ||
                                                        attendance.clock_out ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(
                                                        attendance.hours_worked,
                                                    ).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(
                                                        attendance.overtime_hours,
                                                    ).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {parseFloat(
                                                        attendance.night_diff_hours,
                                                    ).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {Number(
                                                        attendance.late_minutes,
                                                    ) > 0 ? (
                                                        <span className="text-destructive">
                                                            {
                                                                attendance.late_minutes
                                                            }
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {attendance.is_holiday && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                Holiday
                                                            </Badge>
                                                        )}
                                                        {attendance.is_restday && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                Restday
                                                            </Badge>
                                                        )}
                                                        {!attendance.is_holiday &&
                                                            !attendance.is_restday && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Regular
                                                                </span>
                                                            )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                    {attendance.remarks || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
