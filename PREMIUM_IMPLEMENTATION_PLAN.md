# Premium Rates Implementation Plan

## Overview

Integrate detailed premium rate structure from the user's payroll system into the application. Currently using simplified hardcoded rates; need to implement comprehensive premium calculations based on day type (regular, holiday, restday, etc.).

---

## Phase 1: Database & Models

### 1.1 Update PayrollItem Model

**File:** `/app/Models/PayrollItem.php`

**Current Fields:**

- `basic_pay`
- `allowance_pay`
- `overtime_pay`
- `night_diff_pay`
- `restday_pay`
- `restday_premium`
- `gross_pay`
- `sss_deduction`, `phic_deduction`, `hdmf_deduction`, `tax_deduction`
- `late_deduction`
- `loan_deduction`
- `total_deductions`
- `net_pay`

**New Fields Needed:**

```
// Night Differential Breakdown
- night_diff_ordinary_working: decimal (10%)
- night_diff_holiday: decimal (13%)
- night_diff_holiday_restday: decimal (20%)
- night_diff_restday: decimal (13%)
- night_diff_holiday_ot: decimal (12.5%)
- night_diff_holiday_restday_ot: decimal (33.8%)

// Overtime Pay Breakdown
- ot_holiday: decimal (26%)
- ot_holiday_restday: decimal (38%)
- ot_regular: decimal (125%)
- ot_restday: decimal (160%)
- ot_ordinary_working: decimal (10%)

// Additional Premium Pay (1st 8 hrs)
- premium_restday: decimal (30%)
- premium_holiday_regular: decimal (200%)
- premium_holiday_special: decimal (130%)
- premium_holiday_rd_regular: decimal (260%)
- premium_holiday_rd_special: decimal (150%)
```

**Status:** ⬜ NOT STARTED

---

### 1.2 Create Migration for PayrollItem Fields

**File:** `/database/migrations/YYYY_MM_DD_add_premium_breakdown_to_payroll_items.php`

**Changes:**

- Add all new premium breakdown columns to `payroll_items` table
- Use `decimal(10,2)` for all currency fields
- Set default to 0

**Status:** ⬜ NOT STARTED

---

### 1.3 Update Calendar Model

**File:** `/app/Models/Calendar.php`

**Current Fields:**

- `date`
- `type` (enum: 'holiday', 'special_holiday', etc.)

**Verify:**

- Ensure `type` field distinguishes between regular holidays and special holidays
- If not, may need to add `holiday_category` field

**Status:** ⬜ NOT STARTED

---

## Phase 2: Backend Calculations

### 2.1 Update Attendance Model

**File:** `/app/Models/Attendance.php`

**Verify Fields:**

- `is_holiday` - boolean (marks if day is a holiday)
- `holiday_type` - string (distinguishes regular vs special)
- `is_restday` - boolean
- `hours_worked`
- `overtime_hours`
- `night_diff_hours`
- `late_minutes`

**Status:** ⬜ VERIFY

---

### 2.2 Refactor computePayrollForEmployee Method

**File:** `/app/Http/Controllers/PayrollController.php` (lines 707-779)

**Current Logic:**

- Uses simplified premium rates (hardcoded percentages)
- Doesn't distinguish between holiday types
- Doesn't separate premium types

**New Logic Needed:**

#### Step 1: Categorize Attendance Records

```php
$attendances->map(function($a) {
    $a->day_category = determineCategory($a); // 'regular', 'holiday', 'holiday_restday', 'restday'
    $a->holiday_category = $a->is_holiday ? getHolidayCategory($a->date) : null; // 'regular', 'special'
    return $a;
});
```

#### Step 2: Calculate Night Differential by Category

```php
$nightDiffOrdinary = attendances where day_category='regular' sum night_diff_hours * rate(10%)
$nightDiffHoliday = attendances where day_category='holiday' sum night_diff_hours * rate(13%)
$nightDiffHolidayRestday = attendances where day_category='holiday_restday' sum night_diff_hours * rate(20%)
$nightDiffRestday = attendances where day_category='restday' sum night_diff_hours * rate(13%)
$nightDiffHolidayOT = attendances where day_category='holiday' && is_ot_paid sum night_diff_hours * rate(12.5%)
$nightDiffHolidayRestdayOT = attendances where day_category='holiday_restday' && is_ot_paid sum night_diff_hours * rate(33.8%)
```

