# Role-Based Access Control (RBAC) Implementation Plan

## Overview

Implement role-based access control to segregate permissions between Admin and HR users.

---

## Access Control Matrix

| Feature                | Admin                   | HR          |
| ---------------------- | ----------------------- | ----------- |
| **HR Management**      | Full CRUD               | No Access   |
| **Employees**          | View Only (index, show) | Full CRUD   |
| **Payroll - Create**   | No Access               | Full Access |
| **Payroll - View**     | Full Access             | Full Access |
| **Payroll - Generate** | No Access               | Full Access |
| **Payroll - Approve**  | Full Access             | No Access   |
| **Payroll - Delete**   | No Access               | Full Access |
| **Payslips**           | View Only (index, show) | Full CRUD   |
| **Settings (All)**     | View Only (index)       | Full CRUD   |
| **Dashboard**          | Full Access             | Full Access |

---

## Implementation Steps

### Phase 1: Backend Routes (routes/web.php)

#### 1.1 Admin-Only Routes

```php
Route::middleware(['role:admin'])->group(function () {
    // HR Management
    Route::resource('hr', HRController::class);

    // Payroll Approval
    Route::post('payroll/{id}/approve', [PayrollController::class, 'approve']);
    Route::post('payroll/{id}/reject', [PayrollController::class, 'reject']);
});
```

#### 1.2 HR-Only Routes

```php
Route::middleware(['role:hr'])->group(function () {
    // Employee CRUD (except index/show)
    Route::get('employees/create', [EmployeeController::class, 'create']);
    Route::post('employees', [EmployeeController::class, 'store']);
    Route::get('employees/{id}/edit', [EmployeeController::class, 'edit']);
    Route::put('employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('employees/{id}', [EmployeeController::class, 'destroy']);
    Route::post('employees/{id}/restore', [EmployeeController::class, 'restore']);
    Route::delete('employees/{id}/force-delete', [EmployeeController::class, 'forceDelete']);

    // Employee sub-resources (all CRUD)
    Route::post('employees/{employee}/leave-credits', ...);
    Route::put('employees/{employee}/leave-credits/{leaveCredit}', ...);
    Route::delete('employees/{employee}/leave-credits/{leaveCredit}', ...);
    // ... (all other employee sub-resources)

    // Payroll CRUD (except approve)
    Route::get('payroll/create', [PayrollController::class, 'create']);
    Route::post('payroll', [PayrollController::class, 'store']);
    Route::post('payroll/{id}/generate', [PayrollController::class, 'generate']);
    Route::delete('payroll/{id}', [PayrollController::class, 'destroy']);
    Route::delete('payroll/{id}/remove-dtr', [PayrollController::class, 'removeDTR']);
    Route::post('payroll/{id}/generate-payslips', [PayrollController::class, 'generatePayslips']);

    // Payslips CRUD
    Route::put('payslips/{payslip}', [PayslipController::class, 'update']);

    // Settings CRUD (all write operations)
    Route::post('departments', [DepartmentController::class, 'store']);
    Route::post('leave-types', [LeaveTypeController::class, 'store']);
    Route::post('premium-categories', [PremiumCategoryController::class, 'store']);
    Route::put('premium-categories/{category}', [PremiumCategoryController::class, 'update']);
    Route::delete('premium-categories/{category}', [PremiumCategoryController::class, 'destroy']);
    Route::post('premium-categories/{category}/types', [PremiumTypeController::class, 'store']);
    Route::put('premium-categories/{category}/types/{type}', [PremiumTypeController::class, 'update']);
    Route::delete('premium-categories/{category}/types/{type}', [PremiumTypeController::class, 'destroy']);
    Route::put('deduction-settings/{setting}', [DeductionSettingController::class, 'update']);
    Route::post('sss-brackets', [SSSController::class, 'store']);
    Route::put('sss-brackets', [SSSController::class, 'update']);
    Route::delete('sss-brackets/{id}', [SSSController::class, 'destroy']);
    Route::post('tax-brackets', [TaxController::class, 'store']);
    Route::put('tax-brackets', [TaxController::class, 'update']);
    Route::delete('tax-brackets/{id}', [TaxController::class, 'destroy']);
    Route::post('calendar', [CalendarController::class, 'store']);
    Route::post('calendar/reset', [CalendarController::class, 'reset']);
    Route::post('schedule', [ScheduleController::class, 'store']);
    Route::put('schedule/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('schedule/{schedule}', [ScheduleController::class, 'destroy']);
});
```

#### 1.3 Shared Routes (Both Admin & HR)

