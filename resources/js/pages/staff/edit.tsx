import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface StaffUser {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    department: string;
    email: string;
    role: 'hr' | 'finance';
    status: 'active' | 'inactive';
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
        title: 'Edit Staff User',
        href: '#',
    },
];

export default function EditStaff({ staffUser }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        employee_number: staffUser.employee_number,
        department: staffUser.department,
        first_name: staffUser.first_name,
        last_name: staffUser.last_name,
        email: staffUser.email,
        password: '',
        password_confirmation: '',
        status: staffUser.status,
        role: staffUser.role,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const validatePassword = (password: string) => {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        return errors;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const password = e.target.value;
        setData('password', password);
        if (password) {
            setPasswordErrors(validatePassword(password));
        } else {
            setPasswordErrors([]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.password && passwordErrors.length > 0) {
            return;
        }
        if (
            data.password &&
            data.password_confirmation &&
            data.password !== data.password_confirmation
        ) {
            setPasswordErrors(['Passwords do not match']);
            return;
        }
        put(`/staff/${staffUser.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Staff User" />

            <div className="m-5 space-y-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">Edit Staff User</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff User Information</CardTitle>
                        <CardDescription>
                            Update the Staff user account details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role *</Label>
                                    <Select
                                        value={data.role}
                                        onValueChange={(value) =>
                                            setData(
                                                'role',
                                                value as 'hr' | 'finance',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hr">HR</SelectItem>
                                            <SelectItem value="finance">
                                                Finance
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <p className="text-sm text-destructive">
                                            {errors.role}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employee_number">
                                        Employee Number *
                                    </Label>
                                    <Input
                                        id="employee_number"
                                        value={data.employee_number}
                                        onChange={(e) =>
                                            setData(
                                                'employee_number',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="STF001"
                                        required
                                    />
                                    {errors.employee_number && (
                                        <p className="text-sm text-destructive">
                                            {errors.employee_number}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">
                                        Department *
                                    </Label>
                                    <Input
                                        id="department"
                                        value={data.department}
                                        onChange={(e) =>
                                            setData(
                                                'department',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Department"
                                        required
                                    />
                                    {errors.department && (
                                        <p className="text-sm text-destructive">
                                            {errors.department}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="first_name">
                                        First Name *
                                    </Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData(
                                                'first_name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="First Name"
                                        required
                                    />
                                    {errors.first_name && (
                                        <p className="text-sm text-destructive">
                                            {errors.first_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">
                                        Last Name *
                                    </Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData('last_name', e.target.value)
                                        }
                                        placeholder="Last Name"
                                        required
                                    />
                                    {errors.last_name && (
                                        <p className="text-sm text-destructive">
                                            {errors.last_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="email@example.com"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData(
                                                'status',
                                                value as 'active' | 'inactive',
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-destructive">
                                            {errors.status}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        New Password (Optional)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.password}
                                            onChange={handlePasswordChange}
                                            placeholder="••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {passwordErrors.length > 0 && (
                                        <div className="space-y-1">
                                            {passwordErrors.map(
                                                (
                                                    error: string,
                                                    idx: number,
                                                ) => (
                                                    <p
                                                        key={idx}
                                                        className="text-sm text-destructive"
                                                    >
                                                        • {error}
                                                    </p>
                                                ),
                                            )}
                                        </div>
                                    )}
                                    {errors.password && (
                                        <p className="text-sm text-destructive">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={
                                                showPasswordConfirm
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPasswordConfirm(
                                                    !showPasswordConfirm,
                                                )
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPasswordConfirm ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {data.password &&
                                        data.password_confirmation &&
                                        data.password !==
                                            data.password_confirmation && (
                                            <p className="text-sm text-destructive">
                                                • Passwords do not match
                                            </p>
                                        )}
                                    {errors.password_confirmation && (
                                        <p className="text-sm text-destructive">
                                            {errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Link href="/staff">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Updating...'
                                        : 'Update Staff User'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}