#### Step 3: Calculate Overtime Pay by Category

```php
$otHoliday = attendances where day_category='holiday' && is_ot_paid sum overtime_hours * rate(26%)
$otHolidayRestday = attendances where day_category='holiday_restday' && is_ot_paid sum overtime_hours * rate(38%)
$otRegular = attendances where day_category='regular' && is_ot_paid sum overtime_hours * rate(125%)
$otRestday = attendances where day_category='restday' && is_ot_paid sum overtime_hours * rate(160%)
$otOrdinaryWorking = attendances where day_category='regular' sum overtime_hours * rate(10%)
```

#### Step 4: Calculate Additional Premium Pay (1st 8 hrs)

```php
$premiumRestday = restday_hours * hourlyRate * rate(30%)
$premiumHolidayRegular = holiday_regular_hours * hourlyRate * rate(200%)
$premiumHolidaySpecial = holiday_special_hours * hourlyRate * rate(130%)
$premiumHolidayRDRegular = holiday_restday_regular_hours * hourlyRate * rate(260%)
$premiumHolidayRDSpecial = holiday_restday_special_hours * hourlyRate * rate(150%)
```

#### Step 5: Create PayrollItem with All Breakdowns

```php
PayrollItem::create([
    // ... existing fields ...

    // Night Differential
    'night_diff_ordinary_working' => $nightDiffOrdinary,
    'night_diff_holiday' => $nightDiffHoliday,
    'night_diff_holiday_restday' => $nightDiffHolidayRestday,
    'night_diff_restday' => $nightDiffRestday,
    'night_diff_holiday_ot' => $nightDiffHolidayOT,
    'night_diff_holiday_restday_ot' => $nightDiffHolidayRestdayOT,

    // Overtime Pay
    'ot_holiday' => $otHoliday,
    'ot_holiday_restday' => $otHolidayRestday,
    'ot_regular' => $otRegular,
    'ot_restday' => $otRestday,
    'ot_ordinary_working' => $otOrdinaryWorking,

    // Additional Premium Pay
    'premium_restday' => $premiumRestday,
    'premium_holiday_regular' => $premiumHolidayRegular,
    'premium_holiday_special' => $premiumHolidaySpecial,
    'premium_holiday_rd_regular' => $premiumHolidayRDRegular,
    'premium_holiday_rd_special' => $premiumHolidayRDSpecial,
]);
```

**Status:** ⬜ NOT STARTED

---

### 2.3 Add Helper Methods to PayrollController

**File:** `/app/Http/Controllers/PayrollController.php`

**New Methods Needed:**

#### determineCategory($attendance)

```php
private function determineCategory($attendance)
{
    if ($attendance->is_holiday && $attendance->is_restday) {
        return 'holiday_restday';
    } elseif ($attendance->is_holiday) {
        return 'holiday';
    } elseif ($attendance->is_restday) {
        return 'restday';
    } else {
        return 'regular';
    }
}
```

#### getHolidayCategory($date)

```php
private function getHolidayCategory($date)
{
    $holiday = Calendar::where('date', $date)->first();
    return $holiday ? strtolower($holiday->type) : null; // 'regular', 'special'
}
```

**Status:** ⬜ NOT STARTED

---

## Phase 3: Frontend Display

### 3.1 Update Draft Payroll Table

**File:** `/resources/js/pages/payroll/show-draft.tsx`

**Current Display:**

- Shows simplified premium breakdown
- Combines all OT into single field
- Combines all night diff into single field

**New Display Needed:**

#### Add Premium Breakdown Section

