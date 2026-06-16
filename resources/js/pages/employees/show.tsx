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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { canEdit, useRole } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import html2canvas from 'html2canvas-pro';
import {
    Archive,
    Briefcase,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Edit,
    Eye,
    FileText,
    Flag,
    Hash,
    Landmark,
    MapPin,
    Phone,
    Plus,
    RotateCcw,
    Trash2,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    department: string | null;
    position: string | null;
    email: string | null;
    phone: string | null;
    contact: string | null;
    address: string | null;
    zip_code: string | null;
    birthdate: string | null;
    birthplace: string | null;
    age: number | null;
    gender: string | null;
    civil_status: string | null;
    religion: string | null;
    nationality: string | null;
    sss: string | null;
    philhealth: string | null;
    pagibig: string | null;
    tin: string | null;
    bank_name: string | null;
    bank_account: string | null;
    basic_rate: string | null;
    rate_type: string | null;
    allowance: string | null;
    start_date: string | null;
    status: string | null;
    photo: string | null;
    created_at: string;
    updated_at: string;
}

interface EmployeePayslip {
    id: number;
    payroll_id: number;
    payroll_period: string;
    month: string;
    year: number;
    net_pay: string;
    generated_at: string | null;
}

interface LeaveCredit {
    id: number;
    employee_id: number;
    leave_type: string;
    total_days: string;
    remaining_days: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

interface LeaveHistory {
    id: number;
    employee_id: number;
    leave_type: string;
    duration: 'Full Day' | 'Half Day';
    date_from: string;
    date_to: string;
    days_used: string;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

interface Deduction {
    id: number;
    employee_id: number;
    deduction_type:
        | 'company_loan'
        | 'cash_advance'
        | 'sss_loan'
        | 'hdmf_loan'
        | 'other';
    custom_type: string | null;
    amount: string;
    term: number;
    cut_off: '1st_half' | '2nd_half';
    remaining_balance: string;
    payments_made: number;
    is_active: boolean;
    start_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

interface EmployeeSchedule {
    id: number;
    schedule_file_id: string;
    date_created: string;
    weeks: number;
    count: number;
    time_in?: string;
    time_out?: string;
}

interface PaginatedSchedules {
    data: EmployeeSchedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ScheduleDay {
    date: string;
    type: 'work' | 'rest';
    time_in?: string;
    time_out?: string;
}

interface Attendance {
    id: number;
    employee_id: number;
    payroll_id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    formatted_clock_in?: string;
    formatted_clock_out?: string;
    formatted_date?: string;
    hours_worked: string;
    late_minutes: number;
    overtime_hours: string;
    night_diff_hours: string;
    is_holiday: boolean;
    is_restday: boolean;
    remarks: string | null;
    payroll?: {
        id: number;
        payroll_period: string;
        month: string;
        year: number;
    };
}

interface AttendancePayroll {
    id: number;
    payroll_period: string;
    month: string;
    year: number;
    count: number;
}

interface PaginatedAttendances {
    data: Attendance[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PaginatedAttendancePayrolls {
    data: AttendancePayroll[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PaginatedPayslips {
    data: EmployeePayslip[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Schedule {
    first_half_end: number;
    second_half_start: number;
}

interface Props {
    employee: Employee;
    leaveCredits: LeaveCredit[];
    leaveHistory: LeaveHistory[];
    deductions: Deduction[];
    schedules: PaginatedSchedules;
    archivedSchedules: PaginatedSchedules;
    payslips: PaginatedPayslips;
    attendances: PaginatedAttendances;
    attendancePayrolls: PaginatedAttendancePayrolls;
    schedule?: Schedule;
    prevEmployee?: { id: number; first_name: string; last_name: string };
    nextEmployee?: { id: number; first_name: string; last_name: string };
}

type TabType =
    | 'information'
    | 'schedule'
    | 'attendance'
    | 'deduction'
    | 'leave'
    | 'payslip';

export default function EmployeeShow({
    employee,
    leaveCredits,
    leaveHistory,
    deductions,
    schedules,
    archivedSchedules,
    payslips,
    attendances,
    attendancePayrolls,
    schedule,
    prevEmployee,
    nextEmployee,
}: Props) {
    // Helper function to format cutoff label with actual dates
    const formatCutoffLabel = (cutOff: '1st_half' | '2nd_half'): string => {
        if (
            !schedule ||
            schedule.first_half_end === null ||
            schedule.first_half_end === undefined ||
            schedule.second_half_start === null ||
            schedule.second_half_start === undefined
        ) {
            return cutOff === '1st_half' ? '1st Half' : '2nd Half';
        }
        if (cutOff === '1st_half') {
            const firstHalfEnd = parseInt(String(schedule.first_half_end), 10);
            return `1st Half (1-${firstHalfEnd})`;
        } else {
            const secondHalfStart = parseInt(
                String(schedule.second_half_start),
                10,
            );
            return `2nd Half (${secondHalfStart}-End)`;
        }
    };
    const { url } = usePage();

    const getTabFromUrl = (currentUrl: string) => {
        const searchParams = new URLSearchParams(currentUrl.split('?')[1]);
        return (searchParams.get('tab') || 'information') as TabType;
    };

    const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl(url));

    // Effect to update tab when URL changes (e.g. back button)
    useEffect(() => {
        const tab = getTabFromUrl(url);
        if (tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [url]);
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showEditCreditModal, setShowEditCreditModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showEditLeaveModal, setShowEditLeaveModal] = useState(false);
    const [selectedLeaveHistory, setSelectedLeaveHistory] =
        useState<LeaveHistory | null>(null);
    const [showDeductionModal, setShowDeductionModal] = useState(false);
    const [showEditDeductionModal, setShowEditDeductionModal] = useState(false);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [selectedDeduction, setSelectedDeduction] =
        useState<Deduction | null>(null);
    const [deductionPayments, setDeductionPayments] = useState<any[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showViewScheduleModal, setShowViewScheduleModal] = useState(false);
    const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] =
        useState<EmployeeSchedule | null>(null);
    const [scheduleDetails, setScheduleDetails] = useState<ScheduleDay[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<
        { id: number; name: string }[]
    >([]);
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [customLeaveType, setCustomLeaveType] = useState('');
    const [isAddingCustomType, setIsAddingCustomType] = useState(false);
    const [customDeductionTypes, setCustomDeductionTypes] = useState<string[]>(
        [],
    );
    const [isAddingCustomDeductionType, setIsAddingCustomDeductionType] =
        useState(false);
    const [selectedLeaveCredit, setSelectedLeaveCredit] =
        useState<LeaveCredit | null>(null);
    const [activeScheduleTab, setActiveScheduleTab] = useState<
        'active' | 'archived'
    >('active');
    const [activeDeductionTab, setActiveDeductionTab] = useState<
        'active' | 'archived'
    >('active');
    const [activeLeaveHistoryTab, setActiveLeaveHistoryTab] = useState<
        'active' | 'archived'
    >('active');
    const [activePageActive, setActivePageActive] = useState(1);
    const [archivedPageActive, setArchivedPageActive] = useState(1);
    const [perPageActive, setPerPageActive] = useState('10');
    const [perPageArchived, setPerPageArchived] = useState('10');
    const [attendancePayrollPage, setAttendancePayrollPage] = useState(1);
    const [perPageAttendancePayroll, setPerPageAttendancePayroll] =
        useState('10');
    const [deductionPageActive, setDeductionPageActive] = useState(1);
    const [deductionPageArchived, setDeductionPageArchived] = useState(1);
    const [perPageDeductionActive, setPerPageDeductionActive] = useState('10');
    const [perPageDeductionArchived, setPerPageDeductionArchived] =
        useState('10');
    const [leaveHistoryPageActive, setLeaveHistoryPageActive] = useState(1);
    const [leaveHistoryPageArchived, setLeaveHistoryPageArchived] = useState(1);
    const [perPageLeaveHistoryActive, setPerPageLeaveHistoryActive] =
        useState('10');
    const [perPageLeaveHistoryArchived, setPerPageLeaveHistoryArchived] =
        useState('10');
    const [payslipsPage, setPayslipsPage] = useState(
        payslips.current_page || 1,
    );
    const [perPagePayslips, setPerPagePayslips] = useState(
        String(payslips.per_page) || '10',
    );

    // Schedule form states
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1,
    );
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedWeeks, setSelectedWeeks] = useState(1);
    const [selectedDays, setSelectedDays] = useState<
        Map<string, 'work' | 'rest'>
    >(new Map());
    const [markAs, setMarkAs] = useState<'work' | 'rest'>('work');

    const creditForm = useForm({
        leave_type: '',
        total_days: '',
    });

    const editCreditForm = useForm({
        leave_type: '',
        total_days: '',
        remaining_days: '',
    });

    const leaveForm = useForm({
        leave_type: '',
        duration: 'Full Day',
        date_from: '',
        date_to: '',
        remarks: '',
    });

    const editLeaveHistoryForm = useForm({
        leave_type: '',
        duration: 'Full Day',
        date_from: '',
        date_to: '',
        remarks: '',
    });

    const deductionForm = useForm({
        deduction_type: '',
        custom_type: '',
        amount: '',
        term: '',
        cut_off: '1st_half',
        start_date: '',
        notes: '',
    });

    const editDeductionForm = useForm({
        deduction_type: '',
        custom_type: '',
        amount: '',
        term: '',
        cut_off: '1st_half',
        start_date: '',
        notes: '',
    });

    const scheduleForm = useForm({
        weeks: 1,
        time_in: '06:00',
        time_out: '22:00',
        schedule_id: null,
        days: [] as Array<{ date: string; type: string }>,
    });

    // Fetch leave types and custom deduction types on mount
    useEffect(() => {
        fetchLeaveTypes();
        fetchCustomDeductionTypes();
    }, []);

    // Sync attendance payroll pagination with URL parameters
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page_attendance');
        const perPageParam = params.get('per_page_attendance');

        if (pageParam) {
            setAttendancePayrollPage(parseInt(pageParam));
        }
        if (perPageParam) {
            setPerPageAttendancePayroll(perPageParam);
        }
    }, []);

    // Auto-paginate payslips
    useEffect(() => {
        if (activeTab !== 'payslip') return;

        const timer = setTimeout(() => {
            router.get(
                `/employees/${employee.id}?tab=payslip`,
                {
                    page_payslips:
                        payslipsPage !== 1 ? payslipsPage : undefined,
                    per_page_payslips:
                        perPagePayslips !== '10' ? perPagePayslips : undefined,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [payslipsPage, perPagePayslips]);

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get('/leave-types');
            setLeaveTypes(response.data);
        } catch (error) {
            console.error('Failed to fetch leave types:', error);
        }
    };

    const fetchCustomDeductionTypes = async () => {
        try {
            const response = await axios.get('/custom-deduction-types');
            const types = response.data.map(
                (type: { id: number; name: string }) => type.name,
            );
            setCustomDeductionTypes(types);
        } catch (error) {
            console.error('Failed to fetch custom deduction types:', error);
            // Fallback to extracting from existing deductions
            extractCustomDeductionTypes();
        }
    };

    const extractCustomDeductionTypes = () => {
        const customTypes = deductions
            .filter((d) => d.deduction_type === 'other' && d.custom_type)
            .map((d) => d.custom_type!)
            .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        setCustomDeductionTypes(customTypes);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: '/employees',
        },
        {
            title: `${employee.first_name} ${employee.last_name}`,
            href: `/employees/${employee.id}`,
        },
    ];

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: string | null) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(parseFloat(amount));
    };

    const role = useRole();

    const tabs = [
        { id: 'information' as TabType, label: 'Information', icon: User },
        { id: 'schedule' as TabType, label: 'Schedule', icon: Calendar },
        { id: 'attendance' as TabType, label: 'Attendance', icon: Clock },
        { id: 'deduction' as TabType, label: 'Deduction', icon: DollarSign },
        { id: 'leave' as TabType, label: 'Leave', icon: Clock },
        ...(role !== 'hr'
            ? [{ id: 'payslip' as TabType, label: 'Payslip', icon: FileText }]
            : []),
    ];

    const handleAddCredit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If custom type is selected, create it first
        if (selectedLeaveType === 'custom' && customLeaveType) {
            setIsAddingCustomType(true);
            try {
                await axios.post('/leave-types', { name: customLeaveType });
                await fetchLeaveTypes();
                creditForm.setData('leave_type', customLeaveType);
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message ||
                        'Failed to create custom leave type.',
                );
                setIsAddingCustomType(false);
                return;
            }
            setIsAddingCustomType(false);
        }

        creditForm.post(`/employees/${employee.id}/leave-credits`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Leave credit added successfully!');
                setShowCreditModal(false);
                creditForm.reset();
                setSelectedLeaveType('');
                setCustomLeaveType('');
            },
            onError: () => {
                toast.error('Failed to add leave credit.');
            },
        });
    };

    const handleEditCredit = (credit: LeaveCredit) => {
        setSelectedLeaveCredit(credit);
        editCreditForm.setData({
            leave_type: credit.leave_type,
            total_days: credit.total_days,
            remaining_days: credit.remaining_days,
        });
        setShowEditCreditModal(true);
    };

    const handleUpdateCredit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeaveCredit) return;

