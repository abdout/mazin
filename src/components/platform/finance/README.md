# Finance Block - Customs Clearance Financial Management

## Overview

The Finance Block is a comprehensive, feature-based financial management system for customs clearance operations. It implements double-entry bookkeeping with specialized sub-blocks covering all aspects of customs clearance finance operations including client billing, government duties, operational expenses, and payroll.

## Architecture

### Design Principles

1. **Feature-Based Architecture**: Each sub-block is fully self-contained with minimal dependencies
2. **Double-Entry Bookkeeping**: All financial transactions automatically create balanced journal entries
3. **Multi-Tenant**: Row-level data isolation using `companyId`
4. **Hybrid Permissions**: Role-based + granular access control
5. **Type-Safe**: Full TypeScript with Zod validation
6. **Mirror Pattern**: Routes exactly match component structure

### Directory Structure

```
src/components/platform/finance/
├── lib/
│   ├── permissions.ts              # Shared permission utilities
│   └── accounting/                 # Double-entry integration
│       ├── types.ts               # Core accounting types
│       ├── utils.ts               # Journal entry utilities
│       ├── posting-rules.ts       # Module-specific posting rules
│       ├── seed-accounts.ts       # Chart of accounts seeding
│       ├── actions.ts             # Server actions
│       └── index.ts               # Public API
├── invoice/                        # Client invoicing (clearance services)
├── receipt/                        # Receipt & document management
├── banking/                        # Banking integration
├── fees/                          # Service charges & government duties
├── salary/                        # Employee salary structures
├── payroll/                       # Payroll processing
├── timesheet/                     # Staff time tracking
├── wallet/                        # Client deposits & prepayments
├── budget/                        # Budget planning
├── expenses/                      # Operational expenses
├── accounts/                      # Chart of accounts & ledger
├── reports/                       # Financial reporting
└── content.tsx                    # Main finance dashboard
```

## Sub-Blocks (Customs Clearance Context)

### 1. Invoice (`/finance/invoice`)

**Purpose**: Client invoicing for customs clearance services

**Features**:

- Professional invoice generation for clearance services
- Multi-currency support (SDG, USD, EUR, SAR)
- Payment tracking
- Email delivery
- Status management

**Accounting Integration**:

```typescript
// When invoice is paid
DR: Cash/Bank Account
CR: Accounts Receivable
```

### 2. Receipt (`/finance/receipt`)

**Purpose**: Document management and expense tracking

**Features**:

- Receipt generation
- AI OCR for document scanning
- Shipment document tracking
- Transaction history

### 3. Banking (`/finance/banking`)

**Purpose**: Bank account and transaction management

**Features**:

- Multiple bank account management
- Transaction tracking
- Payment transfers
- Bank reconciliation
- Multi-currency accounts

### 4. Fees / Service Charges (`/finance/fees`)

**Purpose**: Service charges and government duties management

**Fee Types**:

- Clearance Service Fees
- Documentation Fees
- Government Customs Duties
- Port/Terminal Charges
- Transportation Charges
- Storage/Demurrage Fees
- Inspection Fees
- Insurance Charges

**Accounting Integration**:

```typescript
// Service Fee Assignment
DR: Client Receivable
CR: Service Revenue

// Duty Payment (on behalf of client)
DR: Client Receivable
CR: Duties Payable

// Client Payment Received
DR: Cash/Bank Account
CR: Client Receivable
```

### 5. Salary (`/finance/salary`)

**Purpose**: Employee salary structure management

**Features**:

- Salary structure definition
- Allowances and deductions
- Salary calculator
- Bulk operations

### 6. Payroll (`/finance/payroll`)

**Purpose**: Payroll processing and disbursement

**Features**:

- Payroll run creation
- Salary slip generation
- Tax calculations
- Approval workflow
- Disbursement management

**Accounting Integration**:

```typescript
// Salary Payment
DR: Salary Expense
DR: Payroll Tax Expense
CR: Cash/Bank Account
CR: Tax Payable
CR: Social Security Payable
```

