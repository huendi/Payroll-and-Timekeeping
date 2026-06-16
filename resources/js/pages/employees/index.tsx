import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { canCreate, canEdit } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    Plus,
    RotateCcw,
    Search,
    X,
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
    status: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedEmployees {
    data: Employee[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    employees: PaginatedEmployees;
    departments: { name: string }[];
    filters: {
        search?: string;
        department?: string;
        archived?: string;
        per_page?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

export default function EmployeesIndex({
    employees,
    departments,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [department, setDepartment] = useState(filters.department || 'all');
    const [archived, setArchived] = useState(filters.archived || 'active');
    const [perPage, setPerPage] = useState(filters.per_page || '10');

    // Auto-search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/employees',
                {
                    search: search || undefined,
                    department: department !== 'all' ? department : undefined,
                    archived: archived !== 'active' ? archived : undefined,
                    per_page: perPage !== '10' ? perPage : undefined,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, department, archived, perPage]);

    const handleArchive = (id: number) => {
        if (confirm('Are you sure you want to archive this employee?')) {
            router.delete(`/employees/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Employee archived successfully!');
                },
                onError: () => {
                    toast.error('Failed to archive employee.');
                },
            });
        }
    };

    const handleRestore = (id: number) => {
        if (confirm('Are you sure you want to restore this employee?')) {
            router.post(
                `/employees/${id}/restore`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Employee restored successfully!');
                    },
                    onError: () => {
                        toast.error('Failed to restore employee.');
                    },
                },
            );
        }
    };

    const handleCreate = () => {
        router.visit('/employees/create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Employees
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your organization's employees
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/employees/archive">
                            <Button variant="outline">
                                <Archive className="mr-2 h-4 w-4" />
                                Archives
                            </Button>
                        </Link>
                        {canCreate('employees') && (
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Employee
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative w-[300px]">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-10 pl-10"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.name} value={dept.name}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Employee Number</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center"
                                    >
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.data.map((employee, index) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            {(employees.current_page - 1) *
                                                employees.per_page +
                                                index +
                                                1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {employee.last_name},{' '}
                                            {employee.first_name}{' '}
                                            {employee.middle_name}
                                        </TableCell>
                                        <TableCell>
                                            {employee.employee_number}
                                        </TableCell>
                                        <TableCell>
                                            {employee.position || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {employee.email || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {employee.deleted_at ? (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                                >
                                                    Archived
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize ${
                                                        employee.status ===
                                                        'regular'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            : employee.status ===
                                                                'probationary'
                                                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                    }`}
                                                >
                                                    {employee.status ||
                                                        'Unknown'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/employees/${employee.id}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {canEdit('employees') &&
                                                    !employee.deleted_at && (
                                                        <>
                                                            <Link
                                                                href={`/employees/${employee.id}/edit`}
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleArchive(
                                                                        employee.id,
                                                                    )
                                                                }
                                                                title="Archive"
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                {canEdit('employees') &&
                                                    employee.deleted_at && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRestore(
                                                                    employee.id,
                                                                )
                                                            }
                                                            title="Restore"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {employees.data.length} of {employees.total}{' '}
                            employees
                        </p>
                        <Select value={perPage} onValueChange={setPerPage}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Items per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5 items</SelectItem>
                                <SelectItem value="10">10 items</SelectItem>
                                <SelectItem value="15">15 items</SelectItem>
                                <SelectItem value="30">30 items</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {employees.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={employees.current_page === 1}
                                onClick={() =>
                                    router.get(
                                        `/employees?page=${employees.current_page - 1}`,
                                        {
                                            search,
                                            department:
                                                department !== 'all'
                                                    ? department
                                                    : undefined,
                                            archived:
                                                archived !== 'active'
                                                    ? archived
                                                    : undefined,
                                            per_page:
                                                perPage !== '10'
                                                    ? perPage
                                                    : undefined,
                                        },
                                        { preserveState: true },
                                    )
                                }
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from(
                                { length: employees.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <Button
                                    key={page}
                                    variant={
                                        page === employees.current_page
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        router.get(
                                            `/employees?page=${page}`,
                                            {
                                                search,
                                                department:
                                                    department !== 'all'
                                                        ? department
                                                        : undefined,
                                                archived:
                                                    archived !== 'active'
                                                        ? archived
                                                        : undefined,
                                                per_page:
                                                    perPage !== '10'
                                                        ? perPage
                                                        : undefined,
                                            },
                                            { preserveState: true },
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
                                    employees.current_page ===
                                    employees.last_page
                                }
                                onClick={() =>
                                    router.get(
                                        `/employees?page=${employees.current_page + 1}`,
                                        {
                                            search,
                                            department:
                                                department !== 'all'
                                                    ? department
                                                    : undefined,
                                            archived:
                                                archived !== 'active'
                                                    ? archived
                                                    : undefined,
                                            per_page:
                                                perPage !== '10'
                                                    ? perPage
                                                    : undefined,
                                        },
                                        { preserveState: true },
                                    )
                                }
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
