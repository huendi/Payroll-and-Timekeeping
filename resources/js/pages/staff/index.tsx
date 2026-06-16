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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StaffUser {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    department: string;
    email: string;
    role: 'hr' | 'finance';
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

interface PaginatedStaffUsers {
    data: StaffUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    staffUsers: PaginatedStaffUsers;
    filters: {
        search?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff Management',
        href: '/staff',
    },
];

export default function StaffIndex({ staffUsers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleSearch = (searchValue: string) => {
        router.get(
            '/staff',
            {
                search: searchValue || undefined,
                status: status !== 'all' ? status : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this Staff user?')) {
            router.delete(`/staff/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Staff user deleted successfully!');
                },
                onError: () => {
                    toast.error('Failed to delete Staff user.');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Management" />

            <div className="m-5 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <Link href="/staff/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Staff
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            handleSearch(e.target.value);
                        }}
                        className="w-64"
                    />
                    <Select
                        value={status}
                        onValueChange={(val) => {
                            setStatus(val);
                            router.get(
                                '/staff',
                                {
                                    search: search || undefined,
                                    status: val !== 'all' ? val : undefined,
                                },
                                {
                                    preserveState: true,
                                    replace: true,
                                },
                            );
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee Number</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffUsers.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center"
                                    >
                                        No Staff users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staffUsers.data.map((staff) => (
                                    <TableRow key={staff.id}>
                                        <TableCell className="font-medium">
                                            {staff.employee_number}
                                        </TableCell>
                                        <TableCell>
                                            {staff.first_name} {staff.last_name}
                                        </TableCell>
                                        <TableCell>
                                            {staff.department}
                                        </TableCell>
                                        <TableCell>{staff.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="uppercase"
                                            >
                                                {staff.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    staff.status === 'active'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {staff.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/staff/${staff.id}`}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/staff/${staff.id}/edit`}
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
                                                        handleDelete(staff.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {staffUsers.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {staffUsers.data.length} of{' '}
                            {staffUsers.total} results
                        </div>
                        <div className="flex gap-2">
                            {Array.from(
                                { length: staffUsers.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <Button
                                    key={page}
                                    variant={
                                        page === staffUsers.current_page
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => {
                                        router.get(
                                            '/staff',
                                            {
                                                page,
                                                search,
                                                status:
                                                    status !== 'all'
                                                        ? status
                                                        : undefined,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }}
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
