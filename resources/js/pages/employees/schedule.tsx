import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Download,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
}

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

interface EmployeeScheduleGroup {
    id: number;
    schedule_file_id: string;
    date_created: string;
    weeks: number;
    count: number;
}

interface PaginatedSchedules {
    data: EmployeeScheduleGroup[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    employee: Employee;
    schedules: PaginatedSchedules;
    archivedSchedules: PaginatedSchedules;
    mainSchedule: Schedule | null;
}

export default function EmployeeSchedule({
    employee,
    schedules,
    archivedSchedules,
    mainSchedule,
}: Props) {
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1,
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedWeeks, setSelectedWeeks] = useState(1);
    const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
    const [markAs, setMarkAs] = useState<'work' | 'rest'>('work');
    const [activePageActive, setActivePageActive] = useState(1);
    const [archivedPageActive, setArchivedPageActive] = useState(1);
    const [perPageActive, setPerPageActive] = useState('10');
    const [perPageArchived, setPerPageArchived] = useState('10');

    const form = useForm({
        weeks: 1,
        time_in: mainSchedule?.regular_start || '06:00',
        time_out: mainSchedule?.regular_end || '22:00',
        schedule_id: mainSchedule?.id || 0,
        days: [] as Array<{ date: string; type: string }>,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: '/employees' },
        { title: employee.full_name, href: `/employees/${employee.id}` },
        { title: 'Schedule', href: `/employees/${employee.id}/schedule` },
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
        const firstDay = firstDayOfMonth(selectedMonth, selectedYear);
        const totalDays = daysInMonth(selectedMonth, selectedYear);

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }

