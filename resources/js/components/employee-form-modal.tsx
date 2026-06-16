import { Button } from '@/components/ui/button';
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
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    date_of_birth: string | null;
    hire_date: string;
    position: string;
    department: string | null;
    salary: string;
    employment_type: string;
    status: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    country: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
}

interface EmployeeFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee?: Employee | null;
    onSuccess?: () => void;
}

export default function EmployeeFormModal({
    open,
    onOpenChange,
    employee,
    onSuccess,
}: EmployeeFormModalProps) {
    const isEditing = !!employee;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        date_of_birth: employee?.date_of_birth || '',
        hire_date: employee?.hire_date || '',
        position: employee?.position || '',
        department: employee?.department || '',
        salary: employee?.salary || '',
        employment_type: employee?.employment_type || 'full-time',
        status: employee?.status || 'active',
        address: employee?.address || '',
        city: employee?.city || '',
        state: employee?.state || '',
        zip_code: employee?.zip_code || '',
        country: employee?.country || '',
        emergency_contact_name: employee?.emergency_contact_name || '',
        emergency_contact_phone: employee?.emergency_contact_phone || '',
    });

    // Reset form when employee changes
    useEffect(() => {
        if (employee) {
            setData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                date_of_birth: employee.date_of_birth || '',
                hire_date: employee.hire_date || '',
                position: employee.position || '',
                department: employee.department || '',
                salary: employee.salary || '',
                employment_type: employee.employment_type || 'full-time',
                status: employee.status || 'active',
                address: employee.address || '',
                city: employee.city || '',
                state: employee.state || '',
                zip_code: employee.zip_code || '',
                country: employee.country || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_phone: employee.emergency_contact_phone || '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [employee, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    isEditing
                        ? 'Employee updated successfully!'
                        : 'Employee created successfully!'
                );
                onOpenChange(false);
                reset();
                onSuccess?.();
            },
            onError: () => {
                toast.error('Something went wrong. Please check the form and try again.');
            },
        };

        if (isEditing && employee) {
            put(`/employees/${employee.id}`, options);
        } else {
            post('/employees', options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Employee' : 'Create New Employee'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update employee information below.'
                            : 'Fill in the employee details below.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Personal Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    required
                                />
                                {errors.first_name && (
                                    <p className="text-sm text-red-500">{errors.first_name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last_name">
                                    Last Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    required
                                />
                                {errors.last_name && (
                                    <p className="text-sm text-red-500">{errors.last_name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth">Date of Birth</Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                />
                                {errors.date_of_birth && (
                                    <p className="text-sm text-red-500">{errors.date_of_birth}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Employment Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Employment Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="hire_date">
                                    Hire Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="hire_date"
                                    type="date"
                                    value={data.hire_date}
                                    onChange={(e) => setData('hire_date', e.target.value)}
                                    required
                                />
                                {errors.hire_date && (
                                    <p className="text-sm text-red-500">{errors.hire_date}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="position">
                                    Position <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="position"
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                    required
                                />
                                {errors.position && (
                                    <p className="text-sm text-red-500">{errors.position}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={data.department}
                                    onChange={(e) => setData('department', e.target.value)}
                                />
                                {errors.department && (
                                    <p className="text-sm text-red-500">{errors.department}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salary">
                                    Salary <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="salary"
                                    type="number"
                                    step="0.01"
                                    value={data.salary}
                                    onChange={(e) => setData('salary', e.target.value)}
                                    required
                                />
                                {errors.salary && (
                                    <p className="text-sm text-red-500">{errors.salary}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="employment_type">
                                    Employment Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.employment_type}
                                    onValueChange={(value) => setData('employment_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full-time">Full Time</SelectItem>
                                        <SelectItem value="part-time">Part Time</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="intern">Intern</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.employment_type && (
                                    <p className="text-sm text-red-500">
                                        {errors.employment_type}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="on-leave">On Leave</SelectItem>
                                        <SelectItem value="terminated">Terminated</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-red-500">{errors.status}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Address Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                {errors.address && (
                                    <p className="text-sm text-red-500">{errors.address}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                />
                                {errors.city && (
                                    <p className="text-sm text-red-500">{errors.city}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value)}
                                />
                                {errors.state && (
                                    <p className="text-sm text-red-500">{errors.state}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zip_code">Zip Code</Label>
                                <Input
                                    id="zip_code"
                                    value={data.zip_code}
                                    onChange={(e) => setData('zip_code', e.target.value)}
                                />
                                {errors.zip_code && (
                                    <p className="text-sm text-red-500">{errors.zip_code}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                />
                                {errors.country && (
                                    <p className="text-sm text-red-500">{errors.country}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Emergency Contact</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                                <Input
                                    id="emergency_contact_name"
                                    value={data.emergency_contact_name}
                                    onChange={(e) =>
                                        setData('emergency_contact_name', e.target.value)
                                    }
                                />
                                {errors.emergency_contact_name && (
                                    <p className="text-sm text-red-500">
                                        {errors.emergency_contact_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                                <Input
                                    id="emergency_contact_phone"
                                    type="tel"
                                    value={data.emergency_contact_phone}
                                    onChange={(e) =>
                                        setData('emergency_contact_phone', e.target.value)
                                    }
                                />
                                {errors.emergency_contact_phone && (
                                    <p className="text-sm text-red-500">
                                        {errors.emergency_contact_phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? isEditing
                                    ? 'Updating...'
                                    : 'Creating...'
                                : isEditing
                                  ? 'Update Employee'
                                  : 'Create Employee'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