```php
// No specific middleware - accessible to both
Route::get('employees', [EmployeeController::class, 'index']);
Route::get('employees/{id}', [EmployeeController::class, 'show']);

Route::get('payroll', [PayrollController::class, 'index']);
Route::get('payroll/{id}', [PayrollController::class, 'show']);
Route::get('payroll/{id}/draft', [PayrollController::class, 'showDraft']);
Route::get('payroll/download-sample', [PayrollController::class, 'downloadSample']);

Route::get('payslips', [PayslipController::class, 'index']);
Route::get('payslips/{payslip}', [PayslipController::class, 'show']);

// Settings - Read Only
Route::get('departments', [DepartmentController::class, 'index']);
Route::get('leave-types', [LeaveTypeController::class, 'index']);
Route::get('premium-setup', [PremiumCategoryController::class, 'index']);
Route::get('deduction-settings', [DeductionSettingController::class, 'index']);
Route::get('sss-brackets', [SSSController::class, 'index']);
Route::get('tax-brackets', [TaxController::class, 'index']);
Route::get('calendar', [CalendarController::class, 'index']);
Route::get('schedule', [ScheduleController::class, 'index']);
```

---

### Phase 2: Frontend Components

#### 2.1 Pass User Role to Frontend

Update `HandleInertiaRequests.php` to share user role:

```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ] : null,
        ],
    ];
}
```

#### 2.2 Hide/Show UI Elements Based on Role

**Files to Update:**

1. **Sidebar Navigation** (`resources/js/components/app-sidebar.tsx`)
    - Hide "HR Management" from HR users
    - Show all items to both roles (but backend will restrict actions)

2. **Employee Pages**
    - `resources/js/pages/employees/index.tsx` - Hide Create/Edit/Delete buttons for Admin
    - `resources/js/pages/employees/show.tsx` - Hide Edit/Delete buttons for Admin

3. **Payroll Pages**
    - `resources/js/pages/payroll/index.tsx` - Hide "Create Payroll" button for Admin
    - `resources/js/pages/payroll/show-draft.tsx` - Hide "Generate Payroll" button for Admin, Hide "Approve" button for HR
    - `resources/js/pages/payroll/show.tsx` - Show "Approve" only to Admin, Hide "Delete" from Admin

4. **Payslip Pages**
    - `resources/js/pages/payslips/index.tsx` - Hide edit actions for Admin
    - `resources/js/pages/payslips/show.tsx` - Hide edit form for Admin

5. **Settings Pages** (All in `resources/js/pages/settings/`)
    - Hide all Create/Edit/Delete buttons for Admin in:
        - `departments.tsx`
        - `leave-types.tsx`
        - `premium-setup.tsx`
        - `deduction-settings.tsx`
        - `sss-brackets.tsx`
        - `tax-brackets.tsx`
        - `calendar.tsx`
        - `schedule.tsx`

---

### Phase 3: Helper Functions

#### 3.1 Create Role Check Helpers

Create `resources/js/lib/auth.ts`:

```typescript
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

export function canEdit(resource: string) {
    const role = useRole();

    if (role === 'admin') {
        // Admin can only edit HR management
        return resource === 'hr';
    }

    if (role === 'hr') {
        // HR can edit everything except HR management and approve payroll
        return resource !== 'hr' && resource !== 'payroll-approve';
    }

    return false;
}
```

---

### Phase 4: Testing Checklist

#### Admin User Tests:

- [ ] Can view employees but not edit/delete
- [ ] Can view payroll but not create/generate/delete
- [ ] Can approve/reject payroll
- [ ] Can view payslips but not edit
- [ ] Can view all settings but not edit
- [ ] Can access HR Management (full CRUD)
- [ ] Cannot see "Create Payroll" button
- [ ] Cannot see "Generate Payroll" button
- [ ] Cannot see edit/delete buttons on employees

#### HR User Tests:

- [ ] Can fully manage employees (CRUD)
- [ ] Can create/generate/delete payroll
- [ ] Cannot approve/reject payroll
- [ ] Can fully manage payslips
- [ ] Can fully manage all settings
- [ ] Cannot access HR Management page
- [ ] Cannot see "Approve" button on payroll
- [ ] Cannot access /hr routes (should get 403)

---

### Phase 5: Error Handling

#### 5.1 403 Forbidden Page

Create `resources/js/pages/errors/403.tsx`:

```typescript
export default function Forbidden() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold">403</h1>
                <p className="text-xl">Unauthorized Access</p>
                <p className="text-muted-foreground">
                    You don't have permission to access this resource.
                </p>
                <Link href="/dashboard">
                    <Button className="mt-4">Go to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
}
```

---

## Implementation Order

1. ✅ Create CheckRole middleware
2. ✅ Register middleware in bootstrap/app.php
3. ✅ Add role:admin to HR Management routes
4. ✅ Reorganize all routes with proper middleware
5. ✅ Update HandleInertiaRequests to share user role
6. ✅ Create auth helper functions
7. ✅ Update sidebar navigation
8. ✅ Update employee pages (index - hide create/edit/delete for Admin, show - hide edit for Admin)
9. ✅ Update payroll pages (index - hide create for Admin, show-draft - hide generate for Admin, show - hide approve for HR)
10. ⏳ Update payslip pages (optional - backend already protects)
11. ✅ Update all settings pages (premium setup, deduction settings, schedule, calendar - all hide edit for Admin)
12. ✅ Create 403 error page
13. ⏳ Test all scenarios

---

## Notes

- Backend middleware is the primary security layer
- Frontend UI changes are for UX only (hiding buttons)
- Always test with both admin and hr accounts
- Use browser incognito for testing different roles simultaneously
