import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit } from 'lucide-react';

interface StaffUser {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    department: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

interface Props {
    staffUser: StaffUser;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff Management',
        href: '/staff',
    },
    {
        title: 'View Staff User',
        href: '#',
    },
];

export default function ShowStaff({ staffUser }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${staffUser.first_name} ${staffUser.last_name}`} />

            <div className="m-5 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold">
                            {staffUser.first_name} {staffUser.last_name}
                        </h1>
                    </div>
                    <Link href={`/staff/${staffUser.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff User Information</CardTitle>
                        <CardDescription>
                            Detailed information about this staff user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Role
                                </p>
                                <div className="mt-1">
                                    <Badge variant="outline" className="uppercase">
                                        {staffUser.role}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Employee Number
                                </p>
                                <p className="mt-1 text-lg">
                                    {staffUser.employee_number}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Department
                                </p>
                                <p className="mt-1 text-lg">
                                    {staffUser.department}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    First Name
                                </p>
                                <p className="mt-1 text-lg">
                                    {staffUser.first_name}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Last Name
                                </p>
                                <p className="mt-1 text-lg">
                                    {staffUser.last_name}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Email
                                </p>
                                <p className="mt-1 text-lg">{staffUser.email}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Status
                                </p>
                                <div className="mt-1">
                                    <Badge
                                        variant={
                                            staffUser.status === 'active'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {staffUser.status}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Created At
                                </p>
                                <p className="mt-1 text-lg">
                                    {new Date(
                                        staffUser.created_at,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Last Updated
                                </p>
                                <p className="mt-1 text-lg">
                                    {new Date(
                                        staffUser.updated_at,
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}