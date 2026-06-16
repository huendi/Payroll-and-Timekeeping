import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import html2canvas from 'html2canvas-pro';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    full_name: string;
    department: string;
}

interface ScheduleDay {
    date: string;
    type: 'work' | 'rest';
    time_in?: string;
    time_out?: string;
}

interface EmployeeSchedule {
    id: number;
    schedule_file_id: string;
    date_created: string;
    weeks: number;
    count: number;
}

interface Props {
    employee: Employee;
    schedule: EmployeeSchedule;
    scheduleDetails: ScheduleDay[];
    timeIn: string;
    timeOut: string;
}

const convert24HourTo12Hour = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour < 12 ? 'AM' : 'PM';
    const newHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${newHour}:${minutes} ${ampm}`;
};

export default function ScheduleShow({
    employee,
    schedule,
    scheduleDetails,
    timeIn,
    timeOut,
}: Props) {
    const breadcrumbs = [
        { title: 'Employees', href: '/employees' },
        { title: employee.full_name, href: `/employees/${employee.id}` },
        { title: 'Schedule', href: `/employees/${employee.id}/schedule` },
        { title: 'View', href: '#' },
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

    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1,
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Build a map of selected days
    const selectedDays = new Map<string, 'work' | 'rest'>();
    scheduleDetails.forEach((detail) => {
        selectedDays.set(detail.date, detail.type);
    });

    const daysInMonth = (month: number, year: number) => {
        return new Date(year, month, 0).getDate();
    };

    const firstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month - 1, 1).getDay();
    };

    interface DayObj {
        day: number | null;
        dateStr: string;
        isCurrentMonth: boolean;
    }

    const generateCalendarDays = (): DayObj[] => {
        const days: DayObj[] = [];
        const firstDay = firstDayOfMonth(selectedMonth, selectedYear);
        const totalDays = daysInMonth(selectedMonth, selectedYear);

        // Previous month's days
        const prevMonthDays = daysInMonth(
            selectedMonth === 1 ? 12 : selectedMonth - 1,
            selectedMonth === 1 ? selectedYear - 1 : selectedYear,
        );

        for (let i = prevMonthDays - firstDay + 1; i <= prevMonthDays; i++) {
            const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
            const prevYear =
                selectedMonth === 1 ? selectedYear - 1 : selectedYear;
            days.push({
                day: i,
                dateStr: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                isCurrentMonth: false,
            });
        }

        // Current month's days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                dateStr: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                isCurrentMonth: true,
            });
        }

        // Next month's days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
            const nextYear =
                selectedMonth === 12 ? selectedYear + 1 : selectedYear;
            days.push({
                day: i,
                dateStr: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                isCurrentMonth: false,
            });
        }

        return days;
    };

    const handleDownloadSchedule = async () => {
        const element = document.getElementById('schedule-card');
        if (!element) {
            toast.error('Could not find schedule to download');
            return;
        }

        try {
            // Create a temporary container for the download
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '384px';
            container.style.backgroundColor = '#ffffff';
            container.style.padding = '20px';

            // Clone the schedule card
            const clone = element.cloneNode(true) as HTMLElement;

            // Change clone to vertical layout
            clone.className = clone.className.replace(
                'flex w-full gap-4',
                'flex w-full flex-col gap-4',
            );

            // Remove fixed width from info card
            const infoCard = clone.querySelector(
                '[class*="w-64"]',
            ) as HTMLElement;
            if (infoCard) {
                infoCard.className = infoCard.className.replace(
                    'w-64 flex-shrink-0',
                    '',
                );
            }

            // Update the calendars container in the clone
            const calendarsContainer = clone.querySelector(
                '[id="calendars-container"]',
            ) as HTMLElement;
            if (calendarsContainer) {
                calendarsContainer.className =
                    'flex flex-col gap-4 items-center';
            }

            // Remove overflow from the CardContent
            const cardContent = clone.querySelector(
                '.overflow-x-auto',
            ) as HTMLElement;
            if (cardContent) {
                cardContent.className = cardContent.className.replace(
                    'overflow-x-auto',
                    'overflow-visible',
                );
            }

            container.appendChild(clone);
            document.body.appendChild(container);

            // Small delay to ensure DOM is updated
            await new Promise((resolve) => setTimeout(resolve, 100));

            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false,
            });

            // Remove container
            document.body.removeChild(container);

            const link = document.createElement('a');
            link.download = `schedule_${employee.last_name},${employee.first_name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            toast.success('Schedule downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download schedule');
        }
    };

    const calendarDays = generateCalendarDays();

    // Get all months that should be displayed
    const getMonthsToDisplay = (): Array<{ month: number; year: number }> => {
        const monthsToShow: Array<{ month: number; year: number }> = [];
        if (!scheduleDetails || scheduleDetails.length === 0) {
            return monthsToShow;
        }

        const firstDate = new Date(scheduleDetails[0].date);
        const lastDate = new Date(
            scheduleDetails[scheduleDetails.length - 1].date,
        );

        // Set to first day of first month
        let currentDate = new Date(
            firstDate.getFullYear(),
            firstDate.getMonth(),
            1,
        );
        // Set to last day of last month
        const endDate = new Date(
            lastDate.getFullYear(),
            lastDate.getMonth() + 1,
            0,
        );

        while (currentDate <= endDate) {
            monthsToShow.push({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return monthsToShow;
    };

    const monthsToDisplay = getMonthsToDisplay();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Schedule - ${employee.full_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="mb-2 flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Employee Schedule
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {employee.full_name} • {employee.employee_number}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadSchedule}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div id="schedule-card" className="flex w-full gap-4">
                    {/* Info Card */}
                    <Card className="w-64 flex-shrink-0 border-none shadow-lg">
                        <CardHeader className="border-b pb-3">
                            <div className="space-y-1">
                                <h2 className="text-lg font-bold text-foreground">
                                    {employee.department || 'HR Department'} –
                                    Employee Schedule
                                </h2>
                                <div className="space-y-1 text-left text-sm text-muted-foreground">
                                    <p>
                                        <span className="font-medium text-foreground">
                                            Department:
                                        </span>{' '}
                                        {employee.department || '-'}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">
                                            Employee ID:
                                        </span>{' '}
                                        {employee.employee_number}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">
                                            Name:
                                        </span>{' '}
                                        {employee.last_name},{' '}
                                        {employee.first_name}{' '}
                                        {employee.middle_name}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">
                                            Days:
                                        </span>{' '}
                                        {schedule.count}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">
                                            Time In:
                                        </span>{' '}
                                        {convert24HourTo12Hour(timeIn)}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">
                                            Time Out:
                                        </span>{' '}
                                        {convert24HourTo12Hour(timeOut)}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="font-medium text-foreground">
                                            Legend:
                                        </span>
                                        <span className="text-sm font-medium text-blue-600">
                                            Work Days
                                        </span>
                                        <span className="text-sm font-medium text-red-600">
                                            Rest Days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Calendars Card */}
                    <Card className="flex-1 border-none shadow-lg">
                        <CardContent className="overflow-x-auto pt-4">
                            <div
                                className="flex gap-4"
                                id="calendars-container"
                            >
                                {/* Calendars */}
                                {monthsToDisplay.map((monthInfo, idx) => {
                                    const monthDays = (() => {
                                        const days: DayObj[] = [];
                                        const firstDay = firstDayOfMonth(
                                            monthInfo.month,
                                            monthInfo.year,
                                        );
                                        const totalDays = daysInMonth(
                                            monthInfo.month,
                                            monthInfo.year,
                                        );

                                        // Previous month's days
                                        const prevMonthDays = daysInMonth(
                                            monthInfo.month === 1
                                                ? 12
                                                : monthInfo.month - 1,
                                            monthInfo.month === 1
                                                ? monthInfo.year - 1
                                                : monthInfo.year,
                                        );

                                        for (
                                            let i =
                                                prevMonthDays - firstDay + 1;
                                            i <= prevMonthDays;
                                            i++
                                        ) {
                                            const prevMonth =
                                                monthInfo.month === 1
                                                    ? 12
                                                    : monthInfo.month - 1;
                                            const prevYear =
                                                monthInfo.month === 1
                                                    ? monthInfo.year - 1
                                                    : monthInfo.year;
                                            days.push({
                                                day: i,
                                                dateStr: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                                                isCurrentMonth: false,
                                            });
                                        }

                                        // Current month's days
                                        for (let i = 1; i <= totalDays; i++) {
                                            days.push({
                                                day: i,
                                                dateStr: `${monthInfo.year}-${String(monthInfo.month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                                                isCurrentMonth: true,
                                            });
                                        }

                                        // Next month's days
                                        const remainingDays = 42 - days.length;
                                        for (
                                            let i = 1;
                                            i <= remainingDays;
                                            i++
                                        ) {
                                            const nextMonth =
                                                monthInfo.month === 12
                                                    ? 1
                                                    : monthInfo.month + 1;
                                            const nextYear =
                                                monthInfo.month === 12
                                                    ? monthInfo.year + 1
                                                    : monthInfo.year;
                                            days.push({
                                                day: i,
                                                dateStr: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                                                isCurrentMonth: false,
                                            });
                                        }

                                        return days;
                                    })();

                                    return (
                                        <div
                                            key={idx}
                                            className="w-80 flex-shrink-0 rounded-lg border bg-background p-4"
                                        >
                                            <h3 className="mb-3 text-center text-base font-semibold">
                                                {months[monthInfo.month - 1]}{' '}
                                                {monthInfo.year}
                                            </h3>
                                            <div className="space-y-1">
                                                <div className="grid grid-cols-7 gap-0.5">
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
                                                            className="rounded bg-muted py-1 text-center text-sm font-semibold"
                                                        >
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-7 gap-0.5">
                                                    {monthDays.map(
                                                        (dayObj, idx) => {
                                                            const dateStr =
                                                                dayObj.dateStr;
                                                            const dayType =
                                                                selectedDays.get(
                                                                    dateStr,
                                                                );
                                                            const isSelected =
                                                                dayType !==
                                                                undefined;

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`flex aspect-square items-center justify-center rounded border text-sm font-medium transition-colors ${
                                                                        !dayObj.isCurrentMonth
                                                                            ? 'opacity-30'
                                                                            : ''
                                                                    } ${
                                                                        isSelected
                                                                            ? dayType ===
                                                                              'work'
                                                                                ? 'border-blue-700 bg-blue-600 text-white'
                                                                                : 'border-red-700 bg-red-600 text-white'
                                                                            : dayObj.isCurrentMonth
                                                                              ? 'bg-background'
                                                                              : 'bg-muted'
                                                                    }`}
                                                                >
                                                                    {dayObj.day}
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
