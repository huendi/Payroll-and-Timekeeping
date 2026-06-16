import { usePage } from '@inertiajs/react';

export function useAuth() {
    const { auth } = usePage().props as any;
    return auth.user;
}

export function useRole() {
    const user = useAuth();
    return user?.role;
}

export function isAdmin() {
    return useRole() === 'admin';
}

export function isHR() {
    return useRole() === 'hr';
}

export function isFinance() {
    return useRole() === 'finance';
}

export function canEdit(resource: string) {
    const role = useRole();

    if (role === 'admin') {
        // Admin can only edit HR management and approve payroll
        return resource === 'staff' || resource === 'payroll-approve';
    }

    if (role === 'hr') {
        // HR can edit employees and settings
        return resource === 'employees' || resource === 'settings';
    }

    if (role === 'finance') {
        // Finance can edit payroll, payslips, and settings
        return resource === 'payroll' || resource === 'payslips' || resource === 'settings' || resource === 'thirteenth-month-pay';
    }

    return false;
}

export function canCreate(resource: string) {
    const role = useRole();

    if (role === 'admin') {
        // Admin can only create Staff users
        return resource === 'staff';
    }

    if (role === 'hr') {
        // HR can create everything except Staff users
        return resource !== 'staff';
    }

    if (role === 'finance') {
        // Finance can create payroll
        return resource === 'payroll';
    }

    return false;
}

export function canDelete(resource: string) {
    const role = useRole();

    if (role === 'admin') {
        // Admin can only delete Staff users
        return resource === 'staff';
    }

    if (role === 'hr') {
        // HR can delete everything except Staff users
        return resource !== 'staff';
    }

    if (role === 'finance') {
        // Finance can delete payroll
        return resource === 'payroll';
    }

    return false;
}

export function canApprovePayroll() {
    return isAdmin();
}

export function canGeneratePayroll() {
    return isFinance();
}

export function canGeneratePayslips() {
    return isAdmin(); // Admin generates finalized payslips (PDFs) via generating payslips action? 
    // Or "Generate Payslips" button on Payroll Draft?
    // Route: payroll/{id}/generate-payslips is Admin only.
}