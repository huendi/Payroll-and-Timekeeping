import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { canEdit } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { CalendarIcon, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Holiday {
    id: number;
    date: string;
    name: string;
    type: string;
}

interface Props {
    holidays: Holiday[];
    hasHolidays: boolean;
}

export default function CalendarIndex({
    holidays: initialHolidays,
    hasHolidays,
}: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedType, setSelectedType] = useState<
        'Regular' | 'Special' | null
    >(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [holidayName, setHolidayName] = useState('');
    const [isEditMode, setIsEditMode] = useState(
        !hasHolidays && canEdit('settings'),
    );
    const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);

    const form = useForm({
        holidays: holidays,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Calendar',
            href: '/calendar',
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
        const days: Array<{ day: number | null; isCurrentMonth: boolean }> = [];
        const firstDay = firstDayOfMonth(currentMonth, currentYear);
        const totalDays = daysInMonth(currentMonth, currentYear);

        // Previous month's days
        const prevMonthDays = daysInMonth(
            currentMonth === 1 ? 12 : currentMonth - 1,
            currentMonth === 1 ? currentYear - 1 : currentYear,
        );
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, isCurrentMonth: false });
        }

        // Current month's days
        for (let i = 1; i <= totalDays; i++) {
            days.push({ day: i, isCurrentMonth: true });
        }

        // Next month's days (fill remaining grid cells)
        const remainingCells = 42 - days.length; // 6 rows × 7 days
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, isCurrentMonth: false });
        }

        return days;
    };

    const getDateString = (day: number) => {
        return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const isHoliday = (day: number) => {
        const dateStr = getDateString(day);
        const result = holidays.find((h) => {
            // Normalize the holiday date to YYYY-MM-DD format
            let holidayDate: string;

            if (typeof h.date === 'string') {
                // If it's already a string, just take the date part
                holidayDate = h.date.includes('T')
                    ? h.date.split('T')[0]
                    : h.date;
            } else {
                // Parse as date and handle timezone
                const dateObj = new Date(h.date as any);
                // Use local date to avoid timezone issues
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const date = String(dateObj.getDate()).padStart(2, '0');
                holidayDate = `${year}-${month}-${date}`;
            }

            const matches = holidayDate === dateStr;
            if (day === 1) {
                console.log(
                    `Holiday: ${h.name}, Raw date: ${h.date}, Parsed: ${holidayDate}, Calendar: ${dateStr}, Match: ${matches}`,
                );
            }
            return matches;
        });
        return result;
    };

    const handleDateClick = (day: number) => {
        if (!isEditMode || !selectedType) {
            toast.error('Please select Holiday or Special first');
            return;
        }

        const dateStr = getDateString(day);
        if (isHoliday(day)) {
            toast.error('This date is already added');
            return;
        }

        setSelectedDate(dateStr);
    };

    const handleAddHoliday = () => {
        if (!selectedDate || !selectedType || !holidayName.trim()) {
            toast.error('Please complete all fields');
            return;
        }

        const newHoliday: Holiday = {
            id: 0,
            date: selectedDate,
            name: holidayName,
            type: selectedType,
        };

        setHolidays([...holidays, newHoliday]);
        setHolidayName('');
        setSelectedDate(null);
        setSelectedType(null);
        toast.success('Holiday added');
    };

    const handleRemoveHoliday = (index: number) => {
        setHolidays(holidays.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!confirm('Are you sure you want to save all changes?')) return;

        router.post(
            '/calendar',
            { holidays },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    // Update holidays from the response
                    if (page.props.holidays) {
                        setHolidays(page.props.holidays);
                    }
                    toast.success('Holidays updated successfully');
                    setIsEditMode(false);
                },
                onError: () => {
                    toast.error('Failed to update holidays');
                },
            },
        );
    };

    const handleReset = () => {
        if (!confirm('Are you sure you want to reset all holidays?')) return;

        router.post(
            '/calendar/reset',
            {},
            {
                onSuccess: () => {
                    setHolidays([]);
                    toast.success('All holidays have been reset');
                },
            },
        );
    };

    const calendarDays = generateCalendarDays();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar Management" />
            <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Calendar Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage holidays and special dates
                        </p>
                    </div>
                    {canEdit('settings') && (
                        <Button
                            onClick={() => {
                                if (isEditMode) {
                                    handleSave();
                                } else {
                                    setIsEditMode(true);
                                }
                            }}
                        >
                            {isEditMode ? 'Save Changes' : 'Edit'}
                        </Button>
                    )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:overflow-x-auto">
                    {/* Calendar Section */}
                    <Card className="flex h-full min-w-0 flex-1 flex-col">
                        <CardHeader>
                            <CardTitle>Annual Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col space-y-4 overflow-x-auto">
                            {/* Month/Year Navigation */}
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (currentMonth === 1) {
                                            setCurrentMonth(12);
                                            setCurrentYear(currentYear - 1);
                                        } else {
                                            setCurrentMonth(currentMonth - 1);
                                        }
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <Select
                                    value={String(currentMonth)}
                                    onValueChange={(v) =>
                                        setCurrentMonth(parseInt(v))
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
                                    value={String(currentYear)}
                                    onValueChange={(v) =>
                                        setCurrentYear(parseInt(v))
                                    }
                                >
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from(
                                            { length: 11 },
                                            (_, i) => 2020 + i,
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

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (currentMonth === 12) {
                                            setCurrentMonth(1);
                                            setCurrentYear(currentYear + 1);
                                        } else {
                                            setCurrentMonth(currentMonth + 1);
                                        }
                                    }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>

                                <div className="ml-auto flex gap-2">
                                    <Button
                                        size="sm"
                                        className={
                                            selectedType === 'Regular'
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'border border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100'
                                        }
                                        onClick={() =>
                                            setSelectedType('Regular')
                                        }
                                        disabled={!isEditMode}
                                    >
                                        Regular
                                    </Button>
                                    <Button
                                        size="sm"
                                        className={
                                            selectedType === 'Special'
                                                ? 'border border-green-300 bg-green-600 text-white hover:bg-green-700'
                                                : 'border border-green-300 bg-green-50 text-green-900 hover:bg-green-100'
                                        }
                                        onClick={() =>
                                            setSelectedType('Special')
                                        }
                                        disabled={!isEditMode}
                                    >
                                        Special
                                    </Button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex flex-1 flex-col">
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

                                <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1">
                                    {calendarDays.map((dayObj, idx) => {
                                        const day = dayObj.day;
                                        const isCurrentMonth =
                                            dayObj.isCurrentMonth;
                                        const holiday =
                                            day && isCurrentMonth
                                                ? isHoliday(day)
                                                : null;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() =>
                                                    day &&
                                                    isCurrentMonth &&
                                                    handleDateClick(day)
                                                }
                                                disabled={
                                                    !isEditMode ||
                                                    !day ||
                                                    !isCurrentMonth
                                                }
                                                className={`flex flex-col items-center justify-center rounded border text-sm font-medium transition-colors ${
                                                    !day
                                                        ? 'bg-muted'
                                                        : !isCurrentMonth
                                                          ? 'text-gray-400 opacity-50 hover:opacity-60'
                                                          : holiday?.type?.toLowerCase() ===
                                                              'regular'
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                            : holiday?.type?.toLowerCase() ===
                                                                'special'
                                                              ? 'border-green-300 bg-green-100 text-green-900 hover:bg-green-200'
                                                              : selectedDate ===
                                                                  getDateString(
                                                                      day,
                                                                  )
                                                                ? 'bg-gray-300'
                                                                : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add Holiday Input */}
                            {isEditMode && (
                                <div className="flex gap-2 border-t pt-4">
                                    <Input
                                        type="text"
                                        placeholder="Holiday Name"
                                        value={holidayName}
                                        onChange={(e) =>
                                            setHolidayName(e.target.value)
                                        }
                                        disabled={!selectedDate}
                                    />
                                    <Button
                                        onClick={handleAddHoliday}
                                        disabled={
                                            !selectedDate || !holidayName.trim()
                                        }
                                    >
                                        Add
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Holidays List Section */}
                    <Card className="flex h-full w-full flex-col overflow-hidden lg:w-[350px] lg:flex-shrink-0">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                <CardTitle>Nationwide Holidays</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <div className="h-full overflow-y-auto p-6">
                                {holidays.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                        <CalendarIcon className="mb-4 h-12 w-12 opacity-20" />
                                        <p>No holidays added yet</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">
                                                    Date
                                                </TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                {isEditMode && (
                                                    <TableHead className="w-[50px]"></TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {holidays.map((holiday, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">
                                                        {new Date(
                                                            holiday.date,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {holiday.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none ${
                                                                holiday.type?.toLowerCase() ===
                                                                'regular'
                                                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                    : holiday.type?.toLowerCase() ===
                                                                        'special'
                                                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {holiday.type?.toLowerCase()}
                                                        </span>
                                                    </TableCell>
                                                    {isEditMode && (
                                                        <TableCell>
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveHoliday(
                                                                        idx,
                                                                    )
                                                                }
                                                                className="text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>

                            {isEditMode && holidays.length > 0 && (
                                <div className="border-t p-4">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleReset}
                                    >
                                        Reset All
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
