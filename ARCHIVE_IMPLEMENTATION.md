# Archive Functionality Implementation

## Overview

Comprehensive archive functionality has been added to all major payroll system entities: Payslips, Payrolls, Employee Schedules, Deductions, and Leave records. This allows users to archive records instead of permanently deleting them, maintaining data integrity and audit trails.

## Architecture

### Database Schema Changes

Archive functionality adds three columns to each table:

```sql
- is_archived (boolean, default: false)
- archived_at (timestamp, nullable)
- archived_by (unsignedBigInteger, nullable) - references users table
```

### Migrations Created

1. **2025_12_01_000001_add_archive_to_payslips_table.php**
    - Adds archive fields to `payslips` table
    - Creates index on `is_archived` for query performance

2. **2025_12_01_000002_add_archive_to_payrolls_table.php**
    - Adds archive fields to `payrolls` table
    - Creates index on `is_archived`

3. **2025_12_01_000003_add_archive_to_employee_schedules_table.php**
    - Adds archive fields to `employee_schedules` table
    - Creates index on `is_archived`

4. **2025_12_01_000004_add_archive_to_employee_deductions_table.php**
    - Adds archive fields to `employee_deductions` table
    - Creates index on `is_archived`

5. **2025_12_01_000005_add_archive_to_employee_leave_credits_table.php**
    - Adds archive fields to `employee_leave_credits` table
    - Creates index on `is_archived`

6. **2025_12_01_000006_add_archive_to_employee_leave_history_table.php**
    - Adds archive fields to `employee_leave_history` table
    - Creates index on `is_archived`

## Model Updates

All models now include archive methods and scopes:

### Methods Added to Each Model

```php
// Check if record is archived
public function isArchived(): bool
{
    return $this->is_archived;
}

// Archive a record
public function archive($userId = null): void
{
    $this->update([
        'is_archived' => true,
        'archived_at' => now(),
        'archived_by' => $userId ?? auth()->id(),
    ]);
}

// Restore an archived record
public function restore(): void
{
    $this->update([
        'is_archived' => false,
        'archived_at' => null,
        'archived_by' => null,
    ]);
}

// Query scopes
public function scopeArchived($query)
{
    return $query->where('is_archived', true);
}

public function scopeNotArchived($query)
{
    return $query->where('is_archived', false);
}
```

### Updated Models

1. **Payslip** (`/app/Models/Payslip.php`)
2. **Payroll** (`/app/Models/Payroll.php`)
3. **EmployeeSchedule** (`/app/Models/EmployeeSchedule.php`)
4. **EmployeeDeduction** (`/app/Models/EmployeeDeduction.php`)
5. **EmployeeLeaveCredit** (`/app/Models/EmployeeLeaveCredit.php`)
6. **EmployeeLeaveHistory** (`/app/Models/EmployeeLeaveHistory.php`)

## Controller Updates

### Archive/Restore Methods Added

Each controller now includes two methods:

```php
public function archive($model)
{
    $model->archive();
    return redirect()->back()->with('success', '[Entity] archived successfully.');
}

public function restore($model)
{
    $model->restore();
    return redirect()->back()->with('success', '[Entity] restored successfully.');
}
```

### Updated Controllers

1. **PayslipController** (`/app/Http/Controllers/PayslipController.php`)
    - `archive(Payslip $payslip)`
    - `restore(Payslip $payslip)`

2. **PayrollController** (`/app/Http/Controllers/PayrollController.php`)
    - `archive(Payroll $payroll)`
    - `restore(Payroll $payroll)`

3. **EmployeeScheduleController** (`/app/Http/Controllers/EmployeeScheduleController.php`)
    - `archive(Employee $employee, string $scheduleFileId)`
    - `restore(Employee $employee, string $scheduleFileId)`

4. **EmployeeDeductionController** (`/app/Http/Controllers/EmployeeDeductionController.php`)
    - `archive(Employee $employee, EmployeeDeduction $deduction)`
    - `restore(Employee $employee, EmployeeDeduction $deduction)`

5. **EmployeeLeaveCreditController** (`/app/Http/Controllers/EmployeeLeaveCreditController.php`)
    - `archive(Employee $employee, EmployeeLeaveCredit $leaveCredit)`
    - `restore(Employee $employee, EmployeeLeaveCredit $leaveCredit)`

6. **EmployeeLeaveHistoryController** (`/app/Http/Controllers/EmployeeLeaveHistoryController.php`)
    - `archive(Employee $employee, EmployeeLeaveHistory $leaveHistory)`
    - `restore(Employee $employee, EmployeeLeaveHistory $leaveHistory)`

## Routes Added

### Payslip Archive Routes