        editCreditForm.put(
            `/employees/${employee.id}/leave-credits/${selectedLeaveCredit.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Leave credit updated successfully!');
                    setShowEditCreditModal(false);
                    editCreditForm.reset();
                    setSelectedLeaveCredit(null);
                },
                onError: () => {
                    toast.error('Failed to update leave credit.');
                },
            },
        );
    };

    const handleDeleteCredit = (credit: LeaveCredit) => {
        if (
            confirm(
                `Are you sure you want to delete the ${credit.leave_type} leave credit?`,
            )
        ) {
            router.delete(
                `/employees/${employee.id}/leave-credits/${credit.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Leave credit deleted successfully!');
                        setActiveTab('leave');
                    },
                    onError: () => {
                        toast.error('Failed to delete leave credit.');
                    },
                },
            );
        }
    };

    const handleArchiveCredit = (credit: LeaveCredit) => {
        if (
            confirm(
                `Archive the ${credit.leave_type} leave credit? You can restore it later.`,
            )
        ) {
            router.post(
                `/employees/${employee.id}/leave-credits/${credit.id}/archive`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Leave credit archived successfully!');
                        setActiveTab('leave');
                    },
                    onError: () => {
                        toast.error('Failed to archive leave credit.');
                    },
                },
            );
        }
    };

    const handleRestoreCredit = (credit: LeaveCredit) => {
        if (confirm(`Restore the ${credit.leave_type} leave credit?`)) {
            router.post(
                `/employees/${employee.id}/leave-credits/${credit.id}/restore`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Leave credit restored successfully!');
                        setActiveTab('leave');
                    },
                    onError: () => {
                        toast.error('Failed to restore leave credit.');
                    },
                },
            );
        }
    };

    const handleDeleteLeaveHistory = (leaveHistory: LeaveHistory) => {
        if (
            confirm(
                `Are you sure you want to delete this leave record? The credits will be restored.`,
            )
        ) {
            router.delete(
                `/employees/${employee.id}/leave-history/${leaveHistory.id}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(
                            'Leave record deleted and credits restored!',
                        );
                        setActiveTab('leave');
                    },
                    onError: () => {
                        toast.error('Failed to delete leave record.');
                    },
                },
            );
        }
    };

    const handleEditLeaveHistory = (leave: LeaveHistory) => {
        setSelectedLeaveHistory(leave);
        editLeaveHistoryForm.setData({
            leave_type: leave.leave_type,
            duration: leave.duration,
            date_from: leave.date_from,
            date_to: leave.date_to,
            remarks: leave.remarks || '',
        });
        setShowEditLeaveModal(true);
    };

    const handleUpdateLeaveHistory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeaveHistory) return;

        editLeaveHistoryForm.put(
            `/employees/${employee.id}/leave-history/${selectedLeaveHistory.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Leave record updated successfully!');
                    setShowEditLeaveModal(false);
                    editLeaveHistoryForm.reset();
                    setSelectedLeaveHistory(null);
                    setActiveTab('leave');
                },
                onError: () => {
                    toast.error('Failed to update leave record.');
                },
            },
        );
    };

    const handleArchiveLeaveHistory = (leave: LeaveHistory) => {
        if (confirm(`Archive this leave record?`)) {
            router.post(
                `/employees/${employee.id}/leave-history/${leave.id}/archive`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Leave record archived successfully!');
                        setActiveTab('leave');
                    },
                    onError: () => {
                        toast.error('Failed to archive leave record.');
                    },
                },
            );
        }
    };

    const handleRestoreLeaveHistory = (leave: LeaveHistory) => {
        if (confirm(`Restore this leave record?`)) {
            router.post(
                `/employees/${employee.id}/leave-history/${leave.id}/restore`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Leave record restored successfully!');
                        setActiveTab('leave');
                    },
                    onError: () => {
                        toast.error('Failed to restore leave record.');
                    },
                },
            );
        }
    };

    const getMinimumDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const handleOpenAddScheduleModal = async () => {
        // Reset form and selected days
        scheduleForm.reset();
        setSelectedDays(new Map());
        setMarkAs('work');
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());
        setSelectedWeeks(1);

        // Try to get the last created schedule to use as default times
        if (schedules && schedules.length > 0) {
            const lastSchedule = schedules[0];
            try {
                const response = await axios.get(
                    `/employees/${employee.id}/schedule/${lastSchedule.schedule_file_id}/details`,
                );
                const scheduleDetails = response.data;

                // Extract time_in and time_out from the first schedule entry
                if (
                    Array.isArray(scheduleDetails) &&
                    scheduleDetails.length > 0
                ) {
                    const firstEntry = scheduleDetails[0];
                    if (firstEntry.time_in && firstEntry.time_out) {
                        scheduleForm.setData({
                            weeks: 1,
                            time_in: firstEntry.time_in,
                            time_out: firstEntry.time_out,
                            schedule_id: null,
                            days: [],
                        });
                    }
                }
            } catch (error: any) {
                // If fetching fails, just use defaults - don't show error
                console.debug('Using default schedule times');
            }
        }

        setShowScheduleModal(true);
    };

    const handleFileLeave = (e: React.FormEvent) => {
        e.preventDefault();

        const dateFrom = leaveForm.data.date_from;
        const dateTo = leaveForm.data.date_to;

        // Validate that date_to doesn't exceed date_from
        if (dateTo && dateFrom && dateTo < dateFrom) {
            toast.error('Date To cannot be earlier than Date From.');
            return;
        }

        leaveForm.post(`/employees/${employee.id}/leave-history`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Leave filed successfully!');
                setShowLeaveModal(false);
                leaveForm.reset();
                setActiveTab('leave');
            },
            onError: () => {
                toast.error('Failed to file leave. Please check the form.');
            },
        });
    };

    const handleViewPayments = async (deduction: Deduction) => {
        setSelectedDeduction(deduction);
        setShowPaymentsModal(true);
        setLoadingPayments(true);

        try {
            const response = await axios.get(
                `/employees/${employee.id}/deductions/${deduction.id}/payments`,
            );
            setDeductionPayments(response.data.payments || []);
        } catch (error: any) {
            console.error(
                'Payment history error:',
                error.response?.data || error.message,
            );
            toast.error('Failed to load payment history.');
            setDeductionPayments([]);
        } finally {
            setLoadingPayments(false);
        }
    };

    const handleAddDeduction = (e: React.FormEvent) => {
        e.preventDefault();

        // Handle custom type selection (custom:TypeName format)
        let deductionType = deductionForm.data.deduction_type;
        let customType = deductionForm.data.custom_type;

        if (deductionType.startsWith('custom:')) {
            customType = deductionType.substring(7); // Remove 'custom:' prefix
            deductionType = 'other';
        }

        // If it's a custom type, save it first
        const saveCustomTypePromise =
            deductionType === 'other' &&
            customType &&
            !customDeductionTypes.includes(customType)
                ? axios.post('/custom-deduction-types', {
                      name: customType,
                      description: null,
                  })
                : Promise.resolve();

        saveCustomTypePromise
            .then((response) => {
                // If we just created a new custom type, add it to the state immediately
                if (
                    deductionType === 'other' &&
                    customType &&
                    !customDeductionTypes.includes(customType)
                ) {
                    setCustomDeductionTypes([
                        ...customDeductionTypes,
                        customType,
                    ]);
                }

                // Create the deduction with the correct type and custom_type
                const deductionData = {
                    ...deductionForm.data,
                    deduction_type: deductionType,
                    custom_type: customType,
                };

                // Use axios instead of form.post to have full control over the data
                axios
                    .post(`/employees/${employee.id}/deductions`, deductionData)
                    .then(() => {
                        toast.success('Deduction created successfully!');
                        setShowDeductionModal(false);
                        deductionForm.reset();
                        setIsAddingCustomDeductionType(false);
                        setActiveTab('deduction');
                        // Refresh the page to show the new deduction
                        router.visit(
                            `/employees/${employee.id}?tab=deduction`,
                            {
                                preserveScroll: true,
                            },
                        );
                    })
                    .catch(() => {
                        toast.error(
                            'Failed to create deduction. Please check the form.',
                        );
                    });
            })
            .catch(() => {
                toast.error('Failed to save custom deduction type.');
            });
    };

    const handleEditDeduction = (deduction: Deduction) => {
        setSelectedDeduction(deduction);
        editDeductionForm.setData({
            deduction_type: deduction.deduction_type,
            custom_type: deduction.custom_type || '',
            amount: deduction.amount.toString(),
            term: deduction.term.toString(),
            cut_off: deduction.cut_off,
            start_date: deduction.start_date,
            notes: deduction.notes || '',
        });
        setShowEditDeductionModal(true);
    };

    const handleUpdateDeduction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDeduction) return;

        editDeductionForm.put(
            `/employees/${employee.id}/deductions/${selectedDeduction.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Deduction updated successfully!');
                    setShowEditDeductionModal(false);
                    setSelectedDeduction(null);
                    editDeductionForm.reset();
                    setActiveTab('deduction');
                },
                onError: () => {
                    toast.error(
                        'Failed to update deduction. Please check the form.',
                    );
                },
            },
        );
    };

    const handleDeleteDeduction = (deductionId: number) => {
        if (confirm('Are you sure you want to delete this deduction?')) {
            router.delete(
                `/employees/${employee.id}/deductions/${deductionId}`,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Deduction deleted successfully!');
                        setActiveTab('deduction');
                    },
                    onError: () => {
                        toast.error('Failed to delete deduction.');
                    },
                },
            );
        }
    };

    const handleArchiveDeduction = (deductionId: number) => {
        if (confirm('Archive this deduction? You can restore it later.')) {
            router.post(
                `/employees/${employee.id}/deductions/${deductionId}/archive`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Deduction archived successfully!');
                        setActiveTab('deduction');
                    },
                    onError: () => {
                        toast.error('Failed to archive deduction.');
                    },
                },
            );
        }
    };

    const handleRestoreDeduction = (deductionId: number) => {
        if (confirm('Restore this deduction?')) {
            router.post(
                `/employees/${employee.id}/deductions/${deductionId}/restore`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Deduction restored successfully!');
                        setActiveTab('deduction');
                    },
                    onError: () => {
                        toast.error('Failed to restore deduction.');
                    },
                },
            );
        }
    };

    const getDeductionTypeDisplay = (deduction: Deduction): string => {
        if (deduction.deduction_type === 'other') {
            return deduction.custom_type || 'Other';
        }
        const typeMap: Record<string, string> = {
            company_loan: 'Company Loan',
            cash_advance: 'Cash Advance',
            sss_loan: 'SSS Loan',
            hdmf_loan: 'HDMF Loan',
        };
        return typeMap[deduction.deduction_type] || deduction.deduction_type;
    };

    // Deduction pagination helpers
    const getFilteredActiveDeductions = () =>
        deductions.filter((d) => !d.is_archived);
    const getFilteredArchivedDeductions = () =>
        deductions.filter((d) => d.is_archived);

    const getPaginatedActiveDeductions = () => {
        const filtered = getFilteredActiveDeductions();
        const perPage = parseInt(perPageDeductionActive);
        const startIndex = (deductionPageActive - 1) * perPage;
        return filtered.slice(startIndex, startIndex + perPage);
    };

    const getPaginatedArchivedDeductions = () => {
        const filtered = getFilteredArchivedDeductions();
        const perPage = parseInt(perPageDeductionArchived);
        const startIndex = (deductionPageArchived - 1) * perPage;
        return filtered.slice(startIndex, startIndex + perPage);
    };

    const getDeductionLastPage = (isActive: boolean) => {
        const filtered = isActive
            ? getFilteredActiveDeductions()
            : getFilteredArchivedDeductions();
        const perPage = isActive
            ? parseInt(perPageDeductionActive)
            : parseInt(perPageDeductionArchived);
        return Math.ceil(filtered.length / perPage) || 1;
    };

    // Leave history pagination helpers
    const getFilteredActiveLeaveHistory = () =>
        leaveHistory.filter((h) => !h.is_archived);
    const getFilteredArchivedLeaveHistory = () =>
        leaveHistory.filter((h) => h.is_archived);

    const getPaginatedActiveLeaveHistory = () => {
        const filtered = getFilteredActiveLeaveHistory();
        const perPage = parseInt(perPageLeaveHistoryActive);
        const startIndex = (leaveHistoryPageActive - 1) * perPage;
        return filtered.slice(startIndex, startIndex + perPage);
    };

    const getPaginatedArchivedLeaveHistory = () => {
        const filtered = getFilteredArchivedLeaveHistory();
        const perPage = parseInt(perPageLeaveHistoryArchived);
        const startIndex = (leaveHistoryPageArchived - 1) * perPage;
        return filtered.slice(startIndex, startIndex + perPage);
    };

    const getLeaveHistoryLastPage = (isActive: boolean) => {
        const filtered = isActive
            ? getFilteredActiveLeaveHistory()
            : getFilteredArchivedLeaveHistory();
        const perPage = isActive
            ? parseInt(perPageLeaveHistoryActive)
            : parseInt(perPageLeaveHistoryArchived);
        return Math.ceil(filtered.length / perPage) || 1;
    };

    // Schedule helper functions
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

    const daysInMonth = (month: number, year: number) =>
        new Date(year, month, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) =>
        new Date(year, month - 1, 1).getDay();

    const generateCalendarDays = () => {
        const days = [];
        const firstDayIndex = firstDayOfMonth(selectedMonth, selectedYear);
        const totalDays = daysInMonth(selectedMonth, selectedYear);

        // Previous Month Days
        const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
        const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
        const totalDaysPrevMonth = daysInMonth(prevMonth, prevYear);

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const d = totalDaysPrevMonth - i;
            days.push({
                day: d,
                month: prevMonth,
                year: prevYear,
                isCurrentMonth: false,
                dateStr: getDateString(d, prevMonth, prevYear),
            });
        }

        // Current Month Days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                month: selectedMonth,
                year: selectedYear,
                isCurrentMonth: true,
                dateStr: getDateString(i, selectedMonth, selectedYear),
            });
        }
        return days;
    };

    const getDateString = (day: number, month: number, year: number) =>
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const [usedDatesMap, setUsedDatesMap] = useState<Map<string, boolean>>(
        new Map(),
    );

    // Fetch used dates from all schedules
    useEffect(() => {
        const fetchUsedDates = async () => {
            const datesMap = new Map<string, boolean>();

            for (const schedule of schedules.data) {
                // Skip the schedule being edited
                if (
                    showEditScheduleModal &&
                    selectedSchedule &&
                    schedule.schedule_file_id ===
                        selectedSchedule.schedule_file_id
                ) {
                    continue;
                }

                try {
                    const response = await axios.get(
                        `/employees/${employee.id}/schedule/${schedule.schedule_file_id}/details`,
                    );
                    const details = response.data;

                    if (Array.isArray(details)) {
                        details.forEach((day: ScheduleDay) => {
                            const dateOnly = day.date.split('T')[0];
                            datesMap.set(dateOnly, true);
                        });
                    }
                } catch (error) {
                    console.debug('Error fetching schedule details:', error);
                }
            }

            setUsedDatesMap(datesMap);
        };

        fetchUsedDates();
    }, [schedules.data, showEditScheduleModal, selectedSchedule, employee.id]);

    const handleDayClick = (dateStr: string, isDisabled: boolean) => {
        if (isDisabled) return;
        const newSelected = new Map(selectedDays);
        if (newSelected.has(dateStr)) {
            newSelected.delete(dateStr);
        } else {
            newSelected.set(dateStr, markAs);
        }
        setSelectedDays(newSelected);
    };

    const handleSaveSchedule = () => {
        if (!scheduleForm.data.time_in || !scheduleForm.data.time_out) {
            toast.error('Please enter time in and time out');
            return;
        }

        const days = Array.from(selectedDays).map(([date, type]) => ({
            date,
            type,
        }));

        const isEditing = showEditScheduleModal && selectedSchedule;
        const endpoint = `/employees/${employee.id}/schedule`;
        const payload = {
            weeks: selectedWeeks,
            time_in: scheduleForm.data.time_in,
            time_out: scheduleForm.data.time_out,
            schedule_id: null,
            schedule_file_id: isEditing
                ? selectedSchedule.schedule_file_id
                : null,
            days: days,
        };

        router.post(endpoint, payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEditing
                        ? 'Schedule updated successfully'
                        : 'Schedule created successfully',
                );
                setShowScheduleModal(false);
                setShowEditScheduleModal(false);
                setSelectedDays(new Map());
                scheduleForm.reset();
                setActiveTab('schedule');
            },
            onError: (errors: any) => {
                console.error('Schedule error:', errors);
                toast.error(
                    isEditing
                        ? 'Failed to update schedule'
                        : 'Failed to create schedule',
                );
            },
        });
    };

    const handleArchiveSchedule = (scheduleFileId: string) => {
        if (!confirm('Are you sure you want to archive this schedule?')) return;

        router.post(
            `/employees/${employee.id}/schedule/${scheduleFileId}/archive`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Schedule archived successfully');
                    setActiveTab('schedule');
                },
                onError: () => {
                    toast.error('Failed to archive schedule');
                },
            },
        );
    };

    const handleRestoreSchedule = (scheduleFileId: string) => {
        if (!confirm('Are you sure you want to restore this schedule?')) return;

        router.post(
            `/employees/${employee.id}/schedule/${scheduleFileId}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Schedule restored successfully');
                    setActiveTab('schedule');
                },
                onError: () => {
                    toast.error('Failed to restore schedule');
                },
            },
        );
    };

    const handleDeleteSchedule = (scheduleFileId: string) => {
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
                setActiveTab('schedule');
            },
            onError: () => {
                toast.error('Failed to delete schedule');
            },
        });
    };

    const handleViewAttendance = (payroll: AttendancePayroll) => {
        router.visit(`/employees/${employee.id}/attendance/${payroll.id}`);
    };

    const handleDownload = async () => {
        const element = document.getElementById('employee-information-tab');
        if (!element) {
            toast.error('Could not find content to download');
            return;
        }

        try {
            // Clone the element to avoid modifying the original
            const clonedElement = element.cloneNode(true) as HTMLElement;

            // Create a temporary container with padding
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = '1200px';
            tempContainer.style.padding = '32px';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.appendChild(clonedElement);
            document.body.appendChild(tempContainer);

            const canvas = await html2canvas(clonedElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                logging: false,
            } as any);

            // Clean up
            document.body.removeChild(tempContainer);

            const link = document.createElement('a');
            link.download = `profile_${employee.last_name},${employee.first_name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            toast.success('Image downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download image');
        }
    };

    const handleDownloadSchedule = async () => {
        const element = document.getElementById('employee-schedule-view');
        if (!element) {
            toast.error('Could not find content to download');
            return;
        }

        const promise = html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: true,
        } as any).then((canvas) => {
            const link = document.createElement('a');
            link.download = `schedule_${employee.last_name},${employee.first_name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });

        toast.promise(Promise.resolve(promise), {
            loading: 'Generating schedule image...',
            success: 'Schedule image downloaded successfully',
            error: 'Failed to download schedule image',
        });
    };

    const getShiftType = (timeIn: any) => {
        if (!timeIn) return 'N/A';

        // timeIn format is "h:i A" (e.g., "06:00 PM", "08:00 AM")
        const [time, modifier] = timeIn.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (hours === 12) {
            hours = 0;
        }
        if (modifier === 'PM') {
            hours += 12;
        }

        // Night shift: 6 PM (18) to 6 AM (6)
        // But usually identified by start time being >= 18 or < 6?
        // Or maybe just check if start time is PM?
        // Let's stick to: Start time >= 18:00 or Start time < 06:00 is Night Shift
        return hours >= 18 || hours < 6 ? 'Night Shift' : 'Day Shift';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.first_name} ${employee.last_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                {prevEmployee ? (
                                    <Link
                                        href={`/employees/${prevEmployee.id}`}
                                        preserveScroll
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            title={`Previous: ${prevEmployee.first_name} ${prevEmployee.last_name}`}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="w-8" />
                                )}
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {employee.first_name} {employee.middle_name}{' '}
                                    {employee.last_name}
                                </h1>
                                {nextEmployee ? (
                                    <Link
                                        href={`/employees/${nextEmployee.id}`}
                                        preserveScroll
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            title={`Next: ${nextEmployee.first_name} ${nextEmployee.last_name}`}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <div className="w-8" />
                                )}
                            </div>
                            <p className="text-muted-foreground">
                                {employee.employee_number} •{' '}
                                {employee.position || 'No Position'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="overflow-x-auto border-b">
                    <div className="flex min-w-min gap-2 sm:gap-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Link
                                    key={tab.id}
                                    href={`/employees/${employee.id}?tab=${tab.id}`}
                                    preserveState
                                    preserveScroll
                                    className={`flex items-center gap-1 border-b-2 px-2 py-3 text-sm whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:text-base ${
                                        activeTab === tab.id
                                            ? 'border-primary font-medium text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">
                                        {tab.label}
                                    </span>
                                    <span className="sm:hidden">
                                        {tab.label.split(' ')[0]}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'information' && (
                        <div
                            className="space-y-6"
                            id="employee-information-tab"
                        >
                            {/* Profile Section with Photo */}
                            <Card className="overflow-hidden border-none shadow-md">
                                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-6">
                                    <div className="flex flex-col gap-6 md:flex-row md:items-start">
                                        {/* Photo */}
                                        <div className="flex-shrink-0">
                                            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-sm">
                                                {employee.photo ? (
                                                    <img
                                                        src={`/${employee.photo}`}
                                                        alt={
                                                            employee.first_name
                                                        }
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                                                        <User className="h-12 w-12" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                                            {
                                                                employee.first_name
                                                            }{' '}
                                                            {
                                                                employee.middle_name
                                                            }{' '}
                                                            {employee.last_name}
                                                        </h2>
                                                        <Badge
                                                            variant={
                                                                employee.status ===
                                                                'active'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="shadow-none"
                                                        >
                                                            {employee.status
                                                                ? employee.status
                                                                      .charAt(0)
                                                                      .toUpperCase() +
                                                                  employee.status.slice(
                                                                      1,
                                                                  )
                                                                : '-'}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                                                        <Briefcase className="h-3.5 w-3.5" />
                                                        <span className="text-sm font-medium">
                                                            {employee.position ||
                                                                'No Position'}
                                                        </span>
                                                        <span className="text-xs text-slate-300">
                                                            |
                                                        </span>
                                                        <span className="text-sm">
                                                            {employee.department ||
                                                                'No Department'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 bg-white/50 p-0 hover:bg-white"
                                                        onClick={handleDownload}
                                                        title="Download Information"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {canEdit('employees') && (
                                                        <Link
                                                            href={`/employees/${employee.id}/edit`}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 bg-white/50 p-0 hover:bg-white"
                                                                title="Edit Profile"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Key Stats Grid */}
                                            <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/60 p-4 sm:grid-cols-4">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Hash className="h-3.5 w-3.5" />
                                                        Employee ID
                                                    </div>
                                                    <p className="mt-1 font-semibold text-foreground">
                                                        {
                                                            employee.employee_number
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        Start Date
                                                    </div>
                                                    <p className="mt-1 font-semibold text-foreground">
                                                        {formatDate(
                                                            employee.start_date,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Tenure
                                                    </div>
                                                    <p className="mt-1 font-semibold text-foreground">
                                                        {employee.start_date
                                                            ? (() => {
                                                                  const start =
                                                                      new Date(
                                                                          employee.start_date,
                                                                      );
                                                                  const now =
                                                                      new Date();
                                                                  const diffTime =
                                                                      Math.abs(
                                                                          now.getTime() -
                                                                              start.getTime(),
                                                                      );
                                                                  const diffDays =
                                                                      Math.ceil(
                                                                          diffTime /
                                                                              (1000 *
                                                                                  60 *
                                                                                  60 *
                                                                                  24),
                                                                      );
                                                                  const years =
                                                                      Math.floor(
                                                                          diffDays /
                                                                              365,
                                                                      );
                                                                  const months =
                                                                      Math.floor(
                                                                          (diffDays %
                                                                              365) /
                                                                              30,
                                                                      );
                                                                  return `${years}y ${months}m`;
                                                              })()
                                                            : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Flag className="h-3.5 w-3.5" />
                                                        Nationality
                                                    </div>
                                                    <p className="mt-1 font-semibold text-foreground">
                                                        {employee.nationality ||
                                                            '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Information Grid */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {/* Personal Details */}
                                <Card className="border-muted/60 shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="border-b bg-muted/30 pt-4 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-600">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-sm font-medium text-foreground">
                                                Personal Details
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-y-3 pt-4 text-sm">
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Birthdate
                                            </span>
                                            <span className="font-medium">
                                                {formatDate(employee.birthdate)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Age
                                            </span>
                                            <span className="font-medium">
                                                {employee.age || '-'} years old
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Gender
                                            </span>
                                            <span className="font-medium capitalize">
                                                {employee.gender || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Civil Status
                                            </span>
                                            <span className="font-medium capitalize">
                                                {employee.civil_status || '-'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Contact Information */}
                                <Card className="border-muted/60 shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="border-b bg-muted/30 pt-4 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-sm font-medium text-foreground">
                                                Contact & Address
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-y-3 pt-4 text-sm">
                                        <div className="flex justify-between gap-2 border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Email
                                            </span>
                                            <span className="truncate text-right font-medium hover:text-primary hover:underline">
                                                {employee.email || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Phone
                                            </span>
                                            <span className="font-medium">
                                                {employee.phone || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Contact
                                            </span>
                                            <span className="font-medium">
                                                {employee.contact || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Zip Code
                                            </span>
                                            <span className="font-medium">
                                                {employee.zip_code || '-'}
                                            </span>
                                        </div>
                                        {employee.address && (
                                            <div className="border-t border-dashed pt-2">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    Address
                                                </div>
                                                <p className="mt-1 leading-snug font-medium">
                                                    {employee.address}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Government IDs */}
                                <Card className="border-muted/60 shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="border-b bg-muted/30 pt-4 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md bg-violet-500/10 p-1.5 text-violet-600">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-sm font-medium text-foreground">
                                                Government IDs
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-y-3 pt-4 text-sm">
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                SSS
                                            </span>
                                            <span className="font-mono font-medium">
                                                {employee.sss || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                PhilHealth
                                            </span>
                                            <span className="font-mono font-medium">
                                                {employee.philhealth || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Pag-IBIG
                                            </span>
                                            <span className="font-mono font-medium">
                                                {employee.pagibig || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                TIN
                                            </span>
                                            <span className="font-mono font-medium">
                                                {employee.tin || '-'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Bank Information */}
                                <Card className="border-muted/60 shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="border-b bg-muted/30 pt-4 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md bg-orange-500/10 p-1.5 text-orange-600">
                                                <Landmark className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-sm font-medium text-foreground">
                                                Bank Information
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-y-3 pt-4 text-sm">
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Bank Name
                                            </span>
                                            <span className="font-medium">
                                                {employee.bank_name || '-'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Account Number
                                            </span>
                                            <span className="font-mono font-medium tracking-wide">
                                                {employee.bank_account || '-'}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Compensation */}
                                <Card className="border-muted/60 shadow-sm transition-shadow hover:shadow-md">
                                    <CardHeader className="border-b bg-muted/30 pt-4 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md bg-green-500/10 p-1.5 text-green-600">
                                                <DollarSign className="h-4 w-4" />
                                            </div>
                                            <CardTitle className="text-sm font-medium text-foreground">
                                                Compensation
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-y-3 pt-4 text-sm">
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Basic Rate
                                            </span>
                                            <span className="font-bold text-green-700">
                                                {formatCurrency(
                                                    employee.basic_rate,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Rate Type
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                            >
                                                {employee.rate_type || '-'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between border-b border-dashed pb-2 last:border-0 last:pb-0">
                                            <span className="text-muted-foreground">
                                                Allowance
                                            </span>
                                            <span className="font-semibold text-blue-600">
                                                {formatCurrency(
                                                    employee.allowance,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-4">
                            {/* Schedule Tabs */}
                            <div className="flex gap-2 overflow-x-auto border-b">
                                <Button
                                    variant={
                                        activeScheduleTab === 'active'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    className={`text-sm whitespace-nowrap sm:text-base ${
                                        activeScheduleTab === 'active'
                                            ? 'rounded-b-none border-b-2 border-primary'
                                            : 'rounded-b-none'
                                    }`}
                                    onClick={() =>
                                        setActiveScheduleTab('active')
                                    }
                                >
                                    Active
                                </Button>
                                <Button
                                    variant={
                                        activeScheduleTab === 'archived'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    className={`text-sm whitespace-nowrap sm:text-base ${
                                        activeScheduleTab === 'archived'
                                            ? 'rounded-b-none border-b-2 border-primary'
                                            : 'rounded-b-none'
                                    }`}
                                    onClick={() =>
                                        setActiveScheduleTab('archived')
                                    }
                                >
                                    Archived
                                </Button>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle>
                                            {activeScheduleTab === 'active'
                                                ? 'Active Schedules'
                                                : 'Archived Schedules'}
                                        </CardTitle>
                                        <CardDescription>
                                            Employee work schedule and shift
                                            information
                                        </CardDescription>
                                    </div>
                                    {canEdit('employees') &&
                                        activeScheduleTab === 'active' && (
                                            <Button
                                                onClick={
                                                    handleOpenAddScheduleModal
                                                }
                                                className="w-full sm:w-auto"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Schedule
                                            </Button>
                                        )}
                                </CardHeader>
                                <CardContent>
                                    {activeScheduleTab === 'active' ? (
                                        schedules.data.length === 0 ? (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No active schedules yet. Click
                                                "Add Schedule" to create one.
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>
                                                                #
                                                            </TableHead>
                                                            <TableHead>
                                                                Date Created
                                                            </TableHead>
                                                            <TableHead>
                                                                Shift
                                                            </TableHead>
                                                            {/* <TableHead>
                                                                Week(s)
                                                            </TableHead> */}
                                                            <TableHead>
                                                                Days
                                                            </TableHead>
                                                            <TableHead>
                                                                Actions
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {schedules.data.map(
                                                            (
                                                                schedule: EmployeeSchedule,
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
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">
                                                                                {getShiftType(
                                                                                    schedule.time_in,
                                                                                )}
                                                                            </span>
                                                                            {schedule.time_in &&
                                                                                schedule.time_out && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {
                                                                                            schedule.time_in
                                                                                        }{' '}
                                                                                        -{' '}
                                                                                        {
                                                                                            schedule.time_out
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                    </TableCell>
                                                                    {/* <TableCell>
                                                                        {
                                                                            schedule.weeks
                                                                        }
                                                                    </TableCell> */}
                                                                    <TableCell>
                                                                        {
                                                                            schedule.count
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex gap-2">
                                                                            <Link
                                                                                href={`/employees/${employee.id}/schedule/${schedule.schedule_file_id}/show?tab=schedule`}
                                                                                preserveState
                                                                                preserveScroll
                                                                            >
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                            {canEdit(
                                                                                'employees',
                                                                            ) && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={async () => {
                                                                                        setSelectedSchedule(
                                                                                            schedule,
                                                                                        );
                                                                                        try {
                                                                                            const response =
                                                                                                await axios.get(
                                                                                                    `/employees/${employee.id}/schedule/${schedule.schedule_file_id}/details`,
                                                                                                );
                                                                                            const details =
                                                                                                response.data;
                                                                                            setScheduleDetails(
                                                                                                details,
                                                                                            );

                                                                                            if (
                                                                                                details &&
                                                                                                details.length >
                                                                                                    0
                                                                                            ) {
                                                                                                const daysMap =
                                                                                                    new Map<
                                                                                                        string,
                                                                                                        | 'work'
                                                                                                        | 'rest'
                                                                                                    >();
                                                                                                details.forEach(
                                                                                                    (
                                                                                                        day: ScheduleDay,
                                                                                                    ) => {
                                                                                                        const dateOnly =
                                                                                                            day.date.split(
                                                                                                                'T',
                                                                                                            )[0];
                                                                                                        daysMap.set(
                                                                                                            dateOnly,
                                                                                                            day.type,
                                                                                                        );
                                                                                                    },
                                                                                                );
                                                                                                setSelectedDays(
                                                                                                    daysMap,
                                                                                                );

                                                                                                const firstDate =
                                                                                                    new Date(
                                                                                                        details[0].date,
                                                                                                    );
                                                                                                setSelectedMonth(
                                                                                                    firstDate.getMonth() +
                                                                                                        1,
                                                                                                );
                                                                                                setSelectedYear(
                                                                                                    firstDate.getFullYear(),
                                                                                                );

                                                                                                // Set time_in and time_out from first working day
                                                                                                const firstWorkingDay =
                                                                                                    details.find(
                                                                                                        (
                                                                                                            d: ScheduleDay,
                                                                                                        ) =>
                                                                                                            d.type ===
                                                                                                            'work',
                                                                                                    );
                                                                                                if (
                                                                                                    firstWorkingDay
                                                                                                ) {
                                                                                                    scheduleForm.setData(
                                                                                                        'time_in',
                                                                                                        firstWorkingDay.time_in ||
                                                                                                            '06:00',
                                                                                                    );
                                                                                                    scheduleForm.setData(
                                                                                                        'time_out',
                                                                                                        firstWorkingDay.time_out ||
                                                                                                            '22:00',
                                                                                                    );
                                                                                                }

                                                                                                setSelectedWeeks(
                                                                                                    schedule.weeks,
                                                                                                );
                                                                                            }
                                                                                            setShowEditScheduleModal(
                                                                                                true,
                                                                                            );
                                                                                        } catch (error) {
                                                                                            console.error(
                                                                                                'Error loading schedule details:',
                                                                                                error,
                                                                                            );
                                                                                            toast.error(
                                                                                                'Failed to load schedule details',
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                            {/* Old modal trigger - commented out
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            setSelectedSchedule(
                                                                                schedule,
                                                                            );
                                                                            try {
                                                                                const response =
                                                                                    await axios.get(
                                                                                        `/employees/${employee.id}/schedule/${schedule.schedule_file_id}/details`,
                                                                                    );
                                                                                const details =
                                                                                    response.data;
                                                                                setScheduleDetails(
                                                                                    details,
                                                                                );

                                                                                if (
                                                                                    details &&
                                                                                    details.length >
                                                                                        0
                                                                                ) {
                                                                                    // Find first working day (not rest day)
                                                                                    const firstWorkingDay =
                                                                                        details.find(
                                                                                            (
                                                                                                d: ScheduleDay,
                                                                                            ) =>
                                                                                                d.type ===
                                                                                                'work',
                                                                                        ) ||
                                                                                        details[0];

                                                                                    // Set calendar to the month of the first scheduled day
                                                                                    const firstDate =
                                                                                        new Date(
                                                                                            details[0].date,
                                                                                        );
                                                                                    setSelectedMonth(
                                                                                        firstDate.getMonth() +
                                                                                            1,
                                                                                    );
                                                                                    setSelectedYear(
                                                                                        firstDate.getFullYear(),
                                                                                    );

                                                                                    // Extract time in HH:mm format (handle both time string and timestamp)
                                                                                    const extractTime =
                                                                                        (
                                                                                            timeValue:
                                                                                                | string
                                                                                                | null,
                                                                                        ) => {
                                                                                            if (
                                                                                                !timeValue
                                                                                            )
                                                                                                return '08:00';
                                                                                            // If it's already in HH:mm format, return as is
                                                                                            if (
                                                                                                /^\d{2}:\d{2}/.test(
                                                                                                    timeValue,
                                                                                                )
                                                                                            ) {
                                                                                                return timeValue.slice(
                                                                                                    0,
                                                                                                    5,
                                                                                                );
                                                                                            }
                                                                                            // Otherwise parse as date and extract time
                                                                                            const date =
                                                                                                new Date(
                                                                                                    timeValue,
                                                                                                );
                                                                                            return date
                                                                                                .toTimeString()
                                                                                                .slice(
                                                                                                    0,
                                                                                                    5,
                                                                                                );
                                                                                        };

                                                                                    scheduleForm.setData(
                                                                                        {
                                                                                            weeks: schedule.weeks,
                                                                                            time_in:
                                                                                                extractTime(
                                                                                                    firstWorkingDay.time_in,
                                                                                                ),
                                                                                            time_out:
                                                                                                extractTime(
                                                                                                    firstWorkingDay.time_out,
                                                                                                ),
                                                                                            schedule_id:
                                                                                                null,
                                                                                            days: [],
                                                                                        },
                                                                                    );

                                                                                    // Pre-populate selected days - convert date format
                                                                                    const daysMap =
                                                                                        new Map<
                                                                                            string,
                                                                                            | 'work'
                                                                                            | 'rest'
                                                                                        >();
                                                                                    details.forEach(
                                                                                        (
                                                                                            day: ScheduleDay,
                                                                                        ) => {
                                                                                            // Convert from "2025-11-03T00:00:00.000000Z" to "2025-11-03"
                                                                                            const dateOnly =
                                                                                                day.date.split(
                                                                                                    'T',
                                                                                                )[0];
                                                                                            daysMap.set(
                                                                                                dateOnly,
                                                                                                day.type,
                                                                                            );
                                                                                        },
                                                                                    );

                                                                                    setSelectedDays(
                                                                                        daysMap,
                                                                                    );
                                                                                    setSelectedWeeks(
                                                                                        schedule.weeks,
                                                                                    );
                                                                                }

                                                                                setShowEditScheduleModal(
                                                                                    true,
                                                                                );
                                                                            } catch (error) {
                                                                                toast.error(
                                                                                    'Failed to load schedule details',
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Edit className="mr-1 h-4 w-4" />
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            setSelectedSchedule(
                                                                                schedule,
                                                                            );
                                                                            try {
                                                                                const response =
                                                                                    await axios.get(
                                                                                        `/employees/${employee.id}/schedule/${schedule.schedule_file_id}/details`,
                                                                                    );
                                                                                const details =
                                                                                    response.data;
                                                                                setScheduleDetails(
                                                                                    details,
                                                                                );

                                                                                if (
                                                                                    details &&
                                                                                    details.length >
                                                                                        0
                                                                                ) {
                                                                                    const firstDate =
                                                                                        new Date(
                                                                                            details[0].date,
                                                                                        );
                                                                                    setSelectedMonth(
                                                                                        firstDate.getMonth() +
                                                                                            1,
                                                                                    );
                                                                                    setSelectedYear(
                                                                                        firstDate.getFullYear(),
                                                                                    );

                                                                                    const daysMap =
                                                                                        new Map<
                                                                                            string,
                                                                                            | 'work'
                                                                                            | 'rest'
                                                                                        >();
                                                                                    details.forEach(
                                                                                        (
                                                                                            day: ScheduleDay,
                                                                                        ) => {
                                                                                            const dateOnly =
                                                                                                day.date.split(
                                                                                                    'T',
                                                                                                )[0];
                                                                                            daysMap.set(
                                                                                                dateOnly,
                                                                                                day.type,
                                                                                            );
                                                                                        },
                                                                                    );
                                                                                    setSelectedDays(
                                                                                        daysMap,
                                                                                    );
                                                                                }
                                                                                setShowViewScheduleModal(
                                                                                    true,
                                                                                );
                                                                            } catch (error) {
                                                                                toast.error(
                                                                                    'Failed to load schedule details',
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Eye className="mr-1 h-4 w-4" />
                                                                        View
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            if (
                                                                                confirm(
                                                                                    'Are you sure you want to delete this schedule?',
                                                                                )
                                                                            ) {
                                                                                router.delete(
                                                                                    `/employees/${employee.id}/schedule/${schedule.schedule_file_id}`,
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                        onSuccess:
                                                                                            () => {
                                                                                                toast.success(
                                                                                                    'Schedule deleted successfully',
                                                                                                );
                                                                                                setActiveTab('schedule');
                                                                                            },
                                                                                        onError:
                                                                                            () => {
                                                                                                toast.error(
                                                                                                    'Failed to delete schedule',
                                                                                                );
                                                                                            },
                                                                                    },
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                    */}
                                                                            {canEdit(
                                                                                'employees',
                                                                            ) && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        handleArchiveSchedule(
                                                                                            schedule.schedule_file_id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Archive className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing{' '}
                                                            {
                                                                schedules.data
                                                                    .length
                                                            }{' '}
                                                            of {schedules.total}{' '}
                                                            schedules
                                                        </p>
                                                        <Select
                                                            value={
                                                                perPageActive
                                                            }
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
                                                                activePageActive ===
                                                                1
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
                                            </div>
                                        )
                                    ) : archivedSchedules.data.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No archived schedules found
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
                                                        <TableHead>
                                                            Shift
                                                        </TableHead>
                                                        <TableHead>
                                                            Week(s)
                                                        </TableHead>
                                                        <TableHead>
                                                            Days
                                                        </TableHead>
                                                        <TableHead>
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {archivedSchedules.data.map(
                                                        (
                                                            schedule: EmployeeSchedule,
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
                                                                    {
                                                                        schedule.date_created
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">
                                                                            {getShiftType(
                                                                                schedule.time_in,
                                                                            )}
                                                                        </span>
                                                                        {schedule.time_in &&
                                                                            schedule.time_out && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        schedule.time_in
                                                                                    }{' '}
                                                                                    -
                                                                                    {
                                                                                        schedule.time_out
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        schedule.weeks
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        schedule.count
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-2">
                                                                        <Link
                                                                            href={`/employees/${employee.id}/schedule/${schedule.schedule_file_id}/show`}
                                                                        >
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                        </Link>
                                                                        {canEdit(
                                                                            'employees',
                                                                        ) && (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        handleRestoreSchedule(
                                                                                            schedule.schedule_file_id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <RotateCcw className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    onClick={() =>
                                                                                        handleDeleteSchedule(
                                                                                            schedule.schedule_file_id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <p className="text-sm text-muted-foreground">
                                                        Showing{' '}
                                                        {
                                                            archivedSchedules
                                                                .data.length
                                                        }{' '}
                                                        of{' '}
                                                        {
                                                            archivedSchedules.total
                                                        }{' '}
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
                                                            archivedPageActive ===
                                                            1
                                                        }
                                                        onClick={() =>
                                                            setArchivedPageActive(
                                                                archivedPageActive -
                                                                    1,
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
                                                                archivedPageActive +
                                                                    1,
                                                            )
                                                        }
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'deduction' && (
                        <div className="space-y-4">
                            {/* Deduction Tabs */}
                            <div className="flex gap-2 overflow-x-auto border-b">
                                <Button
                                    variant={
                                        activeDeductionTab === 'active'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    className={`text-sm whitespace-nowrap sm:text-base ${
                                        activeDeductionTab === 'active'
                                            ? 'rounded-b-none border-b-2 border-primary'
                                            : 'rounded-b-none'
                                    }`}
                                    onClick={() =>
                                        setActiveDeductionTab('active')
                                    }
                                >
                                    Active
                                </Button>
                                <Button
                                    variant={
                                        activeDeductionTab === 'archived'
                                            ? 'default'
                                            : 'ghost'
                                    }
                                    className={`text-sm whitespace-nowrap sm:text-base ${
                                        activeDeductionTab === 'archived'
                                            ? 'rounded-b-none border-b-2 border-primary'
                                            : 'rounded-b-none'
                                    }`}
                                    onClick={() =>
                                        setActiveDeductionTab('archived')
                                    }
                                >
                                    Archived
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <CardTitle>
                                                {activeDeductionTab === 'active'
                                                    ? 'Active Deductions'
                                                    : 'Archived Deductions'}
                                            </CardTitle>
                                            <CardDescription>
                                                Employee salary deductions and
                                                contributions
                                            </CardDescription>
                                        </div>
                                        {canEdit('employees') &&
                                            activeDeductionTab === 'active' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowDeductionModal(
                                                            true,
                                                        )
                                                    }
                                                    className="w-full sm:w-auto"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Deduction
                                                </Button>
                                            )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {activeDeductionTab === 'active' ? (
                                        getFilteredActiveDeductions().length ===
                                        0 ? (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No active deductions found.
                                                Click "Add Deduction" to create
                                                one.
                                            </p>
                                        ) : (
                                            <>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>
                                                                Deduction Type
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Amount
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Term
                                                            </TableHead>
                                                            <TableHead>
                                                                Cut-off
                                                            </TableHead>
                                                            <TableHead>
                                                                Start Date
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Monthly Payment
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Payments Made
                                                            </TableHead>
                                                            <TableHead>
                                                                Status
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Actions
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {getPaginatedActiveDeductions().map(
                                                            (deduction) => (
                                                                <TableRow
                                                                    key={
                                                                        deduction.id
                                                                    }
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {getDeductionTypeDisplay(
                                                                            deduction,
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(
                                                                            deduction.amount,
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {
                                                                            deduction.term
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline">
                                                                            {formatCutoffLabel(
                                                                                deduction.cut_off,
                                                                            )}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {formatDate(
                                                                            deduction.start_date,
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(
                                                                            (
                                                                                parseFloat(
                                                                                    deduction.amount,
                                                                                ) /
                                                                                deduction.term
                                                                            ).toString(),
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {
                                                                            deduction.payments_made
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            variant={
                                                                                deduction.is_active
                                                                                    ? 'default'
                                                                                    : 'secondary'
                                                                            }
                                                                        >
                                                                            {deduction.is_active
                                                                                ? 'Active'
                                                                                : 'Inactive'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    handleViewPayments(
                                                                                        deduction,
                                                                                    )
                                                                                }
                                                                                title="View Payments"
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                            {canEdit(
                                                                                'employees',
                                                                            ) && (
                                                                                <>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleEditDeduction(
                                                                                                deduction,
                                                                                            )
                                                                                        }
                                                                                        title="Edit"
                                                                                    >
                                                                                        <Edit className="h-4 w-4" />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {canEdit(
                                                                                'employees',
                                                                            ) && (
                                                                                <>
                                                                                    {deduction.is_archived ? (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() =>
                                                                                                handleRestoreDeduction(
                                                                                                    deduction.id,
                                                                                                )
                                                                                            }
                                                                                            title="Restore"
                                                                                        >
                                                                                            <RotateCcw className="h-4 w-4" />
                                                                                        </Button>
                                                                                    ) : (
                                                                                        deduction.payments_made === 0 && (
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    handleArchiveDeduction(
                                                                                                        deduction.id,
                                                                                                    )
                                                                                                }
                                                                                                title="Archive"
                                                                                            >
                                                                                                <Archive className="h-4 w-4" />
                                                                                            </Button>
                                                                                        )
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>

                                                {/* Pagination */}
                                                <div className="flex items-center justify-between border-t pt-4">
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing{' '}
                                                            {getPaginatedActiveDeductions()
                                                                .length > 0
                                                                ? (deductionPageActive -
                                                                      1) *
                                                                      parseInt(
                                                                          perPageDeductionActive,
                                                                      ) +
                                                                  1
                                                                : 0}{' '}
                                                            to{' '}
                                                            {Math.min(
                                                                deductionPageActive *
                                                                    parseInt(
                                                                        perPageDeductionActive,
                                                                    ),
                                                                getFilteredActiveDeductions()
                                                                    .length,
                                                            )}{' '}
                                                            of{' '}
                                                            {
                                                                getFilteredActiveDeductions()
                                                                    .length
                                                            }{' '}
                                                            deductions
                                                        </p>
                                                        <Select
                                                            value={
                                                                perPageDeductionActive
                                                            }
                                                            onValueChange={
                                                                setPerPageDeductionActive
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
                                                    {getDeductionLastPage(
                                                        true,
                                                    ) > 1 && (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    deductionPageActive ===
                                                                    1
                                                                }
                                                                onClick={() =>
                                                                    setDeductionPageActive(
                                                                        deductionPageActive -
                                                                            1,
                                                                    )
                                                                }
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                            {Array.from(
                                                                {
                                                                    length: getDeductionLastPage(
                                                                        true,
                                                                    ),
                                                                },
                                                                (_, i) => i + 1,
                                                            ).map((page) => (
                                                                <Button
                                                                    key={page}
                                                                    variant={
                                                                        page ===
                                                                        deductionPageActive
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setDeductionPageActive(
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
                                                                    deductionPageActive ===
                                                                    getDeductionLastPage(
                                                                        true,
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    setDeductionPageActive(
                                                                        deductionPageActive +
                                                                            1,
                                                                    )
                                                                }
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )
                                    ) : getFilteredArchivedDeductions()
                                          .length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No archived deductions found
                                        </p>
                                    ) : (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Deduction Type
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Amount
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Term
                                                        </TableHead>
                                                        <TableHead>
                                                            Cut-off
                                                        </TableHead>
                                                        <TableHead>
                                                            Start Date
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Monthly Payment
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Payments Made
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {getPaginatedArchivedDeductions().map(
                                                        (deduction) => (
                                                            <TableRow
                                                                key={
                                                                    deduction.id
                                                                }
                                                            >
                                                                <TableCell className="font-medium">
                                                                    {getDeductionTypeDisplay(
                                                                        deduction,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {formatCurrency(
                                                                        deduction.amount,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {
                                                                        deduction.term
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {deduction.cut_off ===
                                                                        '1st_half'
                                                                            ? '1st Half'
                                                                            : '2nd Half'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatDate(
                                                                        deduction.start_date,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {formatCurrency(
                                                                        (
                                                                            parseFloat(
                                                                                deduction.amount,
                                                                            ) /
                                                                            deduction.term
                                                                        ).toString(),
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {
                                                                        deduction.payments_made
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={
                                                                            deduction.is_active
                                                                                ? 'default'
                                                                                : 'secondary'
                                                                        }
                                                                    >
                                                                        {deduction.is_active
                                                                            ? 'Active'
                                                                            : 'Inactive'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleViewPayments(
                                                                                    deduction,
                                                                                )
                                                                            }
                                                                            title="View Payments"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        {canEdit(
                                                                            'employees',
                                                                        ) && (
                                                                            <>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        handleRestoreDeduction(
                                                                                            deduction.id,
                                                                                        )
                                                                                    }
                                                                                    title="Restore"
                                                                                >
                                                                                    <RotateCcw className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        handleDeleteDeduction(
                                                                                            deduction.id,
                                                                                        )
                                                                                    }
                                                                                    title="Delete"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>

                                            {/* Pagination */}
                                            <div className="flex items-center justify-between border-t pt-4">
                                                <div className="flex items-center gap-4">
                                                    <p className="text-sm text-muted-foreground">
                                                        Showing{' '}
                                                        {getPaginatedArchivedDeductions()
                                                            .length > 0
                                                            ? (deductionPageArchived -
                                                                  1) *
                                                                  parseInt(
                                                                      perPageDeductionArchived,
                                                                  ) +
                                                              1
                                                            : 0}{' '}
                                                        to{' '}
                                                        {Math.min(
                                                            deductionPageArchived *
                                                                parseInt(
                                                                    perPageDeductionArchived,
                                                                ),
                                                            getFilteredArchivedDeductions()
                                                                .length,
                                                        )}{' '}
                                                        of{' '}
                                                        {
                                                            getFilteredArchivedDeductions()
                                                                .length
                                                        }{' '}
                                                        deductions
                                                    </p>
                                                    <Select
                                                        value={
                                                            perPageDeductionArchived
                                                        }
                                                        onValueChange={
                                                            setPerPageDeductionArchived
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
                                                {getDeductionLastPage(false) >
                                                    1 && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                deductionPageArchived ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                setDeductionPageArchived(
                                                                    deductionPageArchived -
                                                                        1,
                                                                )
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        {Array.from(
                                                            {
                                                                length: getDeductionLastPage(
                                                                    false,
                                                                ),
                                                            },
                                                            (_, i) => i + 1,
                                                        ).map((page) => (
                                                            <Button
                                                                key={page}
                                                                variant={
                                                                    page ===
                                                                    deductionPageArchived
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    setDeductionPageArchived(
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
                                                                deductionPageArchived ===
                                                                getDeductionLastPage(
                                                                    false,
                                                                )
                                                            }
                                                            onClick={() =>
                                                                setDeductionPageArchived(
                                                                    deductionPageArchived +
                                                                        1,
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
                    )}

                    {activeTab === 'leave' && (
                        <div className="flex flex-col gap-4 lg:h-[calc(100vh-12rem)] lg:flex-row">
                            {/* Left Column: Leave Balances */}
                            <div className="flex w-full flex-col overflow-hidden lg:h-full lg:w-1/3 lg:min-w-[300px]">
                                <Card className="flex h-full flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between py-3">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                Leave Balances
                                            </CardTitle>
                                        </div>
                                        {canEdit('employees') && (
                                            <Button
                                                size="sm"
                                                className="h-8 bg-black text-white hover:bg-black/90"
                                                onClick={() =>
                                                    setShowCreditModal(true)
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Leave
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto py-3">
                                        {leaveCredits.filter(
                                            (c) => !c.is_archived,
                                        ).length === 0 ? (
                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                No leave credits available.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {leaveCredits
                                                    .filter(
                                                        (c) => !c.is_archived,
                                                    )
                                                    .map((credit) => {
                                                        const usedDays =
                                                            parseFloat(
                                                                credit.total_days,
                                                            ) -
                                                            parseFloat(
                                                                credit.remaining_days,
                                                            );
                                                        const percentage =
                                                            (parseFloat(
                                                                credit.remaining_days,
                                                            ) /
                                                                parseFloat(
                                                                    credit.total_days,
                                                                )) *
                                                            100;

                                                        return (
                                                            <div
                                                                key={credit.id}
                                                                className="rounded-lg border p-3"
                                                            >
                                                                <div className="mb-1 flex items-center justify-between">
                                                                    <span className="text-sm font-medium">
                                                                        {
                                                                            credit.leave_type
                                                                        }
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        {canEdit(
                                                                            'employees',
                                                                        ) && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 w-6 p-0"
                                                                                onClick={() =>
                                                                                    handleEditCredit(
                                                                                        credit,
                                                                                    )
                                                                                }
                                                                                title="Edit"
                                                                            >
                                                                                <Edit className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-xl font-bold">
                                                                        {
                                                                            credit.remaining_days
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        /
                                                                        {
                                                                            credit.total_days
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                                                                    <div
                                                                        className={`h-full rounded-full ${
                                                                            percentage >
                                                                            50
                                                                                ? 'bg-green-500'
                                                                                : percentage >
                                                                                    25
                                                                                  ? 'bg-yellow-500'
                                                                                  : 'bg-red-500'
                                                                        }`}
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Leave History */}
                            <div className="flex w-full flex-col overflow-hidden lg:h-full lg:flex-1">
                                {/* Leave History Tabs */}
                                <div className="flex gap-2 border-b">
                                    <Button
                                        variant={
                                            activeLeaveHistoryTab === 'active'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className={
                                            activeLeaveHistoryTab === 'active'
                                                ? 'rounded-b-none border-b-2 border-primary'
                                                : 'rounded-b-none'
                                        }
                                        onClick={() => {
                                            setActiveLeaveHistoryTab('active');
                                            setLeaveHistoryPageActive(1);
                                        }}
                                        size="sm"
                                    >
                                        Active
                                    </Button>
                                    <Button
                                        variant={
                                            activeLeaveHistoryTab === 'archived'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className={
                                            activeLeaveHistoryTab === 'archived'
                                                ? 'rounded-b-none border-b-2 border-primary'
                                                : 'rounded-b-none'
                                        }
                                        onClick={() => {
                                            setActiveLeaveHistoryTab(
                                                'archived',
                                            );
                                            setLeaveHistoryPageArchived(1);
                                        }}
                                        size="sm"
                                    >
                                        Archived
                                    </Button>
                                </div>

                                <Card className="flex h-full flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between py-3">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                {activeLeaveHistoryTab ===
                                                'active'
                                                    ? 'Leave History'
                                                    : 'Archived Leave History'}
                                            </CardTitle>
                                        </div>
                                        {canEdit('employees') &&
                                            leaveCredits.length > 0 &&
                                            activeLeaveHistoryTab ===
                                                'active' && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-black text-white hover:bg-black/90"
                                                    onClick={() =>
                                                        setShowLeaveModal(true)
                                                    }
                                                >
                                                    <Plus className="mr-2 h-3 w-3" />
                                                    File Leave
                                                </Button>
                                            )}
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-auto p-0 lg:flex-1 lg:overflow-auto">
                                        {leaveCredits.length === 0 ? (
                                            <div className="flex h-full items-center justify-center">
                                                <p className="text-sm text-muted-foreground">
                                                    Add leave credits to start
                                                    filing leaves.
                                                </p>
                                            </div>
                                        ) : leaveHistory.filter((h) =>
                                              activeLeaveHistoryTab === 'active'
                                                  ? !h.is_archived
                                                  : h.is_archived,
                                          ).length === 0 ? (
                                            <div className="flex h-full items-center justify-center">
                                                <p className="text-sm text-muted-foreground">
                                                    {activeLeaveHistoryTab ===
                                                    'active'
                                                        ? 'No leave history found.'
                                                        : 'No archived leave history found.'}
                                                </p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader className="sticky top-0 bg-background">
                                                    <TableRow>
                                                        <TableHead>
                                                            Type
                                                        </TableHead>
                                                        <TableHead>
                                                            Duration
                                                        </TableHead>
                                                        <TableHead>
                                                            From
                                                        </TableHead>
                                                        <TableHead>
                                                            To
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Days
                                                        </TableHead>
                                                        <TableHead>
                                                            Remarks
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(activeLeaveHistoryTab ===
                                                    'active'
                                                        ? getPaginatedActiveLeaveHistory()
                                                        : getPaginatedArchivedLeaveHistory()
                                                    ).map((leave) => (
                                                        <TableRow
                                                            key={leave.id}
                                                        >
                                                            <TableCell className="font-medium">
                                                                {
                                                                    leave.leave_type
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {
                                                                        leave.duration
                                                                    }
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDate(
                                                                    leave.date_from,
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {formatDate(
                                                                    leave.date_to,
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {
                                                                    leave.days_used
                                                                }
                                                            </TableCell>
                                                            <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                                {leave.remarks ||
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    {canEdit(
                                                                        'employees',
                                                                    ) &&
                                                                        !leave.is_archived && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    handleEditLeaveHistory(
                                                                                        leave,
                                                                                    )
                                                                                }
                                                                                title="Edit"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    {canEdit(
                                                                        'employees',
                                                                    ) && (
                                                                        <>
                                                                            {leave.is_archived ? (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        handleRestoreLeaveHistory(
                                                                                            leave,
                                                                                        )
                                                                                    }
                                                                                    title="Restore"
                                                                                >
                                                                                    <RotateCcw className="h-4 w-4" />
                                                                                </Button>
                                                                            ) : (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        handleArchiveLeaveHistory(
                                                                                            leave,
                                                                                        )
                                                                                    }
                                                                                    title="Archive"
                                                                                >
                                                                                    <Archive className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                            {leave.is_archived && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        handleDeleteLeaveHistory(
                                                                                            leave,
                                                                                        )
                                                                                    }
                                                                                    title="Delete"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                                </Button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                    {leaveCredits.length > 0 &&
                                        (activeLeaveHistoryTab === 'active'
                                            ? getFilteredActiveLeaveHistory()
                                            : getFilteredArchivedLeaveHistory()
                                        ).length > 0 && (
                                            <div className="border-t px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing{' '}
                                                            {(activeLeaveHistoryTab ===
                                                            'active'
                                                                ? getPaginatedActiveLeaveHistory()
                                                                : getPaginatedArchivedLeaveHistory()
                                                            ).length > 0
                                                                ? (activeLeaveHistoryTab ===
                                                                  'active'
                                                                      ? leaveHistoryPageActive -
                                                                        1
                                                                      : leaveHistoryPageArchived -
                                                                        1) *
                                                                      parseInt(
                                                                          activeLeaveHistoryTab ===
                                                                              'active'
                                                                              ? perPageLeaveHistoryActive
                                                                              : perPageLeaveHistoryArchived,
                                                                      ) +
                                                                  1
                                                                : 0}{' '}
                                                            to{' '}
                                                            {Math.min(
                                                                (activeLeaveHistoryTab ===
                                                                'active'
                                                                    ? leaveHistoryPageActive
                                                                    : leaveHistoryPageArchived) *
                                                                    parseInt(
                                                                        activeLeaveHistoryTab ===
                                                                            'active'
                                                                            ? perPageLeaveHistoryActive
                                                                            : perPageLeaveHistoryArchived,
                                                                    ),
                                                                (activeLeaveHistoryTab ===
                                                                'active'
                                                                    ? getFilteredActiveLeaveHistory()
                                                                    : getFilteredArchivedLeaveHistory()
                                                                ).length,
                                                            )}{' '}
                                                            of{' '}
                                                            {
                                                                (activeLeaveHistoryTab ===
                                                                'active'
                                                                    ? getFilteredActiveLeaveHistory()
                                                                    : getFilteredArchivedLeaveHistory()
                                                                ).length
                                                            }{' '}
                                                            records
                                                        </p>
                                                        <Select
                                                            value={
                                                                activeLeaveHistoryTab ===
                                                                'active'
                                                                    ? perPageLeaveHistoryActive
                                                                    : perPageLeaveHistoryArchived
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) => {
                                                                if (
                                                                    activeLeaveHistoryTab ===
                                                                    'active'
                                                                ) {
                                                                    setPerPageLeaveHistoryActive(
                                                                        value,
                                                                    );
                                                                    setLeaveHistoryPageActive(
                                                                        1,
                                                                    );
                                                                } else {
                                                                    setPerPageLeaveHistoryArchived(
                                                                        value,
                                                                    );
                                                                    setLeaveHistoryPageArchived(
                                                                        1,
                                                                    );
                                                                }
                                                            }}
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
                                                    {getLeaveHistoryLastPage(
                                                        activeLeaveHistoryTab ===
                                                            'active',
                                                    ) > 1 && (
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    activeLeaveHistoryTab ===
                                                                    'active'
                                                                        ? leaveHistoryPageActive ===
                                                                          1
                                                                        : leaveHistoryPageArchived ===
                                                                          1
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        activeLeaveHistoryTab ===
                                                                        'active'
                                                                    ) {
                                                                        setLeaveHistoryPageActive(
                                                                            leaveHistoryPageActive -
                                                                                1,
                                                                        );
                                                                    } else {
                                                                        setLeaveHistoryPageArchived(
                                                                            leaveHistoryPageArchived -
                                                                                1,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                            {Array.from(
                                                                {
                                                                    length: getLeaveHistoryLastPage(
                                                                        activeLeaveHistoryTab ===
                                                                            'active',
                                                                    ),
                                                                },
                                                                (_, i) => i + 1,
                                                            ).map((page) => (
                                                                <Button
                                                                    key={page}
                                                                    variant={
                                                                        page ===
                                                                        (activeLeaveHistoryTab ===
                                                                        'active'
                                                                            ? leaveHistoryPageActive
                                                                            : leaveHistoryPageArchived)
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (
                                                                            activeLeaveHistoryTab ===
                                                                            'active'
                                                                        ) {
                                                                            setLeaveHistoryPageActive(
                                                                                page,
                                                                            );
                                                                        } else {
                                                                            setLeaveHistoryPageArchived(
                                                                                page,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {page}
                                                                </Button>
                                                            ))}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={
                                                                    activeLeaveHistoryTab ===
                                                                    'active'
                                                                        ? leaveHistoryPageActive ===
                                                                          getLeaveHistoryLastPage(
                                                                              true,
                                                                          )
                                                                        : leaveHistoryPageArchived ===
                                                                          getLeaveHistoryLastPage(
                                                                              false,
                                                                          )
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        activeLeaveHistoryTab ===
                                                                        'active'
                                                                    ) {
                                                                        setLeaveHistoryPageActive(
                                                                            leaveHistoryPageActive +
                                                                                1,
                                                                        );
                                                                    } else {
                                                                        setLeaveHistoryPageArchived(
                                                                            leaveHistoryPageArchived +
                                                                                1,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance History</CardTitle>
                                <CardDescription>
                                    Payroll periods with attendance records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!attendancePayrolls?.data ||
                                attendancePayrolls.data.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No payroll history found.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Period
                                                        </TableHead>
                                                        <TableHead>
                                                            Month
                                                        </TableHead>
                                                        <TableHead>
                                                            Year
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Records
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {attendancePayrolls?.data?.map(
                                                        (payroll) => (
                                                            <TableRow
                                                                key={payroll.id}
                                                            >
                                                                <TableCell>
                                                                    {
                                                                        payroll.payroll_period
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        payroll.month
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        payroll.year
                                                                    }
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {
                                                                        payroll.count
                                                                    }
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleViewAttendance(
                                                                                payroll,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing{' '}
                                                    {attendancePayrolls?.data
                                                        ?.length || 0}{' '}
                                                    of{' '}
                                                    {attendancePayrolls?.total ||
                                                        0}{' '}
                                                    payrolls
                                                </p>
                                                <Select
                                                    value={
                                                        perPageAttendancePayroll
                                                    }
                                                    onValueChange={
                                                        setPerPageAttendancePayroll
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
                                            {attendancePayrolls?.last_page &&
                                                attendancePayrolls.last_page >
                                                    1 && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                attendancePayrollPage ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                router.get(
                                                                    window
                                                                        .location
                                                                        .pathname,
                                                                    {
                                                                        page_attendance:
                                                                            attendancePayrollPage -
                                                                            1,
                                                                        per_page_attendance:
                                                                            perPageAttendancePayroll !==
                                                                            '10'
                                                                                ? perPageAttendancePayroll
                                                                                : undefined,
                                                                    },
                                                                    {
                                                                        preserveState: true,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        {Array.from(
                                                            {
                                                                length:
                                                                    attendancePayrolls?.last_page ||
                                                                    1,
                                                            },
                                                            (_, i) => i + 1,
                                                        ).map((page) => (
                                                            <Button
                                                                key={page}
                                                                variant={
                                                                    page ===
                                                                    attendancePayrollPage
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    router.get(
                                                                        window
                                                                            .location
                                                                            .pathname,
                                                                        {
                                                                            page_attendance:
                                                                                page,
                                                                            per_page_attendance:
                                                                                perPageAttendancePayroll !==
                                                                                '10'
                                                                                    ? perPageAttendancePayroll
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
                                                                attendancePayrollPage ===
                                                                (attendancePayrolls?.last_page ||
                                                                    1)
                                                            }
                                                            onClick={() =>
                                                                router.get(
                                                                    window
                                                                        .location
                                                                        .pathname,
                                                                    {
                                                                        page_attendance:
                                                                            attendancePayrollPage +
                                                                            1,
                                                                        per_page_attendance:
                                                                            perPageAttendancePayroll !==
                                                                            '10'
                                                                                ? perPageAttendancePayroll
                                                                                : undefined,
                                                                    },
                                                                    {
                                                                        preserveState: true,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'payslip' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payslips</CardTitle>
                                <CardDescription>
                                    Employee payslip history
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!payslips?.data ||
                                payslips.data.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No payslips found for this employee.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Period
                                                        </TableHead>
                                                        <TableHead>
                                                            Net Pay
                                                        </TableHead>
                                                        <TableHead>
                                                            Generated At
                                                        </TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {payslips.data.map(
                                                        (payslip) => (
                                                            <TableRow
                                                                key={payslip.id}
                                                            >
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {
                                                                            payslip.payroll_period
                                                                        }{' '}
                                                                        -{' '}
                                                                        {
                                                                            payslip.month
                                                                        }{' '}
                                                                        {
                                                                            payslip.year
                                                                        }
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatCurrency(
                                                                        payslip.net_pay,
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {payslip.generated_at
                                                                        ? new Date(
                                                                              payslip.generated_at,
                                                                          ).toLocaleString(
                                                                              'en-PH',
                                                                              {
                                                                                  year: 'numeric',
                                                                                  month: 'short',
                                                                                  day: '2-digit',
                                                                                  hour: '2-digit',
                                                                                  minute: '2-digit',
                                                                              },
                                                                          )
                                                                        : '-'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Link
                                                                        href={`/payslips/${payslip.id}`}
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
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing{' '}
                                                    {payslips?.data?.length ||
                                                        0}{' '}
                                                    of {payslips?.total || 0}{' '}
                                                    payslips
                                                </p>
                                                <Select
                                                    value={perPagePayslips}
                                                    onValueChange={
                                                        setPerPagePayslips
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
                                            {payslips?.last_page &&
                                                payslips.last_page > 1 && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                payslips?.current_page ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                router.get(
                                                                    `/employees/${employee.id}?tab=payslip&page_payslips=${(payslips?.current_page || 1) - 1}`,
                                                                    {
                                                                        per_page_payslips:
                                                                            perPagePayslips !==
                                                                            '10'
                                                                                ? perPagePayslips
                                                                                : undefined,
                                                                    },
                                                                    {
                                                                        preserveState: true,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        {Array.from(
                                                            {
                                                                length:
                                                                    payslips?.last_page ||
                                                                    1,
                                                            },
                                                            (_, i) => i + 1,
                                                        ).map((page) => (
                                                            <Button
                                                                key={page}
                                                                variant={
                                                                    page ===
                                                                    payslips?.current_page
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    router.get(
                                                                        `/employees/${employee.id}?tab=payslip&page_payslips=${page}`,
                                                                        {
                                                                            per_page_payslips:
                                                                                perPagePayslips !==
                                                                                '10'
                                                                                    ? perPagePayslips
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
                                                                payslips?.current_page ===
                                                                payslips?.last_page
                                                            }
                                                            onClick={() =>
                                                                router.get(
                                                                    `/employees/${employee.id}?tab=payslip&page_payslips=${(payslips?.current_page || 1) + 1}`,
                                                                    {
                                                                        per_page_payslips:
                                                                            perPagePayslips !==
                                                                            '10'
                                                                                ? perPagePayslips
                                                                                : undefined,
                                                                    },
                                                                    {
                                                                        preserveState: true,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Add Leave Credit Modal */}
            <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Leave Credit</DialogTitle>
                        <DialogDescription>
                            Add a new leave credit allocation for this employee.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCredit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="leave_type">Leave Type *</Label>
                                <Select
                                    value={selectedLeaveType}
                                    onValueChange={(value) => {
                                        setSelectedLeaveType(value);
                                        if (value !== 'custom') {
                                            creditForm.setData(
                                                'leave_type',
                                                value,
                                            );
                                            setCustomLeaveType('');
                                        } else {
                                            creditForm.setData(
                                                'leave_type',
                                                '',
                                            );
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map((type) => (
                                            <SelectItem
                                                key={type.id}
                                                value={type.name}
                                            >
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="custom">
                                            Custom (Add New)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {creditForm.errors.leave_type && (
                                    <p className="text-sm text-red-500">
                                        {creditForm.errors.leave_type}
                                    </p>
                                )}
                            </div>
                            {selectedLeaveType === 'custom' && (
                                <div className="space-y-2">
                                    <Label htmlFor="custom_leave_type">
                                        Custom Leave Type *
                                    </Label>
                                    <Input
                                        id="custom_leave_type"
                                        value={customLeaveType}
                                        onChange={(e) => {
                                            setCustomLeaveType(e.target.value);
                                            creditForm.setData(
                                                'leave_type',
                                                e.target.value,
                                            );
                                        }}
                                        placeholder="e.g., Maternity Leave"
                                        required
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="total_days">Total Days *</Label>
                                <Input
                                    id="total_days"
                                    type="number"
                                    step="0.5"
                                    value={creditForm.data.total_days}
                                    onChange={(e) =>
                                        creditForm.setData(
                                            'total_days',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., 15"
                                    required
                                />
                                {creditForm.errors.total_days && (
                                    <p className="text-sm text-red-500">
                                        {creditForm.errors.total_days}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Remaining days will be set to match total
                                    days initially.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreditModal(false)}
                                disabled={creditForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creditForm.processing}
                            >
                                {creditForm.processing
                                    ? 'Adding...'
                                    : 'Add Credit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Leave Credit Modal */}
            <Dialog
                open={showEditCreditModal}
                onOpenChange={setShowEditCreditModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Leave Credit</DialogTitle>
                        <DialogDescription>
                            Update the leave credit allocation for this
                            employee.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateCredit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_leave_type">
                                    Leave Type
                                </Label>
                                <Input
                                    id="edit_leave_type"
                                    value={editCreditForm.data.leave_type}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_total_days">
                                    Total Days *
                                </Label>
                                <Input
                                    id="edit_total_days"
                                    type="number"
                                    step="0.5"
                                    value={editCreditForm.data.total_days}
                                    onChange={(e) =>
                                        editCreditForm.setData(
                                            'total_days',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {editCreditForm.errors.total_days && (
                                    <p className="text-sm text-red-500">
                                        {editCreditForm.errors.total_days}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_remaining_days">
                                    Remaining Days *
                                </Label>
                                <Input
                                    id="edit_remaining_days"
                                    type="number"
                                    step="0.5"
                                    value={editCreditForm.data.remaining_days}
                                    onChange={(e) =>
                                        editCreditForm.setData(
                                            'remaining_days',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                {editCreditForm.errors.remaining_days && (
                                    <p className="text-sm text-red-500">
                                        {editCreditForm.errors.remaining_days}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditCreditModal(false)}
                                disabled={editCreditForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editCreditForm.processing}
                            >
                                {editCreditForm.processing
                                    ? 'Updating...'
                                    : 'Update Credit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* File Leave Modal */}
            <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>File Leave</DialogTitle>
                        <DialogDescription>
                            Submit a new leave application for this employee.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFileLeave}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="leave_type_file">
                                    Leave Type *
                                </Label>
                                <Select
                                    value={leaveForm.data.leave_type}
                                    onValueChange={(value) =>
                                        leaveForm.setData('leave_type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select leave type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveCredits.map((credit) => (
                                            <SelectItem
                                                key={credit.id}
                                                value={credit.leave_type}
                                            >
                                                {credit.leave_type} (
                                                {credit.remaining_days}
                                                days left)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration *</Label>
                                    <Select
                                        value={leaveForm.data.duration}
                                        onValueChange={(value) =>
                                            leaveForm.setData('duration', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full Day">
                                                Full Day
                                            </SelectItem>
                                            <SelectItem value="Half Day">
                                                Half Day
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">
                                        Date From *
                                    </Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={leaveForm.data.date_from}
                                        onChange={(e) =>
                                            leaveForm.setData(
                                                'date_from',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Date To *</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={leaveForm.data.date_to}
                                        onChange={(e) =>
                                            leaveForm.setData(
                                                'date_to',
                                                e.target.value,
                                            )
                                        }
                                        min={leaveForm.data.date_from}
                                        required
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Days will be automatically calculated based on
                                date range. Half Day applies only to single-day
                                leaves.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input
                                    id="remarks"
                                    value={leaveForm.data.remarks}
                                    onChange={(e) =>
                                        leaveForm.setData(
                                            'remarks',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional notes or reason"
                                />
                            </div>
                            {Object.keys(leaveForm.errors).length > 0 && (
                                <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
                                    <p className="text-sm font-semibold text-red-800">
                                        Please fix the following errors:
                                    </p>
                                    <ul className="space-y-1">
                                        {leaveForm.errors.leave_type && (
                                            <li className="text-sm text-red-600">
                                                • {leaveForm.errors.leave_type}
                                            </li>
                                        )}
                                        {leaveForm.errors.duration && (
                                            <li className="text-sm text-red-600">
                                                • {leaveForm.errors.duration}
                                            </li>
                                        )}
                                        {leaveForm.errors.date_from && (
                                            <li className="text-sm text-red-600">
                                                • {leaveForm.errors.date_from}
                                            </li>
                                        )}
                                        {leaveForm.errors.date_to && (
                                            <li className="text-sm text-red-600">
                                                • {leaveForm.errors.date_to}
                                            </li>
                                        )}
                                        {leaveForm.errors.remarks && (
                                            <li className="text-sm text-red-600">
                                                • {leaveForm.errors.remarks}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowLeaveModal(false)}
                                disabled={leaveForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={leaveForm.processing}
                            >
                                {leaveForm.processing
                                    ? 'Filing...'
                                    : 'File Leave'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Leave History Modal */}
            <Dialog
                open={showEditLeaveModal}
                onOpenChange={(open) => {
                    setShowEditLeaveModal(open);
                    if (!open) {
                        editLeaveHistoryForm.reset();
                        setSelectedLeaveHistory(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Leave Record</DialogTitle>
                        <DialogDescription>
                            Update the leave record details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateLeaveHistory}>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="leave_type">
                                        Leave Type *
                                    </Label>
                                    <Select
                                        value={
                                            editLeaveHistoryForm.data.leave_type
                                        }
                                        onValueChange={(value) =>
                                            editLeaveHistoryForm.setData(
                                                'leave_type',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {leaveTypes.map((type) => (
                                                <SelectItem
                                                    key={type.id}
                                                    value={type.name}
                                                >
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {editLeaveHistoryForm.errors.leave_type && (
                                        <p className="text-sm text-red-500">
                                            {
                                                editLeaveHistoryForm.errors
                                                    .leave_type
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration *</Label>
                                    <Select
                                        value={
                                            editLeaveHistoryForm.data.duration
                                        }
                                        onValueChange={(value) =>
                                            editLeaveHistoryForm.setData(
                                                'duration',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full Day">
                                                Full Day
                                            </SelectItem>
                                            <SelectItem value="Half Day">
                                                Half Day
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {editLeaveHistoryForm.errors.duration && (
                                        <p className="text-sm text-red-500">
                                            {
                                                editLeaveHistoryForm.errors
                                                    .duration
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">
                                        Date From *
                                    </Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={
                                            editLeaveHistoryForm.data.date_from
                                        }
                                        onChange={(e) =>
                                            editLeaveHistoryForm.setData(
                                                'date_from',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {editLeaveHistoryForm.errors.date_from && (
                                        <p className="text-sm text-red-500">
                                            {
                                                editLeaveHistoryForm.errors
                                                    .date_from
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Date To *</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={
                                            editLeaveHistoryForm.data.date_to
                                        }
                                        onChange={(e) =>
                                            editLeaveHistoryForm.setData(
                                                'date_to',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {editLeaveHistoryForm.errors.date_to && (
                                        <p className="text-sm text-red-500">
                                            {
                                                editLeaveHistoryForm.errors
                                                    .date_to
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input
                                    id="remarks"
                                    value={editLeaveHistoryForm.data.remarks}
                                    onChange={(e) =>
                                        editLeaveHistoryForm.setData(
                                            'remarks',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional remarks"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowEditLeaveModal(false)}
                                disabled={editLeaveHistoryForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editLeaveHistoryForm.processing}
                            >
                                {editLeaveHistoryForm.processing
                                    ? 'Updating...'
                                    : 'Update Leave'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Deduction Modal */}
            <Dialog
                open={showDeductionModal}
                onOpenChange={(open) => {
                    setShowDeductionModal(open);
                    if (!open) {
                        setIsAddingCustomDeductionType(false);
                        deductionForm.reset();
                    }
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Deduction</DialogTitle>
                        <DialogDescription>
                            Create a new salary deduction for this employee.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDeduction}>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="deduction_type">
                                        Deduction Type *
                                    </Label>
                                    {!isAddingCustomDeductionType ? (
                                        <Select
                                            value={
                                                deductionForm.data
                                                    .deduction_type
                                            }
                                            onValueChange={(value) => {
                                                if (value === 'add_custom') {
                                                    setIsAddingCustomDeductionType(
                                                        true,
                                                    );
                                                    deductionForm.setData({
                                                        deduction_type: 'other',
                                                        custom_type: '',
                                                    });
                                                } else {
                                                    deductionForm.setData(
                                                        'deduction_type',
                                                        value,
                                                    );
                                                    deductionForm.setData(
                                                        'custom_type',
                                                        '',
                                                    );
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select deduction type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="company_loan">
                                                    Company Loan
                                                </SelectItem>
                                                <SelectItem value="cash_advance">
                                                    Cash Advance
                                                </SelectItem>
                                                <SelectItem value="sss_loan">
                                                    SSS Loan
                                                </SelectItem>
                                                <SelectItem value="hdmf_loan">
                                                    HDMF Loan
                                                </SelectItem>
                                                {customDeductionTypes.length >
                                                    0 && (
                                                    <>
                                                        <div className="my-1 h-px bg-gray-200" />
                                                        {customDeductionTypes.map(
                                                            (type) => (
                                                                <SelectItem
                                                                    key={type}
                                                                    value={`custom:${type}`}
                                                                >
                                                                    {type}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </>
                                                )}
                                                <div className="my-1 h-px bg-gray-200" />
                                                <SelectItem value="add_custom">
                                                    + Add Custom Type
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter custom deduction type"
                                                value={
                                                    deductionForm.data
                                                        .custom_type
                                                }
                                                onChange={(e) =>
                                                    deductionForm.setData(
                                                        'custom_type',
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddingCustomDeductionType(
                                                        false,
                                                    );
                                                    deductionForm.setData({
                                                        deduction_type: '',
                                                        custom_type: '',
                                                    });
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                    {deductionForm.errors.deduction_type && (
                                        <p className="text-sm text-red-500">
                                            {
                                                deductionForm.errors
                                                    .deduction_type
                                            }
                                        </p>
                                    )}
                                    {deductionForm.errors.custom_type && (
                                        <p className="text-sm text-red-500">
                                            {deductionForm.errors.custom_type}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={deductionForm.data.amount}
                                        onChange={(e) =>
                                            deductionForm.setData(
                                                'amount',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g., 5000.00"
                                        required
                                    />
                                    {deductionForm.errors.amount && (
                                        <p className="text-sm text-red-500">
                                            {deductionForm.errors.amount}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="term">
                                        Term (Number of Payments) *
                                    </Label>
                                    <Input
                                        id="term"
                                        type="number"
                                        value={deductionForm.data.term}
                                        onChange={(e) =>
                                            deductionForm.setData(
                                                'term',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g., 12"
                                        required
                                    />
                                    {deductionForm.errors.term && (
                                        <p className="text-sm text-red-500">
                                            {deductionForm.errors.term}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cut_off">Cut-off *</Label>
                                    <Select
                                        value={deductionForm.data.cut_off}
                                        onValueChange={(value) =>
                                            deductionForm.setData(
                                                'cut_off',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1st_half">
                                                {formatCutoffLabel('1st_half')}
                                            </SelectItem>
                                            <SelectItem value="2nd_half">
                                                {formatCutoffLabel('2nd_half')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {deductionForm.errors.cut_off && (
                                        <p className="text-sm text-red-500">
                                            {deductionForm.errors.cut_off}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">
                                        Start Date *
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={deductionForm.data.start_date}
                                        onChange={(e) =>
                                            deductionForm.setData(
                                                'start_date',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {deductionForm.errors.start_date && (
                                        <p className="text-sm text-red-500">
                                            {deductionForm.errors.start_date}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    value={deductionForm.data.notes}
                                    onChange={(e) =>
                                        deductionForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional notes or remarks"
                                />
                                {deductionForm.errors.notes && (
                                    <p className="text-sm text-red-500">
                                        {deductionForm.errors.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeductionModal(false)}
                                disabled={deductionForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={deductionForm.processing}
                            >
                                {deductionForm.processing
                                    ? 'Adding...'
                                    : 'Add Deduction'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Deduction Modal */}
            <Dialog
                open={showEditDeductionModal}
                onOpenChange={setShowEditDeductionModal}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Deduction</DialogTitle>
                        <DialogDescription>
                            Update the salary deduction for this employee.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateDeduction}>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_amount">
                                        Amount *
                                    </Label>
                                    <Input
                                        id="edit_amount"
                                        type="number"
                                        step="0.01"
                                        value={editDeductionForm.data.amount}
                                        onChange={(e) =>
                                            editDeductionForm.setData(
                                                'amount',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {editDeductionForm.errors.amount && (
                                        <p className="text-sm text-red-500">
                                            {editDeductionForm.errors.amount}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_term">
                                        Term (months) *
                                    </Label>
                                    <Input
                                        id="edit_term"
                                        type="number"
                                        value={editDeductionForm.data.term}
                                        onChange={(e) =>
                                            editDeductionForm.setData(
                                                'term',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {editDeductionForm.errors.term && (
                                        <p className="text-sm text-red-500">
                                            {editDeductionForm.errors.term}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_cut_off">
                                        Cut-off *
                                    </Label>
                                    <Select
                                        value={editDeductionForm.data.cut_off}
                                        onValueChange={(value) =>
                                            editDeductionForm.setData(
                                                'cut_off',
                                                value as
                                                    | '1st_half'
                                                    | '2nd_half',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1st_half">
                                                {formatCutoffLabel('1st_half')}
                                            </SelectItem>
                                            <SelectItem value="2nd_half">
                                                {formatCutoffLabel('2nd_half')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit_start_date">
                                        Start Date *
                                    </Label>
                                    <Input
                                        id="edit_start_date"
                                        type="date"
                                        value={
                                            editDeductionForm.data.start_date
                                        }
                                        onChange={(e) =>
                                            editDeductionForm.setData(
                                                'start_date',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {editDeductionForm.errors.start_date && (
                                        <p className="text-sm text-red-500">
                                            {
                                                editDeductionForm.errors
                                                    .start_date
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_notes">Notes</Label>
                                <Input
                                    id="edit_notes"
                                    value={editDeductionForm.data.notes}
                                    onChange={(e) =>
                                        editDeductionForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowEditDeductionModal(false);
                                    setSelectedDeduction(null);
                                    editDeductionForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editDeductionForm.processing}
                            >
                                {editDeductionForm.processing
                                    ? 'Updating...'
                                    : 'Update Deduction'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Payments Modal */}
            <Dialog
                open={showPaymentsModal}
                onOpenChange={setShowPaymentsModal}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Payment History</DialogTitle>
                        <DialogDescription>
                            {selectedDeduction && (
                                <>
                                    {getDeductionTypeDisplay(selectedDeduction)}{' '}
                                    - Total:{' '}
                                    {formatCurrency(selectedDeduction.amount)} |
                                    Monthly Payment:{' '}
                                    {formatCurrency(
                                        (
                                            parseFloat(
                                                selectedDeduction.amount,
                                            ) / selectedDeduction.term
                                        ).toString(),
                                    )}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {loadingPayments ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Loading payments...
                                </p>
                            </div>
                        ) : deductionPayments.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No payments recorded yet.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Payroll Period</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Balance After
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deductionPayments.map((payment, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {formatDate(
                                                    payment.payment_date,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {payment.payroll_period}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payment.amount)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    payment.balance_after,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPaymentsModal(false);
                                setSelectedDeduction(null);
                                setDeductionPayments([]);
                            }}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Modal */}
            <Dialog
                open={showScheduleModal}
                onOpenChange={(open) => {
                    if (!open) {
                        // Clean up when closing the modal
                        scheduleForm.reset();
                        setSelectedDays(new Map());
                        setMarkAs('work');
                    }
                    setShowScheduleModal(open);
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pr-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Time In</Label>
                                <Input
                                    type="time"
                                    value={scheduleForm.data.time_in}
                                    onChange={(e) =>
                                        scheduleForm.setData(
                                            'time_in',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time Out</Label>
                                <Input
                                    type="time"
                                    value={scheduleForm.data.time_out}
                                    onChange={(e) =>
                                        scheduleForm.setData(
                                            'time_out',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
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
                                    onClick={() => setMarkAs('work')}
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
                                    onClick={() => setMarkAs('rest')}
                                >
                                    Rest Day
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between rounded-md bg-blue-50 p-2">
                                    <span className="text-sm font-medium text-blue-900">
                                        Days Selected:
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {selectedDays.size}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Select unlimited days. Click to toggle
                                    between working days and rest days.
                                </p>
                            </div>
                        </div>
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
                                    {generateCalendarDays().map(
                                        (dayObj, idx) => {
                                            const dateStr = dayObj.dateStr;
                                            const dayType =
                                                selectedDays.get(dateStr);
                                            const isSelected =
                                                dayType !== undefined;
                                            const isDisabled =
                                                usedDatesMap.has(dateStr);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() =>
                                                        handleDayClick(
                                                            dateStr,
                                                            isDisabled,
                                                        )
                                                    }
                                                    className={`aspect-square rounded border text-sm font-medium transition-colors ${
                                                        !dayObj.isCurrentMonth
                                                            ? 'opacity-30'
                                                            : ''
                                                    } ${
                                                        isDisabled
                                                            ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400'
                                                            : isSelected
                                                              ? dayType ===
                                                                'work'
                                                                  ? 'border-blue-700 bg-blue-600 text-white'
                                                                  : 'border-red-700 bg-red-600 text-white'
                                                              : dayObj.isCurrentMonth
                                                                ? 'bg-background hover:bg-gray-100'
                                                                : 'bg-muted hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {dayObj.day}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowScheduleModal(false);
                                    setSelectedDays(new Map());
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSaveSchedule}>
                                Save Schedule
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Schedule Modal */}
            <Dialog
                open={showViewScheduleModal}
                onOpenChange={setShowViewScheduleModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Schedule</DialogTitle>
                    </DialogHeader>
                    {selectedSchedule && (
                        <div className="space-y-6" id="employee-schedule-view">
                            <div className="mb-4 space-y-1 text-center">
                                <h2 className="text-xl font-bold text-foreground">
                                    {employee.department || 'HR Department'} –
                                    Employee Schedule
                                </h2>
                                <div className="inline-block space-y-1 text-left text-sm text-muted-foreground">
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
                                            Weeks:
                                        </span>{' '}
                                        {selectedSchedule.weeks}
                                    </p>
                                    <div className="pt-2">
                                        <span className="font-medium text-foreground">
                                            Legend:
                                        </span>{' '}
                                        <span className="ml-2 font-medium text-blue-600">
                                            Work Days
                                        </span>{' '}
                                        <span className="ml-2 font-medium text-red-600">
                                            Rest Days
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Date Created</Label>
                                    <p className="text-sm">
                                        {selectedSchedule.date_created}
                                    </p>
                                </div>
                                <div>
                                    <Label>Weeks</Label>
                                    <p className="text-sm">
                                        {selectedSchedule.weeks} week(s)
                                    </p>
                                </div>
                                <div>
                                    <Label>Total Days</Label>
                                    <p className="text-sm">
                                        {selectedSchedule.count} days
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">Calendar</div>
                                    <div className="flex items-center gap-2">
                                        <span className="min-w-[100px] text-center text-sm font-medium">
                                            {months[selectedMonth - 1]}{' '}
                                            {selectedYear}
                                        </span>
                                    </div>
                                </div>
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
                                    {generateCalendarDays().map(
                                        (dayObj, idx) => {
                                            const dateStr = dayObj.dateStr;
                                            const dayType =
                                                selectedDays.get(dateStr);
                                            const isSelected =
                                                dayType !== undefined;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex aspect-square items-center justify-center rounded border text-sm font-medium transition-colors ${
                                                        !dayObj.isCurrentMonth
                                                            ? 'opacity-30'
                                                            : ''
                                                    } ${
                                                        isSelected
                                                            ? dayType === 'work'
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
                                <div className="mt-2 flex items-center justify-end gap-2">
                                    <Link
                                        href={`/employees/${employee.id}/schedule/${selectedSchedule.schedule_file_id}/show`}
                                    >
                                        <Button variant="outline">
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Full Page
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        onClick={handleDownloadSchedule}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Image
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Schedule Modal - Same UI as Add Schedule */}
            <Dialog
                open={showEditScheduleModal}
                onOpenChange={setShowEditScheduleModal}
            >
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pr-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Time In</Label>
                                <Input
                                    type="time"
                                    value={scheduleForm.data.time_in}
                                    onChange={(e) =>
                                        scheduleForm.setData(
                                            'time_in',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time Out</Label>
                                <Input
                                    type="time"
                                    value={scheduleForm.data.time_out}
                                    onChange={(e) =>
                                        scheduleForm.setData(
                                            'time_out',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
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
                                    onClick={() => setMarkAs('work')}
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
                                    onClick={() => setMarkAs('rest')}
                                >
                                    Rest Day
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between rounded-md bg-blue-50 p-2">
                                    <span className="text-sm font-medium text-blue-900">
                                        Days Selected:
                                    </span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {selectedDays.size}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Select unlimited days. Click to toggle
                                    between working days and rest days.
                                </p>
                            </div>
                        </div>
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
                                    {generateCalendarDays().map(
                                        (dayObj, idx) => {
                                            const dateStr = dayObj.dateStr;
                                            const dayType =
                                                selectedDays.get(dateStr);
                                            const isSelected =
                                                dayType !== undefined;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() =>
                                                        handleDayClick(
                                                            dateStr,
                                                            false,
                                                        )
                                                    }
                                                    className={`aspect-square rounded border text-sm font-medium transition-colors ${
                                                        !dayObj.isCurrentMonth
                                                            ? 'opacity-30'
                                                            : ''
                                                    } ${
                                                        isSelected
                                                            ? dayType === 'work'
                                                                ? 'border-blue-700 bg-blue-600 text-white'
                                                                : 'border-red-700 bg-red-600 text-white'
                                                            : dayObj.isCurrentMonth
                                                              ? 'bg-background hover:bg-gray-100'
                                                              : 'bg-muted hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {dayObj.day}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowEditScheduleModal(false);
                                    setSelectedDays(new Map());
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSaveSchedule}>
                                Update Schedule
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
