import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { canEdit } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Schedule {
    id: number;
    year: number;
    first_half_start: number;
    first_half_end: string;
    second_half_start: number;
    second_half_end: string;
    regular_start: string | null;
    regular_end: string | null;
    night_start: string | null;
    night_end: string | null;
}

interface Props {
    schedules: Schedule[];
    currentYear: number;
}

export default function ScheduleIndex({ schedules, currentYear }: Props) {
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1,
    );
    const [isEditMode, setIsEditMode] = useState(false);

    // Only one schedule exists (the latest one)
    const currentSchedule = schedules[0];

    const form = useForm({
        year: currentSchedule?.year || new Date().getFullYear(),
        first_half_start: currentSchedule?.first_half_start || 1,
        first_half_end: String(currentSchedule?.first_half_end || '15'),
        second_half_start: currentSchedule?.second_half_start || 16,
        second_half_end: String(currentSchedule?.second_half_end || 'end'),
        regular_start: currentSchedule?.regular_start || '06:00',
        regular_end: currentSchedule?.regular_end || '22:00',
        night_start: currentSchedule?.night_start || '22:00',
        night_end: currentSchedule?.night_end || '06:00',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Schedule',
            href: '/schedule',
        },
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

    const daysInMonth = (month: number, year: number) => {
        return new Date(year, month, 0).getDate();
    };

    const firstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month - 1, 1).getDay();
    };

    const generateCalendarDays = () => {
        const days = [];
        const year = new Date().getFullYear();
        const firstDay = firstDayOfMonth(selectedMonth, year);
        const totalDays = daysInMonth(selectedMonth, year);

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }

        return days;
    };

    const isInFirstCutoff = (day: number) => {
        const start = form.data.first_half_start;
        const end =
            form.data.first_half_end === 'end'
                ? 31
                : parseInt(form.data.first_half_end);

        // 1st period does NOT support cross-month
        return day >= start && day <= end;
    };

    const isInSecondCutoff = (day: number) => {
        const start = form.data.second_half_start;
        const end =
            form.data.second_half_end === 'end'
                ? 31
                : parseInt(form.data.second_half_end);

        // 2nd period supports cross-month (e.g., 21-5 wraps into next month)
        if (start > end) {
            return day >= start || day <= end;
        }
        return day >= start && day <= end;
    };

    const validateSchedule = () => {
        const errors = [];

        if (
            !form.data.first_half_start ||
            form.data.first_half_start < 1 ||
            form.data.first_half_start > 31
        ) {
            errors.push('1st Start must be between 1 and 31');
        }

        if (
            !form.data.second_half_start ||
            form.data.second_half_start < 1 ||
            form.data.second_half_start > 31
        ) {
            errors.push('2nd Start must be between 1 and 31');
        }

        const firstEnd =
            form.data.first_half_end === 'end'
                ? 31
                : parseInt(form.data.first_half_end);
        const secondStart = form.data.second_half_start;
        const secondEnd =
            form.data.second_half_end === 'end'
                ? 31
                : parseInt(form.data.second_half_end);

        // 1st period validation: start <= end (no cross-month for 1st)
        if (
            form.data.first_half_start > firstEnd &&
            form.data.first_half_end !== 'end'
        ) {
            errors.push(
                '1st Start cannot be greater than 1st End (1st period cannot cross months)',
            );
        }

        // 2nd period can be cross-month (e.g., 21-5) or same-month
        // No validation needed for cross-month as it's allowed

        if (!form.data.regular_start || !form.data.regular_end) {
            errors.push('Regular shift times are required');
        }

        if (!form.data.night_start || !form.data.night_end) {
            errors.push('Night shift times are required');
        }

        return errors;
    };

    const handleSave = () => {
        const errors = validateSchedule();

        if (errors.length > 0) {
            errors.forEach((error) => toast.error(error));
            return;
        }

        if (currentSchedule) {
            form.put(`/schedule/${currentSchedule.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Schedule updated successfully');
                    setIsEditMode(false);
                },
                onError: () => {
                    toast.error('Failed to update schedule');
                },
            });
        } else {
            form.post('/schedule', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Schedule created successfully');
                    setIsEditMode(false);
                },
                onError: () => {
                    toast.error('Failed to create schedule');
                },
            });
        }
    };

    const handleCancel = () => {
        form.reset();
        setIsEditMode(false);
    };

    const calendarDays = generateCalendarDays();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Work Schedule" />
            <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Work Schedule
                        </h1>
                        <p className="text-muted-foreground">
                            Manage payroll cutoff dates and work shift times
                        </p>
                    </div>
                    {/* {!isEditMode && canEdit('settings') ? (
                        <Button onClick={() => setIsEditMode(true)}>
                            Edit
                        </Button>
                    ) : isEditMode ? (
                        <div className="flex gap-2">
                            <Button onClick={handleSave}>Save Changes</Button>
                            <Button onClick={handleCancel} variant="outline">
                                Cancel
                            </Button>
                        </div>
                    ) : null} */}
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Calendar Section */}
                    <Card className="flex h-full flex-col lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Work Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col space-y-4 overflow-hidden">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedMonth === 1) {
                                            setSelectedMonth(12);
                                        } else {
                                            setSelectedMonth(selectedMonth - 1);
                                        }
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Prev
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Select
                                        value={String(selectedMonth)}
                                        onValueChange={(v) =>
                                            setSelectedMonth(parseInt(v))
                                        }
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((m, i) => (
                                                <SelectItem
                                                    key={i}
                                                    value={String(i + 1)}
                                                >
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedMonth === 12) {
                                            setSelectedMonth(1);
                                        } else {
                                            setSelectedMonth(selectedMonth + 1);
                                        }
                                    }}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <div className="grid grid-cols-7 gap-1">
                                    {[
                                        'Sun',
                                        'Mon',
                                        'Tue',
                                        'Wed',
                                        'Thu',
                                        'Fri',
                                        'Sat',
                                    ].map((day) => (
                                        <div
                                            key={day}
                                            className="py-2 text-center text-sm font-semibold"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((day, idx) => {
                                            const inFirstCutoff = day
                                                ? isInFirstCutoff(day)
                                                : false;
                                            const inSecondCutoff = day
                                                ? isInSecondCutoff(day)
                                                : false;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex h-12 flex-col items-center justify-center rounded border text-sm font-medium transition-colors ${
                                                        !day
                                                            ? 'bg-muted'
                                                            : inFirstCutoff
                                                              ? 'border-blue-600 bg-blue-500 text-white'
                                                              : inSecondCutoff
                                                                ? 'border-blue-900 bg-blue-800 text-white'
                                                                : 'border-gray-200 bg-background'
                                                    }`}
                                                    title={
                                                        inFirstCutoff
                                                            ? '1st Cutoff'
                                                            : inSecondCutoff
                                                              ? '2nd Cutoff'
                                                              : ''
                                                    }
                                                >
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings Section */}
                    <Card className="flex h-full flex-col overflow-hidden">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                <CardTitle>Work Settings</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-6">
                            {isEditMode ? (
                                <>
                                    {/* Work Period Dates */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    1st Start
                                                </Label>
                                                <Select
                                                    value={String(
                                                        form.data
                                                            .first_half_start,
                                                    )}
                                                    onValueChange={(v) =>
                                                        form.setData(
                                                            'first_half_start',
                                                            parseInt(v),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(
                                                            { length: 31 },
                                                            (_, i) => i + 1,
                                                        ).map((d) => (
                                                            <SelectItem
                                                                key={d}
                                                                value={String(
                                                                    d,
                                                                )}
                                                            >
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    1st End
                                                </Label>
                                                <Select
                                                    value={
                                                        form.data.first_half_end
                                                    }
                                                    onValueChange={(v) =>
                                                        form.setData(
                                                            'first_half_end',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(
                                                            { length: 31 },
                                                            (_, i) => i + 1,
                                                        ).map((d) => (
                                                            <SelectItem
                                                                key={d}
                                                                value={String(
                                                                    d,
                                                                )}
                                                            >
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="end">
                                                            End
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    2nd Start
                                                </Label>
                                                <Select
                                                    value={String(
                                                        form.data
                                                            .second_half_start,
                                                    )}
                                                    onValueChange={(v) =>
                                                        form.setData(
                                                            'second_half_start',
                                                            parseInt(v),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(
                                                            { length: 31 },
                                                            (_, i) => i + 1,
                                                        ).map((d) => (
                                                            <SelectItem
                                                                key={d}
                                                                value={String(
                                                                    d,
                                                                )}
                                                            >
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    2nd End
                                                </Label>
                                                <Select
                                                    value={
                                                        form.data
                                                            .second_half_end
                                                    }
                                                    onValueChange={(v) =>
                                                        form.setData(
                                                            'second_half_end',
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(
                                                            { length: 31 },
                                                            (_, i) => i + 1,
                                                        ).map((d) => (
                                                            <SelectItem
                                                                key={d}
                                                                value={String(
                                                                    d,
                                                                )}
                                                            >
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="end">
                                                            End
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Work Times */}
                                    <div className="space-y-4 border-t pt-4">
                                        <h4 className="text-sm font-semibold">
                                            Work Times
                                        </h4>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    Regular Start
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={
                                                        form.data
                                                            .regular_start || ''
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'regular_start',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    Regular End
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={
                                                        form.data.regular_end ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'regular_end',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    Night Start
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={
                                                        form.data.night_start ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'night_start',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">
                                                    Night End
                                                </Label>
                                                <Input
                                                    type="time"
                                                    value={
                                                        form.data.night_end ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'night_end',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action Buttons
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            onClick={handleSave}
                                            className="flex-1"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            onClick={handleCancel}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div> */}
                                </>
                            ) : (
                                <>
                                    {/* View Mode */}
                                    <div className="space-y-6">
                                        <div className="grid gap-4 rounded-lg border p-4">
                                            <h4 className="flex items-center gap-2 font-semibold text-primary">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                                                    1
                                                </span>
                                                Work Periods
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="rounded-md bg-muted/50 p-3">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                                        1st Cutoff
                                                    </span>
                                                    <div className="mt-1 text-lg font-bold">
                                                        {
                                                            form.data
                                                                .first_half_start
                                                        }{' '}
                                                        -{' '}
                                                        {
                                                            form.data
                                                                .first_half_end
                                                        }
                                                    </div>
                                                </div>
                                                <div className="rounded-md bg-muted/50 p-3">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                                        2nd Cutoff
                                                    </span>
                                                    <div className="mt-1 text-lg font-bold">
                                                        {
                                                            form.data
                                                                .second_half_start
                                                        }{' '}
                                                        -{' '}
                                                        {
                                                            form.data
                                                                .second_half_end
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 rounded-lg border p-4">
                                            <h4 className="flex items-center gap-2 font-semibold text-primary">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">
                                                    2
                                                </span>
                                                Shift Schedule
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <span className="text-sm font-medium">
                                                        Regular Shift
                                                    </span>
                                                    <span className="font-mono text-sm">
                                                        {
                                                            form.data
                                                                .regular_start
                                                        }{' '}
                                                        -{' '}
                                                        {form.data.regular_end}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">
                                                        Night Shift
                                                    </span>
                                                    <span className="font-mono text-sm">
                                                        {form.data.night_start}{' '}
                                                        - {form.data.night_end}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
