# Payroll System Data Integration Checklist

## ✅ Current Status

### 1. **Schedule (General Company Schedule)**

- ✅ Table: `schedules`
- ✅ Model: `App\Models\Schedule`
- ✅ Data: 1 schedule exists
- **Fields:**
    - `name`: Schedule name
    - `year`: Year
    - `regular_start`: 08:00:00
    - `regular_end`: 17:00:00
    - `night_start`: 22:00:00
    - `night_end`: 06:00:00
- **Usage:** Used for night differential calculation and default work hours

### 2. **Employee Schedule (Individual Work/Rest Days)**

- ✅ Table: `employee_schedules`
- ✅ Model: `App\Models\EmployeeSchedule`
- ✅ Data: 13 schedules exist
- **Fields:**
    - `employee_id`: Employee reference
    - `date`: Specific date
    - `type`: 'work' or 'rest'
    - `time_in`: Optional custom time in
    - `time_out`: Optional custom time out
- **Usage:** Determines if a day is a rest day (130% premium)

### 3. **Premium Categories & Types**

- ✅ Table: `premium_categories`, `premium_types`
- ✅ Model: `App\Models\PremiumCategory`, `App\Models\PremiumType`
- ⚠️ Data: No premium categories found (needs seeding)
- **Categories:**
    1. Night Differential (10-13%)
    2. Overtime Pay (125%)
    3. Additional Premium Pay (130-260%)
- **Action Required:** Run `php artisan db:seed --class=PremiumSeeder`

### 4. **Deduction Settings**

- ✅ Table: `deduction_settings`
- ✅ Model: `App\Models\DeductionSetting`
- ✅ Data: 8 settings exist
- **Types:**
    - SSS (4.5% employee share)
    - PhilHealth/PHIC (2.5% employee share)
    - HDMF/Pag-IBIG (₱100 fixed)
    - Withholding Tax (progressive)
- **Usage:** Used for statutory deductions calculation

### 5. **Calendar (Holidays)**

- ✅ Table: `calendars`
- ✅ Model: `App\Models\Calendar`
- ⚠️ Data: 0 holidays (needs data)
- **Fields:**
    - `date`: Holiday date
    - `type`: 'regular' or 'special'
    - `name`: Holiday name
- **Usage:** Determines holiday premium pay (200% regular, 130% special)

### 6. **Employee Deductions (Loans)**

- ✅ Table: `employee_deductions`
- ✅ Model: `App\Models\EmployeeDeduction`
- **Types:**
    - company_loan
    - cash_advance
    - sss_loan
    - hdmf_loan
    - other (custom)
- **Usage:** Deducted per cutoff period

## 📋 Payroll Generation Flow

### Current Implementation:

1. ✅ Upload DTR Excel (9 columns)
2. ✅ Parse employee number, date, time in/out
3. ✅ Calculate hours worked (from Excel or computed)
4. ✅ Parse OT hours (from Excel)
5. ✅ Check Employee Schedule for rest days
6. ⚠️ Check Calendar for holidays (not implemented - no data)
7. ✅ Calculate night differential using Schedule
8. ✅ Store in `attendances` table
9. ✅ Display draft with calculations

### What Needs Integration:

#### A. **Premium Calculations** (Currently Simplified)

- ✅ Regular OT: 125% (hardcoded)
- ✅ Rest Day: 130% (hardcoded)
- ✅ Night Diff: 10% regular, 13% restday (hardcoded)
- ⚠️ **TODO:** Use `premium_types` table for rates
- ⚠️ **TODO:** Holiday premiums (200% regular, 130% special)
- ⚠️ **TODO:** Holiday on restday (260% regular, 150% special)

#### B. **Deduction Calculations** (Currently Simplified)

- ✅ SSS: 4.5% (hardcoded)
- ✅ PHIC: 2.5% (hardcoded)
- ✅ HDMF: ₱100 (hardcoded)
- ⚠️ **TODO:** Use `deduction_settings` table for actual brackets
- ⚠️ **TODO:** Progressive tax calculation
- ⚠️ **TODO:** Employee loans from `employee_deductions`

#### C. **Schedule Integration**

- ✅ General Schedule: Used for night diff calculation
- ✅ Employee Schedule: Used for rest day detection
- ✅ Late calculation: Compares clock in vs scheduled in
- ✅ Absence detection: Missing dates in DTR

## 🔧 Recommended Actions

### Immediate:

1. ✅ **Schedule exists** - Working correctly
2. ✅ **Employee Schedules exist** - Working correctly
3. ⚠️ **Seed Premium Types** - Run seeder
4. ⚠️ **Add Holidays** - Create calendar entries for 2025

### For Full Implementation:

1. **Update PayrollController** to use:
    - `PremiumType` rates instead of hardcoded percentages
    - `DeductionSetting` brackets for SSS/PHIC/HDMF
    - `Calendar` for holiday detection and premiums
    - `EmployeeDeduction` for loan deductions

2. **Update Frontend** to show:
    - Actual premium rates from database
    - Deduction brackets breakdown
    - Holiday indicators with proper rates

## 📊 Current Calculation Summary

### Earnings:

- Basic Pay = Regular Hours × Hourly Rate
- Rest Day Pay = Rest Day Hours × Hourly Rate × 1.30
- Allowance = (Regular + Rest Day) × Hourly Allowance × Rate
- Rest Day Premium = Rest Day Hours × Hourly Rate × 0.30
- Regular OT = OT Hours × Hourly Rate × 1.25
- Night Diff = ND Hours × Hourly Rate × (0.10 or 0.13)

### Deductions:

- SSS = Gross × 0.045
- PHIC = Gross × 0.025
- HDMF = ₱100 fixed
- Late = (Late Minutes / 60) × Hourly Rate
- Loans = (Not yet implemented)

### Net Pay:

- Net = Gross - Total Deductions

## ✅ What's Working:

1. DTR upload and parsing
2. Hours calculation (from Excel or computed)
3. Rest day detection from employee schedules
4. Night differential calculation using schedule
5. Basic premium calculations (hardcoded rates)
6. Basic deduction calculations (hardcoded rates)
7. Draft view with full breakdown
8. Index page with totals

## ⚠️ What Needs Improvement:

1. Use premium_types table for dynamic rates
2. Use deduction_settings for accurate brackets
3. Implement holiday detection and premiums
4. Implement loan deductions
5. Implement progressive tax calculation
6. Add absence deduction calculation