### 7. Timesheet (`/finance/timesheet`)

**Purpose**: Staff time tracking

**Features**:

- Timesheet periods
- Hour tracking
- Overtime calculation
- Approval workflow
- Payroll integration

### 8. Wallet (`/finance/wallet`)

**Purpose**: Client deposits and prepayments

**Features**:

- Client deposit management
- Prepayment tracking
- Balance monitoring
- Transaction history

**Accounting Integration**:

```typescript
// Client Deposit
DR: Cash/Bank Account
CR: Client Deposits (Liability)
```

### 9. Budget (`/finance/budget`)

**Purpose**: Budget planning and tracking

**Features**:

- Budget creation
- Department allocation
- Spending tracking
- Variance analysis

### 10. Expenses (`/finance/expenses`)

**Purpose**: Operational expense management

**Expense Categories**:

- Port & Terminal Charges
- Transportation & Logistics
- Government Fees & Levies
- Storage & Warehousing
- Communication & IT
- Office Operations
- Vehicle & Fleet
- Professional Services
- Staff Allowances
- Miscellaneous

**Accounting Integration**:

```typescript
// Expense Payment
DR: Expense Account (by category)
CR: Cash/Bank Account
```

### 11. Accounts (`/finance/accounts`)

**Purpose**: Core accounting system

**Features**:

- Chart of accounts
- Journal entries
- General ledger
- Fiscal year management
- Period closing

**Account Structure**:

- **Assets**: Cash, Bank Accounts, Accounts Receivable, Fixed Assets
- **Liabilities**: Accounts Payable, Salary Payable, Tax Payable, Client Deposits
- **Equity**: Retained Earnings, Current Year Earnings
- **Revenue**: Clearance Fees, Documentation Fees, Handling Fees, Other Revenue
- **Expenses**: Salaries, Port Charges, Transportation, Storage, Utilities

### 12. Reports (`/finance/reports`)

**Purpose**: Financial reporting and analysis

**Features**:

- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Trial Balance
- Revenue/Expense Analysis
- Client Profitability Reports
- Shipment Financial Summary

## Customs Clearance Specific Features

### Service Types

- Import Clearance
- Export Clearance
- Transit Operations
- Re-export Services
- Temporary Import/Export

### Client Management

- Importers/Exporters profiles
- Credit limit management
- Payment terms
- Shipment history
- Outstanding balances

### Multi-Currency Support

- Primary: SDG (Sudanese Pound)
- Secondary: USD, EUR, SAR
- Automatic rate conversion
- Currency gain/loss tracking

### Government Duties Handling

- Customs duties calculation
- Tax collection on behalf
- Duty payment tracking
- Refund processing

## Permissions

### Hybrid Permission System

The finance block uses a two-tier permission system:

1. **Role-Based (Base Layer)**:
   - `ADMIN`: Full access to all modules
   - `ACCOUNTANT`: Full access to all modules
   - `DEVELOPER`: Full access across all tenants

2. **Granular Permissions (Fine-Tuning)**:
   - Module-specific permissions
   - Action-based control (view, create, edit, delete, approve, process, export)

### Permission Modules

- `invoice`, `receipt`, `banking`, `fees`, `salary`, `payroll`, `timesheet`, `wallet`, `budget`, `expenses`, `accounts`, `reports`

### Permission Actions

- `view`, `create`, `edit`, `delete`, `approve`, `process`, `export`

## Best Practices

### Transaction Recording

1. **Always use server actions**: Never create journal entries directly from client components
2. **Validate before posting**: Use Zod schemas to validate data
3. **Include references**: Always link journal entries to source transactions
4. **Track shipments**: Link financial records to shipment IDs when applicable

### Multi-Currency Handling

1. **Store in base currency**: Convert all amounts to SDG for accounting
2. **Track original currency**: Keep original currency and amount for reference
3. **Record exchange rates**: Store rate used at transaction time

### Client Operations

1. **Verify credit limits**: Check client credit before processing
2. **Track outstanding balances**: Monitor receivables aging
3. **Apply deposits**: Use wallet balances when available
