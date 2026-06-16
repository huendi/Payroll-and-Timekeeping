# Payroll & Timekeeping Management System

A full-featured payroll and timekeeping management system designed specifically for Philippine companies. 
Built with modern web technologies, it provides comprehensive employee management, attendance tracking, 
payroll processing with statutory compliance, and role-based access control.

## 🚀 Features

### Employee Management
- Complete employee profiles with personal, contact, and employment details
- Government ID tracking (SSS, PhilHealth, PAG-IBIG, TIN)
- Banking information for payroll deposits
- Photo upload and management
- Department and position assignment
- Employment status tracking

### Attendance & Timekeeping
- DTR (Daily Time Record) upload and parsing
- Automatic hours calculation
- Rest day detection
- Night shift identification and premium pay
- Cutoff period management (1st half: 1-15, 2nd half: 16-end)
- Flexible scheduling (company-wide and individual employee schedules)

### Payroll Processing
- **Premium Pay Calculation**
  - Night Differential (10-20%)
  - Overtime (125-260%)
  - Holiday Pay (200% regular, 130% special)
  - Rest Day Premium (130%)
  - Additional Premium Categories (customizable)

- **Statutory Deductions**
  - SSS (Social Security System)
  - PhilHealth (Health Insurance)
  - PAG-IBIG/HDMF (Housing Loan)
  - Withholding Tax (Progressive brackets)

- **Custom Deductions**
  - Company Loans
  - Cash Advances
  - SSS Loans
  - PAG-IBIG Loans
  - Other Custom Deductions

- **Payroll Features**
  - Multi-period payroll generation
  - Draft view with detailed breakdown
  - Payroll approval workflow (Admin approval required)
  - Payslip generation and viewing
  - 13th Month Pay calculation

### Leave Management
- Leave type configuration
- Employee leave credits allocation
- Leave history tracking
- Accrual and utilization monitoring

### Holiday Calendar
- Customizable holiday calendar
- Holiday type classification (regular vs. special)
- Automatic premium pay application

### Role-Based Access Control (RBAC)
- **Admin Role**: Dashboard access, payroll approval, system overview
- **HR Role**: Full employee CRUD, payroll creation/generation, settings management
- Feature-level permission control across all modules

### Dashboard & Reporting
- Overview of key metrics
- Quick access to payroll and employees
- System-wide visibility

## 📋 Tech Stack

### Backend
- **Framework**: Laravel 12.x
- **Language**: PHP 8.2+
- **Database**: MySQL/PostgreSQL (via Laravel)
- **Authentication**: Laravel Fortify
- **Spreadsheet**: PHPOffice/PHPSpreadsheet (for DTR import/export)

### Frontend
- **Framework**: React 19.x
- **Routing**: Inertia.js
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI
- **Language**: TypeScript
- **Code Quality**: ESLint, Prettier

### Development Tools
- PHPUnit (Testing)
- Laravel Pint (Code Style)
- Laravel Pail (Logging)
- Laravel Sail (Docker environment)
- Faker (Data seeding)

## 🛠️ Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js (16+) and npm
- MySQL 8.0+ or PostgreSQL 13+

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll-timekeeping
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Setup database**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

5. **Install frontend dependencies**
   ```bash
   npm install
   ```

6. **Build frontend assets**
   ```bash
   npm run build
   ```

### Quick Setup Script
```bash
composer run setup
```

## 🚀 Running the Application

### Development
```bash
# Terminal 1: Start Laravel development server
php artisan serve

# Terminal 2: Start Vite dev server
npm run dev
```

### Production
```bash
npm run build
php artisan migrate --force
```

## 📁 Project Structure

```
├── app/
│   ├── Models/              # Eloquent models (Employee, Payroll, Attendance, etc.)
│   ├── Http/
│   │   ├── Controllers/     # API and Web controllers
│   │   ├── Requests/        # Form request validation
│   │   └── Middleware/      # Authentication, RBAC middleware
│   └── Notifications/       # Email notifications
├── database/
│   ├── migrations/          # Database schema
│   ├── seeders/            # Initial data seeding
│   └── factories/           # Model factories for testing
├── resources/
│   ├── js/                 # React components
│   ├── css/                # Tailwind CSS styles
│   └── views/              # Inertia page components
├── routes/
│   ├── web.php             # Web routes (role-based)
│   ├── settings.php        # Settings routes
│   └── console.php         # Artisan commands
├── config/                 # Configuration files
└── tests/                  # PHPUnit tests
```