```php
Route::post('payslips/{payslip}/archive', [PayslipController::class, 'archive'])->name('payslips.archive');
Route::post('payslips/{payslip}/restore', [PayslipController::class, 'restore'])->name('payslips.restore');
```

### Payroll Archive Routes

```php
Route::post('payroll/{payroll}/archive', [PayrollController::class, 'archive'])->name('payroll.archive');
Route::post('payroll/{payroll}/restore', [PayrollController::class, 'restore'])->name('payroll.restore');
```

### Employee Schedule Archive Routes

```php
Route::post('/employees/{employee}/schedule/{scheduleFileId}/archive', [EmployeeScheduleController::class, 'archive'])->name('employees.schedule.archive');
Route::post('/employees/{employee}/schedule/{scheduleFileId}/restore', [EmployeeScheduleController::class, 'restore'])->name('employees.schedule.restore');
```

### Employee Deduction Archive Routes

```php
Route::post('employees/{employee}/deductions/{deduction}/archive', [EmployeeDeductionController::class, 'archive'])->name('employees.deductions.archive');
Route::post('employees/{employee}/deductions/{deduction}/restore', [EmployeeDeductionController::class, 'restore'])->name('employees.deductions.restore');
```

### Leave Credit Archive Routes

```php
Route::post('employees/{employee}/leave-credits/{leaveCredit}/archive', [EmployeeLeaveCreditController::class, 'archive'])->name('employees.leave-credits.archive');
Route::post('employees/{employee}/leave-credits/{leaveCredit}/restore', [EmployeeLeaveCreditController::class, 'restore'])->name('employees.leave-credits.restore');
```

### Leave History Archive Routes

```php
Route::post('employees/{employee}/leave-history/{leaveHistory}/archive', [EmployeeLeaveHistoryController::class, 'archive'])->name('employees.leave-history.archive');
Route::post('employees/{employee}/leave-history/{leaveHistory}/restore', [EmployeeLeaveHistoryController::class, 'restore'])->name('employees.leave-history.restore');
```

## Usage Examples

### Archive a Payslip

```php
$payslip = Payslip::find(1);
$payslip->archive(); // Archives with current user ID
```

### Restore a Payslip

```php
$payslip = Payslip::find(1);
$payslip->restore();
```

### Query Archived Records

```php
// Get all archived payslips
$archived = Payslip::archived()->get();

// Get all non-archived payslips
$active = Payslip::notArchived()->get();

// Check if record is archived
if ($payslip->isArchived()) {
    // Handle archived record
}
```

## Frontend Integration

To integrate archive/restore functionality in frontend components:

### Archive Button Example

```tsx
const handleArchive = async (id: string) => {
    try {
        await router.post(route('payslips.archive', id));
        toast.success('Payslip archived successfully');
    } catch (error) {
        toast.error('Failed to archive payslip');
    }
};
```

### Restore Button Example

```tsx
const handleRestore = async (id: string) => {
    try {
        await router.post(route('payslips.restore', id));
        toast.success('Payslip restored successfully');
    } catch (error) {
        toast.error('Failed to restore payslip');
    }
};
```

## Query Performance

All archive tables have indexes on the `is_archived` column for optimal query performance:

```php
// Efficient queries
Payslip::where('is_archived', false)->get(); // Uses index
Payslip::archived()->get(); // Uses index via scope
```

## Audit Trail

Archive records maintain an audit trail:

- **is_archived**: Boolean flag indicating archive status
- **archived_at**: Timestamp of when record was archived
- **archived_by**: User ID of who archived the record

This allows tracking of who archived records and when.

## Data Integrity

- Archive is a soft operation (no data deletion)
- Records can be restored at any time
- Original data is preserved
- Relationships are maintained
- No cascading deletes

## Migration Instructions

To apply these changes to your database:

```bash
php artisan migrate
```

This will:

1. Add archive columns to all 6 tables
2. Create indexes on `is_archived` columns
3. Set default values for existing records (is_archived = false)

## Rollback Instructions

To rollback the archive functionality:

```bash
php artisan migrate:rollback
```

This will remove all archive columns and indexes.

## Future Enhancements

Potential improvements for archive functionality:

1. **Archive Pages**: Create dedicated archive/history pages for each entity
2. **Bulk Archive**: Add bulk archive operations
3. **Archive Filters**: Add archive status filters to list pages
4. **Archive Reasons**: Store reason for archiving
5. **Archive Notifications**: Notify users when records are archived
6. **Archive Reports**: Generate reports on archived records
7. **Permanent Delete**: Add option to permanently delete archived records after retention period

## Summary

Archive functionality is now fully implemented across all major payroll entities. The system maintains data integrity while allowing users to manage record lifecycle through archive/restore operations. All changes are backward compatible and include proper audit trails.
