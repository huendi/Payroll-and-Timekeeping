# Archive Functionality - Frontend Implementation

## Overview

Complete frontend UI implementation for archive/restore functionality across all payroll system pages. Users can now archive and restore records with a single click, with confirmation dialogs and toast notifications.

## Pages Updated

### 1. Payslips Pages

#### `/resources/js/pages/payslips/show.tsx`

**Changes:**

- Added `is_archived` and `archived_at` fields to Payslip interface
- Added `handleArchive()` handler - Archives payslip with confirmation
- Added `handleRestore()` handler - Restores archived payslip with confirmation
- Added Archive/Restore button to action bar (conditional based on `is_archived` status)
- Button shows "Archive" for active payslips, "Restore" for archived ones
- Uses Archive and RotateCcw icons from lucide-react

**UI Location:** Top-right action bar next to Download button

**Behavior:**

- Click Archive → Confirmation dialog → POST to `/payslips/{id}/archive`
- Click Restore → Confirmation dialog → POST to `/payslips/{id}/restore`
- Toast notifications on success/error

---

### 2. Payroll Pages

#### `/resources/js/pages/payroll/index.tsx`

**Changes:**

- Added `is_archived` field to Payroll interface
- Added `handleArchive()` handler - Archives payroll with confirmation
- Added `handleRestore()` handler - Restores archived payroll with confirmation
- Added Archive/Restore button to Actions column in payroll table
- Button shows "Archive" for active payrolls, "Restore" for archived ones
- Uses Archive and RotateCcw icons

**UI Location:** Actions column in payroll list table

**Behavior:**

- Click Archive → Confirmation dialog → POST to `/payroll/{id}/archive`
- Click Restore → Confirmation dialog → POST to `/payroll/{id}/restore`
- Toast notifications on success/error
- Delete button still available for non-approved payrolls

---

### 3. Employee Pages

#### `/resources/js/pages/employees/show.tsx`

**Leave Credits Section:**

- Added `is_archived` field to LeaveCredit interface
- Added `handleArchiveCredit()` handler
- Added `handleRestoreCredit()` handler
- Archive/Restore button appears in leave credit cards (top-right of each card)
- Edit button hidden when credit is archived
- Archive button shows for active credits, Restore button for archived ones

**Leave History Section:**

- Added `is_archived` field to LeaveHistory interface
- Added `handleArchiveLeaveHistory()` handler
- Added `handleRestoreLeaveHistory()` handler
- Archive/Restore button appears in Actions column of leave history table
- Archive button shows for active records, Restore button for archived ones
- Delete button still available

**Deductions Section:**

- Added `is_archived` field to Deduction interface
- Added `handleArchiveDeduction()` handler
- Added `handleRestoreDeduction()` handler
- Archive/Restore button appears in Actions column of deductions table
- Edit button hidden when deduction is archived
- Archive button shows for active deductions, Restore button for archived ones
- Delete button still available

**UI Locations:**

- Leave Credits: Small buttons in top-right of each leave type card
- Leave History: Buttons in Actions column of table
- Deductions: Buttons in Actions column of table

**Behavior:**

- All handlers use confirmation dialogs before action
- POST requests to respective archive/restore endpoints
- Toast notifications on success/error
- Page reloads on success to reflect changes

---

## UI Patterns

### Archive/Restore Buttons

All archive/restore buttons follow consistent patterns:

**Active Records:**

```tsx
<Button variant="outline" onClick={handleArchive}>
    <Archive className="mr-2 h-4 w-4" />
    Archive
</Button>
```

**Archived Records:**

```tsx
<Button variant="outline" onClick={handleRestore}>
    <RotateCcw className="mr-2 h-4 w-4" />
    Restore
</Button>
```

### Confirmation Dialogs

All actions use browser confirm() dialogs:

```tsx
if (confirm('Archive this record? You can restore it later.')) {
    // Proceed with archive
}
```

### Toast Notifications

Success and error messages via Sonner toast:

