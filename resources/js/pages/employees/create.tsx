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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, ArrowLeft, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Department {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Create',
        href: '/employees/create',
    },
];

export default function CreateEmployee() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [showCustomDepartment, setShowCustomDepartment] = useState(false);
    const [customDepartment, setCustomDepartment] = useState('');
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({});

    // Validation functions
    const isUnder18 = (birthdate: string): boolean => {
        if (!birthdate) return false;
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age < 18;
    };

    const isValidPhilippineNumber = (number: string): boolean => {
        if (!number) return true; // Optional field
        // Philippine mobile: 09XX-XXX-XXXX or 09XXXXXXXXX or +63XXXXXXXXX
        const philippinePattern = /^(\+63|0)?9\d{9}$/;
        return philippinePattern.test(number.replace(/[-\s]/g, ''));
    };

    const validateForm = (): Record<string, string> => {
        const errors: Record<string, string> = {};

        // Required fields
        if (!data.employee_number.trim())
            errors.employee_number = 'Employee number is required';
        if (!data.department.trim())
            errors.department = 'Department is required';
        if (!data.first_name.trim())
            errors.first_name = 'First name is required';
        if (!data.last_name.trim()) errors.last_name = 'Last name is required';
        if (!data.email.trim()) errors.email = 'Email is required';
        if (!data.address.trim()) errors.address = 'Address is required';
        if (!data.birthdate.trim()) errors.birthdate = 'Birthdate is required';
        if (!data.gender.trim()) errors.gender = 'Gender is required';
        if (!data.civil_status.trim())
            errors.civil_status = 'Civil status is required';
        if (!data.nationality.trim())
            errors.nationality = 'Nationality is required';
        if (!data.sss.trim()) errors.sss = 'SSS number is required';
        if (!data.philhealth.trim())
            errors.philhealth = 'PhilHealth number is required';
        if (!data.pagibig.trim())
            errors.pagibig = 'Pag-IBIG number is required';
        if (!data.tin.trim()) errors.tin = 'TIN is required';
        if (!data.basic_rate.trim())
            errors.basic_rate = 'Basic rate is required';
        if (!data.rate_type.trim()) errors.rate_type = 'Rate type is required';
        if (!data.start_date.trim())
            errors.start_date = 'Start date is required';
        if (!data.status.trim())
            errors.status = 'Employment status is required';
        if (!data.bank_name.trim()) errors.bank_name = 'Bank name is required';

        // Age validation (18 years old)
        if (data.birthdate && isUnder18(data.birthdate)) {
            errors.birthdate = 'Employee must be at least 18 years old';
        }

        // Email validation
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = 'Invalid email address';
        }

        // Contact (mobile) validation - Philippine format
        if (data.contact && !isValidPhilippineNumber(data.contact)) {
            errors.contact =
                'Invalid Philippine mobile number (e.g., 09XX-XXX-XXXX or +63XXXXXXXXX)';
        }

        // Phone validation - Philippine format (optional)
        if (data.phone && !isValidPhilippineNumber(data.phone)) {
            errors.phone =
                'Invalid Philippine phone number (e.g., 09XX-XXX-XXXX or +63XXXXXXXXX)';
        }

        // Basic rate validation
        if (data.basic_rate && parseFloat(data.basic_rate) <= 0) {
            errors.basic_rate = 'Basic rate must be greater than 0';
        }

        // Allowance validation (optional but if provided must be >= 0)
        if (data.allowance && parseFloat(data.allowance) < 0) {
            errors.allowance = 'Allowance cannot be negative';
        }


        return errors;
    };

    const { data, setData, post, processing, errors } = useForm({
        department: '',
        employee_number: '',
        position: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        address: '',
        zip_code: '',
        contact: '',
        email: '',
        phone: '',
        birthplace: '',
        birthdate: '',
        age: '',
        gender: '',
        civil_status: '',
        religion: '',
        nationality: '',
        sss: '',
        philhealth: '',
        pagibig: '',
        tin: '',
        bank_name: '',
        bank_account: '',
        basic_rate: '',
        rate_type: '',
        allowance: '',
        start_date: '',
        status: 'probationary',
        photo: '',
    });

    // Fetch departments
    useEffect(() => {
        axios
            .get('/departments')
            .then((response) => {
                setDepartments(response.data);
            })
            .catch((error) => {
                console.error('Error fetching departments:', error);
            });
    }, []);

    // Auto-calculate age and validate
    useEffect(() => {
        if (data.birthdate) {
            const birthDate = new Date(data.birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setData('age', age.toString());

            // Show warning if under 18
            if (age < 18) {
                setValidationErrors((prev) => ({
                    ...prev,
                    birthdate: `Employee must be at least 18 years old (Current age: ${age})`,
                }));
            } else {
                setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.birthdate;
                    return newErrors;
                });
            }
        }
    }, [data.birthdate]);

    const handleDepartmentChange = (value: string) => {
        if (value === 'custom') {
            setShowCustomDepartment(true);
            setData('department', '');
        } else {
            setShowCustomDepartment(false);
            setData('department', value);
        }
    };

    const handleCustomDepartmentSave = async () => {
        if (!customDepartment.trim()) {
            toast.error('Please enter a department name');
            return;
        }

        try {
            const response = await axios.post('/departments', {
                name: customDepartment,
            });
            setDepartments([...departments, response.data]);
            setData('department', customDepartment);
            setShowCustomDepartment(false);
            setCustomDepartment('');
            toast.success('Department created successfully');
        } catch (error: any) {
            if (error.response?.data?.errors?.name) {
                toast.error(error.response.data.errors.name[0]);
            } else {
                toast.error('Failed to create department');
            }
        }
    };

    // Live validation for mobile number
    useEffect(() => {
        if (data.contact) {
            const errors = { ...validationErrors };
            if (!isValidPhilippineNumber(data.contact)) {
                errors.contact =
                    'Invalid Philippine mobile number (e.g., 09XX-XXX-XXXX or +63XXXXXXXXX)';
            } else {
                delete errors.contact;
            }
            setValidationErrors(errors);
        } else {
            const errors = { ...validationErrors };
            delete errors.contact;
            setValidationErrors(errors);
        }
    }, [data.contact]);

    // Live validation for telephone number
    useEffect(() => {
        if (data.phone) {
            const errors = { ...validationErrors };
            if (!isValidPhilippineNumber(data.phone)) {
                errors.phone =
                    'Invalid Philippine phone number (e.g., 09XX-XXX-XXXX or +63XXXXXXXXX)';
            } else {
                delete errors.phone;
            }
            setValidationErrors(errors);
        } else {
            const errors = { ...validationErrors };
            delete errors.phone;
            setValidationErrors(errors);
        }
    }, [data.phone]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form before submission
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setValidationErrors(formErrors);
            toast.error('Please fix the validation errors before submitting.');
            return;
        }

        post('/employees', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee created successfully!');
                router.visit('/employees');
            },
            onError: () => {
                toast.error('Please check the form for errors.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />
            <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Create Employee
                        </h1>
                        <p className="text-muted-foreground">
                            Add a new employee to the system
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSubmit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Employee
                        </Button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-6 lg:grid-cols-3"
                    >
                        {/* Left Column: Photo Only */}
                        <div className="space-y-6 lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Photo</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4">
                                    <div className="relative aspect-square w-48 overflow-hidden rounded-full border-4 border-muted bg-muted shadow-sm">
                                        {data.photo ? (
                                            <img
                                                src={URL.createObjectURL(
                                                    data.photo as unknown as Blob,
                                                )}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                                                <User className="h-20 w-20 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <Label
                                            htmlFor="photo"
                                            className="block w-full cursor-pointer rounded-md bg-secondary px-4 py-2 text-center text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                                        >
                                            Upload Photo
                                        </Label>
                                        <Input
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (
                                                    e.target.files &&
                                                    e.target.files[0]
                                                ) {
                                                    setData(
                                                        'photo',
                                                        e.target
                                                            .files[0] as any,
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    {errors.photo && (
                                        <p className="text-sm text-destructive">
                                            {errors.photo}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Tabs */}
                        <div className="lg:col-span-2">
                            <Tabs defaultValue="employment" className="w-full">
                                <TabsList className="w-full justify-start overflow-x-auto">
                                    <TabsTrigger value="employment">
                                        Employment
                                    </TabsTrigger>
                                    <TabsTrigger value="personal">
                                        Personal
                                    </TabsTrigger>
                                    <TabsTrigger value="contact">
                                        Contact
                                    </TabsTrigger>
                                    <TabsTrigger value="government">
                                        Government IDs
                                    </TabsTrigger>
                                    <TabsTrigger value="financial">
                                        Financial
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="employment">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Employment Details
                                            </CardTitle>
                                            <CardDescription>
                                                Job position and status
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="employee_number">
                                                    Employee Number{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
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
                                                    required
                                                    className={
                                                        validationErrors.employee_number ||
                                                        errors.employee_number
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.employee_number ||
                                                    errors.employee_number) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.employee_number ||
                                                            errors.employee_number}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="department">
                                                    Department{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                {!showCustomDepartment ? (
                                                    <Select
                                                        value={data.department}
                                                        onValueChange={
                                                            handleDepartmentChange
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select department" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {departments.map(
                                                                (dept) => (
                                                                    <SelectItem
                                                                        key={
                                                                            dept.id
                                                                        }
                                                                        value={
                                                                            dept.name
                                                                        }
                                                                    >
                                                                        {
                                                                            dept.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                            <SelectItem value="custom">
                                                                + Add Custom
                                                                Department
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <Input
                                                            placeholder="Enter department name"
                                                            value={
                                                                customDepartment
                                                            }
                                                            onChange={(e) =>
                                                                setCustomDepartment(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={
                                                                    handleCustomDepartmentSave
                                                                }
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setShowCustomDepartment(
                                                                        false,
                                                                    );
                                                                    setCustomDepartment(
                                                                        '',
                                                                    );
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                {(validationErrors.department ||
                                                    errors.department) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.department ||
                                                            errors.department}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="position">
                                                    Position
                                                </Label>
                                                <Input
                                                    id="position"
                                                    value={data.position}
                                                    onChange={(e) =>
                                                        setData(
                                                            'position',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="status">
                                                    Employment Status{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={data.status}
                                                    onValueChange={(value) =>
                                                        setData('status', value)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            validationErrors.status ||
                                                            errors.status
                                                                ? 'border-destructive'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="probationary">
                                                            Probationary
                                                        </SelectItem>
                                                        <SelectItem value="regular">
                                                            Regular
                                                        </SelectItem>
                                                        <SelectItem value="contractual">
                                                            Contractual
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {(validationErrors.status ||
                                                    errors.status) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.status ||
                                                            errors.status}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="start_date">
                                                    Start Date{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="start_date"
                                                    type="date"
                                                    value={data.start_date}
                                                    onChange={(e) =>
                                                        setData(
                                                            'start_date',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    className={
                                                        validationErrors.start_date ||
                                                        errors.start_date
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.start_date ||
                                                    errors.start_date) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.start_date ||
                                                            errors.start_date}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="personal">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Personal Information
                                            </CardTitle>
                                            <CardDescription>
                                                Basic personal details of the
                                                employee
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="first_name">
                                                    First Name{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
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
                                                    required
                                                    className={
                                                        validationErrors.first_name ||
                                                        errors.first_name
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.first_name ||
                                                    errors.first_name) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.first_name ||
                                                            errors.first_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="middle_name">
                                                    Middle Name
                                                </Label>
                                                <Input
                                                    id="middle_name"
                                                    value={data.middle_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'middle_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="last_name">
                                                    Last Name{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="last_name"
                                                    value={data.last_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'last_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    className={
                                                        validationErrors.last_name ||
                                                        errors.last_name
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.last_name ||
                                                    errors.last_name) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.last_name ||
                                                            errors.last_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="birthdate">
                                                    Birthdate{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="birthdate"
                                                    type="date"
                                                    value={data.birthdate}
                                                    onChange={(e) =>
                                                        setData(
                                                            'birthdate',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.birthdate ||
                                                        errors.birthdate
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.birthdate ||
                                                    errors.birthdate) && (
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                                                        <p className="text-sm text-destructive">
                                                            {validationErrors.birthdate ||
                                                                errors.birthdate}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age</Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    value={data.age}
                                                    readOnly
                                                    className="bg-muted"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="gender">
                                                    Gender{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={data.gender}
                                                    onValueChange={(value) =>
                                                        setData('gender', value)
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            validationErrors.gender ||
                                                            errors.gender
                                                                ? 'border-destructive'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">
                                                            Male
                                                        </SelectItem>
                                                        <SelectItem value="Female">
                                                            Female
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {(validationErrors.gender ||
                                                    errors.gender) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.gender ||
                                                            errors.gender}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="civil_status">
                                                    Civil Status{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={data.civil_status}
                                                    onValueChange={(value) =>
                                                        setData(
                                                            'civil_status',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            validationErrors.civil_status ||
                                                            errors.civil_status
                                                                ? 'border-destructive'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Single">
                                                            Single
                                                        </SelectItem>
                                                        <SelectItem value="Married">
                                                            Married
                                                        </SelectItem>
                                                        <SelectItem value="Widowed">
                                                            Widowed
                                                        </SelectItem>
                                                        <SelectItem value="Separated">
                                                            Separated
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {(validationErrors.civil_status ||
                                                    errors.civil_status) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.civil_status ||
                                                            errors.civil_status}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="religion">
                                                    Religion
                                                </Label>
                                                <Input
                                                    id="religion"
                                                    value={data.religion}
                                                    onChange={(e) =>
                                                        setData(
                                                            'religion',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="nationality">
                                                    Nationality{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="nationality"
                                                    value={data.nationality}
                                                    onChange={(e) =>
                                                        setData(
                                                            'nationality',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.nationality ||
                                                        errors.nationality
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.nationality ||
                                                    errors.nationality) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.nationality ||
                                                            errors.nationality}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="birthplace">
                                                    Birthplace
                                                </Label>
                                                <Input
                                                    id="birthplace"
                                                    value={data.birthplace}
                                                    onChange={(e) =>
                                                        setData(
                                                            'birthplace',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="contact">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Contact Information
                                            </CardTitle>
                                            <CardDescription>
                                                Address and contact details
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="address">
                                                    Address{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="address"
                                                    value={data.address}
                                                    onChange={(e) =>
                                                        setData(
                                                            'address',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.address ||
                                                        errors.address
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.address ||
                                                    errors.address) && (
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                                                        <p className="text-sm text-destructive">
                                                            {validationErrors.address ||
                                                                errors.address}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="zip_code">
                                                    Zip Code
                                                </Label>
                                                <Input
                                                    id="zip_code"
                                                    value={data.zip_code}
                                                    onChange={(e) =>
                                                        setData(
                                                            'zip_code',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="contact">
                                                    Mobile Number{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="contact"
                                                    placeholder="09XX-XXX-XXXX or +63XXXXXXXXX"
                                                    value={data.contact}
                                                    onChange={(e) =>
                                                        setData(
                                                            'contact',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.contact ||
                                                        errors.contact
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.contact ||
                                                    errors.contact) && (
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                                                        <p className="text-sm text-destructive">
                                                            {validationErrors.contact ||
                                                                errors.contact}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">
                                                    Email Address{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) =>
                                                        setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.email ||
                                                        errors.email
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.email ||
                                                    errors.email) && (
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                                                        <p className="text-sm text-destructive">
                                                            {validationErrors.email ||
                                                                errors.email}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">
                                                    Telephone
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    placeholder="09XX-XXX-XXXX or +63XXXXXXXXX (optional)"
                                                    value={data.phone}
                                                    onChange={(e) =>
                                                        setData(
                                                            'phone',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.phone ||
                                                        errors.phone
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.phone ||
                                                    errors.phone) && (
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                                                        <p className="text-sm text-destructive">
                                                            {validationErrors.phone ||
                                                                errors.phone}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="government">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Government IDs
                                            </CardTitle>
                                            <CardDescription>
                                                Government issued identification
                                                numbers
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="sss">
                                                    SSS Number{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="sss"
                                                    value={data.sss}
                                                    onChange={(e) =>
                                                        setData(
                                                            'sss',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.sss ||
                                                        errors.sss
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.sss ||
                                                    errors.sss) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.sss ||
                                                            errors.sss}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="philhealth">
                                                    PhilHealth Number{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="philhealth"
                                                    value={data.philhealth}
                                                    onChange={(e) =>
                                                        setData(
                                                            'philhealth',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.philhealth ||
                                                        errors.philhealth
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.philhealth ||
                                                    errors.philhealth) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.philhealth ||
                                                            errors.philhealth}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pagibig">
                                                    Pag-IBIG Number{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="pagibig"
                                                    value={data.pagibig}
                                                    onChange={(e) =>
                                                        setData(
                                                            'pagibig',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.pagibig ||
                                                        errors.pagibig
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.pagibig ||
                                                    errors.pagibig) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.pagibig ||
                                                            errors.pagibig}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tin">
                                                    TIN{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="tin"
                                                    value={data.tin}
                                                    onChange={(e) =>
                                                        setData(
                                                            'tin',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.tin ||
                                                        errors.tin
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.tin ||
                                                    errors.tin) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.tin ||
                                                            errors.tin}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="financial">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Financial Information
                                            </CardTitle>
                                            <CardDescription>
                                                Payroll and banking details
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="basic_rate">
                                                    Basic Rate{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="basic_rate"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.basic_rate}
                                                    onChange={(e) =>
                                                        setData(
                                                            'basic_rate',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    className={
                                                        validationErrors.basic_rate ||
                                                        errors.basic_rate
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.basic_rate ||
                                                    errors.basic_rate) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.basic_rate ||
                                                            errors.basic_rate}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="rate_type">
                                                    Rate Type{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={data.rate_type}
                                                    onValueChange={(value) =>
                                                        setData(
                                                            'rate_type',
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            validationErrors.rate_type ||
                                                            errors.rate_type
                                                                ? 'border-destructive'
                                                                : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="daily">
                                                            Daily
                                                        </SelectItem>
                                                        <SelectItem value="monthly">
                                                            Monthly
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {(validationErrors.rate_type ||
                                                    errors.rate_type) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.rate_type ||
                                                            errors.rate_type}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bank_name">
                                                    Bank Name{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="bank_name"
                                                    value={data.bank_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'bank_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.bank_name ||
                                                        errors.bank_name
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.bank_name ||
                                                    errors.bank_name) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.bank_name ||
                                                            errors.bank_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="bank_account">
                                                    Bank Account Number
                                                </Label>
                                                <Input
                                                    id="bank_account"
                                                    value={data.bank_account}
                                                    onChange={(e) =>
                                                        setData(
                                                            'bank_account',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="allowance">
                                                    Allowance
                                                </Label>
                                                <Input
                                                    id="allowance"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.allowance}
                                                    onChange={(e) =>
                                                        setData(
                                                            'allowance',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className={
                                                        validationErrors.allowance ||
                                                        errors.allowance
                                                            ? 'border-destructive'
                                                            : ''
                                                    }
                                                />
                                                {(validationErrors.allowance ||
                                                    errors.allowance) && (
                                                    <p className="text-sm text-destructive">
                                                        {validationErrors.allowance ||
                                                            errors.allowance}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