```
NIGHT DIFFERENTIAL BREAKDOWN:
- Ordinary Working Days (10%): ₱X.XX
- Holiday (13%): ₱X.XX
- Holiday on Restday (20%): ₱X.XX
- Restday (13%): ₱X.XX
- Holiday (OT) (12.5%): ₱X.XX
- Holiday on Restday (OT) (33.8%): ₱X.XX
Subtotal: ₱X.XX

OVERTIME PAY BREAKDOWN:
- Holiday (26%): ₱X.XX
- Holiday on Restday (38%): ₱X.XX
- Regular (125%): ₱X.XX
- Restday (160%): ₱X.XX
- Ordinary Working Days (10%): ₱X.XX
Subtotal: ₱X.XX

ADDITIONAL PREMIUM PAY (1st 8 hrs):
- Restday (30%): ₱X.XX
- Holiday Regular (200%): ₱X.XX
- Holiday Special (130%): ₱X.XX
- Holiday on RD Regular (260%): ₱X.XX
- Holiday on RD Special (150%): ₱X.XX
Subtotal: ₱X.XX
```

**Status:** ⬜ NOT STARTED

---

### 3.2 Update calculatePayroll Function

**File:** `/resources/js/pages/payroll/show-draft.tsx` (lines 118-261)

**Changes:**

- Extract premium breakdowns from attendance data
- Calculate each premium type separately
- Return detailed breakdown object

**Status:** ⬜ NOT STARTED

---

## Phase 4: Employee Schedule Fix

### 4.1 Fix Total Days Calculation

**File:** `/resources/js/pages/payroll/show-draft.tsx` (line 144)

**Current:**

```typescript
const totalDays = attendanceList.length;
```

**Should Be:**

```typescript
const totalDays = attendanceList.filter((a) => !a.is_restday).length;
// OR if using employee schedule
const totalDays = attendanceList.filter((a) => a.type === 'work').length;
```

**Status:** ⬜ NOT STARTED

---

### 4.2 Backend: Fix Total Days in calculateDraftTotals

**File:** `/app/Http/Controllers/PayrollController.php` (calculateDraftTotals method)

**Current:**

```php
$totalDays = $empAttendances->count();
```

**Should Be:**

```php
$totalDays = $empAttendances->filter(fn($a) => !$a->is_restday)->count();
```

**Status:** ⬜ NOT STARTED

---

## Implementation Checklist

### Database & Models

- [ ] 1.1 Update PayrollItem model with new fields
- [ ] 1.2 Create migration for new columns
- [ ] 1.3 Verify Calendar model has holiday_type field
- [ ] 2.1 Verify Attendance model has all required fields

### Backend

- [ ] 2.2 Refactor computePayrollForEmployee method
- [ ] 2.3 Add helper methods (determineCategory, getHolidayCategory)
- [ ] Run migration: `php artisan migrate`
- [ ] Test payroll generation with new calculations

### Frontend

- [ ] 3.1 Update draft payroll table display
- [ ] 3.2 Update calculatePayroll function
- [ ] Test draft payroll display

### Employee Schedule

- [ ] 4.1 Fix total days calculation (frontend)
- [ ] 4.2 Fix total days calculation (backend)
- [ ] Test that rest days are not counted in total days

### Testing

- [ ] Generate test payroll with mixed day types
- [ ] Verify all premium breakdowns are calculated correctly
- [ ] Verify total days only counts working days
- [ ] Verify night shift on rest days shows correct premium

---

## Notes

### Data Dependencies

- Attendance records must have `is_holiday` and `holiday_type` fields populated during DTR processing
- Calendar table must have holiday entries with correct `type` field
- Employee schedules must mark rest days correctly
- EmployeeDeduction records must have correct `cut_off` field to apply in correct payroll period

### Potential Issues

1. **Timezone Issues:** Ensure all date comparisons use consistent timezone
2. **Holiday Detection:** Need to verify holiday detection logic during DTR processing
3. **Rest Day Detection:** Need to verify rest day detection from employee schedule
4. **Rounding:** Ensure all calculations use consistent rounding (2 decimal places)
5. **Deduction Cutoff:** Verify `cut_off` field matches payroll period (1st_half or 2nd_half)

### Testing Data Needed

- Employee with mixed regular and holiday work days
- Employee with rest day work
- Employee with night shift work
- Employee with OT on different day types

---

## Estimated Timeline

- Phase 1 (Database): 30 mins
- Phase 2 (Backend): 1.5 hours
- Phase 3 (Frontend): 1 hour
- Phase 4 (Employee Schedule): 15 mins
- **Total: ~3 hours**

---

## Next Steps

1. Review this plan
2. Confirm all requirements are captured
3. Proceed with Phase 1 implementation
4. Test each phase before moving to next