```tsx
toast.success('Record archived successfully!');
toast.error('Failed to archive record.');
```

---

## Icons Used

- **Archive**: `<Archive />` - Represents archiving action
- **Restore**: `<RotateCcw />` - Represents restoring action
- Both imported from `lucide-react`

---

## Routes Called

### Payslips

- `POST /payslips/{payslip}/archive`
- `POST /payslips/{payslip}/restore`

### Payrolls

- `POST /payroll/{payroll}/archive`
- `POST /payroll/{payroll}/restore`

### Leave Credits

- `POST /employees/{employee}/leave-credits/{leaveCredit}/archive`
- `POST /employees/{employee}/leave-credits/{leaveCredit}/restore`

### Leave History

- `POST /employees/{employee}/leave-history/{leaveHistory}/archive`
- `POST /employees/{employee}/leave-history/{leaveHistory}/restore`

### Deductions

- `POST /employees/{employee}/deductions/{deduction}/archive`
- `POST /employees/{employee}/deductions/{deduction}/restore`

---

## State Management

### Interfaces Updated

All relevant interfaces now include archive fields:

```typescript
interface Payslip {
    // ... existing fields
    is_archived: boolean;
    archived_at: string | null;
}

interface Payroll {
    // ... existing fields
    is_archived: boolean;
}

interface LeaveCredit {
    // ... existing fields
    is_archived: boolean;
}

interface LeaveHistory {
    // ... existing fields
    is_archived: boolean;
}

interface Deduction {
    // ... existing fields
    is_archived: boolean;
}
```

---

## User Experience

### Workflow

1. User clicks Archive button on any record
2. Confirmation dialog appears asking to confirm
3. Upon confirmation, POST request sent to backend
4. On success: Toast notification + page updates
5. On error: Toast error notification

### Visual Feedback

- **Before Action**: Archive button visible for active records
- **During Action**: Button disabled (handled by Inertia)
- **After Action**: Button changes to Restore
- **Notifications**: Toast appears for 3-5 seconds

### Accessibility

- Buttons have `title` attributes for hover tooltips
- Confirmation dialogs prevent accidental archiving
- Clear success/error messages
- Icons + text for clarity

---

## Testing Checklist

- [ ] Archive payslip and verify button changes to Restore
- [ ] Restore archived payslip and verify button changes to Archive
- [ ] Archive payroll and verify button changes to Restore
- [ ] Restore archived payroll and verify button changes to Archive
- [ ] Archive leave credit and verify edit button disappears
- [ ] Restore leave credit and verify edit button reappears
- [ ] Archive leave history record
- [ ] Restore leave history record
- [ ] Archive deduction and verify edit button disappears
- [ ] Restore deduction and verify edit button reappears
- [ ] Verify confirmation dialogs appear before action
- [ ] Verify toast notifications appear on success/error
- [ ] Verify page updates after archive/restore

---

## Future Enhancements

1. **Bulk Archive**: Archive multiple records at once
2. **Archive Filters**: Show/hide archived records in lists
3. **Archive History**: View who archived and when
4. **Archive Reasons**: Store reason for archiving
5. **Archive Pages**: Dedicated pages to view archived records
6. **Undo Feature**: Undo recent archive actions
7. **Archive Retention**: Auto-delete archived records after X days
8. **Archive Notifications**: Notify users when records are archived

---

## Files Modified

1. `/resources/js/pages/payslips/show.tsx`
    - Added archive UI and handlers

2. `/resources/js/pages/payroll/index.tsx`
    - Added archive UI and handlers

3. `/resources/js/pages/employees/show.tsx`
    - Added archive UI and handlers for leave credits, leave history, and deductions

---

## Summary

Frontend archive functionality is now fully implemented across all major payroll pages. Users can easily archive and restore records with confirmation dialogs and toast notifications. The UI is intuitive, with conditional button displays based on archive status. All changes follow existing design patterns and use consistent icons and messaging.