        return days;
    };

    const getDateString = (day: number) => {
        return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const handleDayClick = (day: number) => {
        const dateStr = getDateString(day);
        const newSelected = new Set(selectedDays);

        if (newSelected.has(dateStr)) {
            newSelected.delete(dateStr);
        } else {
            newSelected.add(dateStr);
        }

        setSelectedDays(newSelected);
    };

    const handleMarkDays = (type: 'work' | 'rest') => {
        setMarkAs(type);
    };

    const handleSave = () => {
        if (selectedDays.size === 0) {
            toast.error('Please select at least one day');
            return;
        }

        if (!form.data.time_in || !form.data.time_out) {
            toast.error('Please enter time in and time out');
            return;
        }

        const days = Array.from(selectedDays).map((date) => ({
            date,
            type: markAs,
        }));

        form.setData({
            ...form.data,
            weeks: selectedWeeks,
            days,
        });

        form.post(`/employees/${employee.id}/schedule`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Schedule created successfully');
                setShowModal(false);
                setSelectedDays(new Set());
                form.reset();
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Failed to create schedule');
            },
        });
    };

    const handleArchive = (scheduleFileId: string) => {
        if (!confirm('Are you sure you want to archive this schedule?')) return;

        router.post(
            `/employees/${employee.id}/schedule/${scheduleFileId}/archive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Schedule archived successfully');
                },
                onError: () => {
                    toast.error('Failed to archive schedule');
                },
            },
        );
    };

    const handleRestore = (scheduleFileId: string) => {
        if (!confirm('Are you sure you want to restore this schedule?')) return;

        router.post(
            `/employees/${employee.id}/schedule/${scheduleFileId}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Schedule restored successfully');
                },
                onError: () => {
                    toast.error('Failed to restore schedule');
                },
            },
        );
    };

    const handleDelete = (scheduleFileId: string) => {
        if (
            !confirm(
                'Are you sure you want to permanently delete this schedule? This action cannot be undone.',
            )
        )
            return;

        router.delete(`/employees/${employee.id}/schedule/${scheduleFileId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Schedule deleted permanently');
            },
            onError: () => {
                toast.error('Failed to delete schedule');
            },
        });
    };

    const handleDownload = (scheduleFileId: string) => {
        window.location.href = `/employees/${employee.id}/schedule/${scheduleFileId}/download`;
    };

    const calendarDays = generateCalendarDays();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.full_name} - Schedule`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={`/employees/${employee.id}`}>
                                <Button variant="outline" size="sm">
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                            <h1 className="text-2xl font-bold">
                                {employee.employee_number} |{' '}
                                {employee.full_name}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" className="rounded-b-none">
                            Information
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        className="rounded-b-none border-b-2 border-primary"
                    >
                        Schedule
                    </Button>
                    <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" className="rounded-b-none">
                            Deduction
                        </Button>
                    </Link>
                    <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" className="rounded-b-none">
                            Leave
                        </Button>
                    </Link>
                    <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" className="rounded-b-none">
                            Payslip
                        </Button>
                    </Link>
                </div>

                {/* Schedule Tabs */}
                <div className="flex gap-2 border-b">
                    <Button
                        variant={activeTab === 'active' ? 'default' : 'ghost'}
                        className={
                            activeTab === 'active'
                                ? 'rounded-b-none border-b-2 border-primary'
                                : 'rounded-b-none'
                        }
                        onClick={() => setActiveTab('active')}
                    >
                        Active Schedules
                    </Button>
                    <Button
                        variant={activeTab === 'archived' ? 'default' : 'ghost'}
                        className={
                            activeTab === 'archived'
                                ? 'rounded-b-none border-b-2 border-primary'
                                : 'rounded-b-none'
                        }
                        onClick={() => setActiveTab('archived')}
                    >
                        Archived Schedules
                    </Button>
                </div>

                {/* Schedule Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle>
                            {activeTab === 'active'
                                ? 'Active Schedules'
                                : 'Archived Schedules'}
                        </CardTitle>
                        {activeTab === 'active' && (
                            <Button onClick={() => setShowModal(true)}>
                                + Add Schedule
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {activeTab === 'active' ? (
                            schedules.data.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground">
                                    No active schedules found
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>
                                                    Date Created
                                                </TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {schedules.data.map(
                                                (
                                                    schedule: EmployeeScheduleGroup,
                                                    idx: number,
                                                ) => (
                                                    <TableRow
                                                        key={
                                                            schedule.schedule_file_id
                                                        }
                                                    >
                                                        <TableCell>
                                                            {(activePageActive -
                                                                1) *
                                                                parseInt(
                                                                    perPageActive,
                                                                ) +
                                                                idx +
                                                                1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {
                                                                schedule.date_created
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleDownload(
                                                                            schedule.schedule_file_id,
                                                                        )
                                                                    }
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                    Download
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleArchive(
                                                                            schedule.schedule_file_id,
                                                                        )
                                                                    }
                                                                >
                                                                    <Archive className="h-4 w-4" />
                                                                    Archive
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                    {schedules.last_page > 1 && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing{' '}
                                                    {schedules.data.length} of{' '}
                                                    {schedules.total} schedules
                                                </p>
                                                <Select
                                                    value={perPageActive}
                                                    onValueChange={
                                                        setPerPageActive
                                                    }
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
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        activePageActive === 1
                                                    }
                                                    onClick={() =>
                                                        setActivePageActive(
                                                            activePageActive -
                                                                1,
                                                        )
                                                    }
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                {Array.from(
                                                    {
                                                        length: schedules.last_page,
                                                    },
                                                    (_, i) => i + 1,
                                                ).map((page) => (
                                                    <Button
                                                        key={page}
                                                        variant={
                                                            page ===
                                                            activePageActive
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        size="sm"
                                                        onClick={() =>
                                                            setActivePageActive(
                                                                page,
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
                                                        activePageActive ===
                                                        schedules.last_page
                                                    }
                                                    onClick={() =>
                                                        setActivePageActive(
                                                            activePageActive +
                                                                1,
                                                        )
                                                    }
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : archivedSchedules.data.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                No archived schedules found
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Date Created</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archivedSchedules.data.map(
                                            (
                                                schedule: EmployeeScheduleGroup,
                                                idx: number,
                                            ) => (
                                                <TableRow
                                                    key={
                                                        schedule.schedule_file_id
                                                    }
                                                >
                                                    <TableCell>
                                                        {(archivedPageActive -
                                                            1) *
                                                            parseInt(
                                                                perPageArchived,
                                                            ) +
                                                            idx +
                                                            1}
                                                    </TableCell>
                                                    <TableCell>
                                                        {schedule.date_created}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleRestore(
                                                                        schedule.schedule_file_id,
                                                                    )
                                                                }
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                                Restore
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        schedule.schedule_file_id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                                {archivedSchedules.last_page > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm text-muted-foreground">
                                                Showing{' '}
                                                {archivedSchedules.data.length}{' '}
                                                of {archivedSchedules.total}{' '}
                                                schedules
                                            </p>
                                            <Select
                                                value={perPageArchived}
                                                onValueChange={
                                                    setPerPageArchived
                                                }
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
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    archivedPageActive === 1
                                                }
                                                onClick={() =>
                                                    setArchivedPageActive(
                                                        archivedPageActive - 1,
                                                    )
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            {Array.from(
                                                {
                                                    length: archivedSchedules.last_page,
                                                },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page ===
                                                        archivedPageActive
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        setArchivedPageActive(
                                                            page,
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
                                                    archivedPageActive ===
                                                    archivedSchedules.last_page
                                                }
                                                onClick={() =>
                                                    setArchivedPageActive(
                                                        archivedPageActive + 1,
                                                    )
                                                }
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Schedule Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Schedule</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pr-4">
                        {/* Time In/Out */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Time In</Label>
                                <Input
                                    type="time"
                                    value={form.data.time_in}
                                    onChange={(e) =>
                                        form.setData('time_in', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time Out</Label>
                                <Input
                                    type="time"
                                    value={form.data.time_out}
                                    onChange={(e) =>
                                        form.setData('time_out', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Mark Days As */}
                        <div className="space-y-2">
                            <Label>Mark Days As:</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        markAs === 'work'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => handleMarkDays('work')}
                                >
                                    Working Day
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        markAs === 'rest'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => handleMarkDays('rest')}
                                >
                                    Rest Day
                                </Button>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedMonth === 1) {
                                            setSelectedMonth(12);
                                            setSelectedYear(selectedYear - 1);
                                        } else {
                                            setSelectedMonth(selectedMonth - 1);
                                        }
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
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

                                    <Select
                                        value={String(selectedYear)}
                                        onValueChange={(v) =>
                                            setSelectedYear(parseInt(v))
                                        }
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: 5 },
                                                (_, i) =>
                                                    new Date().getFullYear() +
                                                    i,
                                            ).map((y) => (
                                                <SelectItem
                                                    key={y}
                                                    value={String(y)}
                                                >
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedMonth === 12) {
                                            setSelectedMonth(1);
                                            setSelectedYear(selectedYear + 1);
                                        } else {
                                            setSelectedMonth(selectedMonth + 1);
                                        }
                                    }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="space-y-1">
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
                                            className="rounded bg-muted py-2 text-center text-xs font-semibold"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day, idx) => {
                                        const dateStr = day
                                            ? getDateString(day)
                                            : '';
                                        const isSelected =
                                            selectedDays.has(dateStr);

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    day && handleDayClick(day)
                                                }
                                                disabled={!day}
                                                className={`aspect-square rounded border text-sm font-medium transition-colors ${
                                                    !day
                                                        ? 'bg-muted'
                                                        : isSelected
                                                          ? markAs === 'work'
                                                              ? 'border-blue-700 bg-blue-600 text-white'
                                                              : 'border-gray-700 bg-gray-600 text-white'
                                                          : 'bg-background hover:bg-gray-100'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Select up to 7 days (based on weeks).
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedDays(new Set());
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSave}>
                                Save Schedule
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