## 🔐 Role-Based Access Control

| Feature | Admin | HR |
|---------|-------|-----|
| Dashboard | ✅ | ✅ |
| Employees (View) | ✅ | ✅ |
| Employees (Create/Edit/Delete) | ❌ | ✅ |
| Payroll (Create) | ❌ | ✅ |
| Payroll (View) | ✅ | ✅ |
| Payroll (Generate) | ❌ | ✅ |
| Payroll (Approve) | ✅ | ❌ |
| Payslips | ✅ | ✅ |
| Settings | ✅ (View) | ✅ (Full) |

## 📊 Database Models

- **User** - System users with roles
- **Employee** - Employee master data
- **Department** - Department structure
- **Payroll** - Payroll records per cutoff period
- **PayrollItem** - Line items for each payroll
- **Payslip** - Employee payslips
- **Attendance** - Daily time records
- **LeaveType** - Configured leave types
- **EmployeeLeaveCredit** - Leave balance tracking
- **EmployeeLeaveHistory** - Leave utilization tracking
- **Schedule** - Company-wide work schedules
- **EmployeeSchedule** - Individual employee schedules
- **Calendar** - Holiday calendar
- **PremiumType** - Premium pay rates and configurations
- **DeductionSetting** - Deduction brackets and settings
- **EmployeeDeduction** - Individual employee loan/advance deductions
- **ThirteenthMonthPay** - 13th month pay records

## 🔄 Payroll Processing Workflow

1. **Upload DTR**: HR uploads daily time records (Excel format)
2. **Validate Dates**: System validates dates against cutoff period
3. **Calculate Hours**: Automatic hours calculation from time records
4. **Apply Premiums**: Night differential, overtime, holidays automatically calculated
5. **Draft Payroll**: Review with full breakdown before finalizing
6. **Generate Payroll**: Create payroll records
7. **Admin Approval**: Admin reviews and approves payroll
8. **Generate Payslips**: Individual payslips created for employees
9. **Payment**: Process payroll to employees

## 🇵🇭 Philippine Compliance

This system is built with Philippine statutory requirements:
- **SSS**: Social Security System contributions
- **PhilHealth**: National Health Insurance contribution
- **PAG-IBIG/HDMF**: Pagibig Fund Housing Loan contribution
- **BIR**: Bureau of Internal Revenue tax withholding
- **Holidays**: Regular and special holiday classifications per calendar

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/PayrollTest.php

# Run with coverage
php artisan test --coverage
```

## 📝 Code Quality

```bash
# Run ESLint with auto-fix
npm run lint

# Format code with Prettier
npm run format

# Type checking
npm run types

# Check formatting
npm run format:check
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for Philippine businesses**
```

---

**Key Highlights:**
- ✅ **Purpose**: Comprehensive payroll and timekeeping system for Philippine companies
- ✅ **Tech Stack**: Laravel 12, React, Inertia.js, TypeScript, Tailwind CSS
- ✅ **Core Features**: Employee management, DTR tracking, payroll with statutory compliance, leave management, RBAC
- ✅ **Compliance**: SSS, PhilHealth, PAG-IBIG, BIR tax compliance built-in
- ✅ **Workflow**: Complete payroll processing pipeline from DTR upload to approval

This documentation is ready to be added to your GitHub repository without any changes to your existing code.---

**Key Highlights:**
- ✅ **Purpose**: Comprehensive payroll and timekeeping system for Philippine companies
- ✅ **Tech Stack**: Laravel 12, React, Inertia.js, TypeScript, Tailwind CSS
- ✅ **Core Features**: Employee management, DTR tracking, payroll with statutory compliance, leave management, RBAC
- ✅ **Compliance**: SSS, PhilHealth, PAG-IBIG, BIR tax compliance built-in
- ✅ **Workflow**: Complete payroll processing pipeline from DTR upload to approval

This documentation is ready to be added to your GitHub repository without any changes to your existing code.
