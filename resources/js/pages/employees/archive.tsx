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
import { canEdit } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, Eye, RotateCcw, Search, Trash2, X } from 'lucide-react';
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
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Archive',
        href: '/employees/archive',
    },
];

export default function EmployeesArchive({
    employees,
    departments,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [department, setDepartment] = useState(filters.department || 'all');

    // Auto-search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/employees/archive',
                {
                    search: search || undefined,
                    department: department !== 'all' ? department : undefined,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, department]);

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

    const handleForceDelete = (id: number) => {
        if (
            confirm(
                'Are you sure you want to permanently delete this employee? This action cannot be undone.',
            )
        ) {
            router.delete(`/employees/${id}/force-delete`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Employee permanently deleted!');
                },
                onError: () => {
                    toast.error('Failed to delete employee.');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Archived Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Archived Employees
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage archived employees
                                </p>
                            </div>
                        </div>
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
                                        No archived employees found.
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
                                                {employee.status || 'Unknown'}
                                            </Badge>
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
                                                {canEdit('employees') && (
                                                    <>
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
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleForceDelete(
                                                                    employee.id,
                                                                )
                                                            }
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
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
                {employees.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {employees.data.length} of {employees.total}{' '}
                            archived employees
                        </p>
                        <div className="flex gap-2">
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
                                            `/employees/archive?page=${page}`,
                                            {
                                                search: search || undefined,
                                                department:
                                                    department !== 'all'
                                                        ? department
                                                        : undefined,
                                            },
                                            { preserveState: true },
                                        )
                                    }
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
