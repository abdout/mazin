# Epic 5: Invoicing

## Overview

**Epic ID**: E5
**Priority**: Must
**Sprint**: 6
**Total Points**: 18

---

## Goal

Implement invoice generation with line items, multi-currency support, and PDF export for billing logistics services.

---

## Stories

### Story 5.1: Create Invoice

**ID**: E5-S1
**Points**: 5
**Priority**: Must

**As an** accountant
**I want to** create an invoice
**So that** I can bill for services

**Acceptance Criteria**:
- [ ] Auto-generate invoice number
- [ ] Link to shipment (optional)
- [ ] Select currency (SDG, USD, SAR)
- [ ] Set due date
- [ ] Initial status: DRAFT
- [ ] Validation with error messages

**Fields**:
| Field | Type | Required |
|-------|------|----------|
| Shipment | Select | No |
| Currency | Select | Yes |
| Due Date | Date | No |
| Tax Rate | Number | No |
| Notes | Textarea | No |

---

### Story 5.2: Manage Line Items

**ID**: E5-S2
**Points**: 5
**Priority**: Must

**As an** accountant
**I want to** add line items to invoice
**So that** I can itemize charges

**Acceptance Criteria**:
- [ ] Add line item button
- [ ] Description, quantity, unit price fields
- [ ] Auto-calculate line total
- [ ] Remove line item
- [ ] Reorder items (drag or arrows)
- [ ] Subtotal auto-calculated
- [ ] Tax auto-calculated
- [ ] Grand total displayed

**Common Services**:
- Customs clearance fee
- Port handling charges
- Documentation fee
- Storage charges
- Transportation
- Insurance
- Duty payment service

---

### Story 5.3: Invoice List View

**ID**: E5-S3
**Points**: 3
**Priority**: Must

**As a** user
**I want to** view all invoices
**So that** I can manage billing

**Acceptance Criteria**:
- [ ] Data table with pagination
- [ ] Filter by status
- [ ] Filter by currency
- [ ] Search by invoice number
- [ ] Display total amount
- [ ] Status badge colors
- [ ] Overdue highlighting

**Columns**:
| Column | Sortable |
|--------|----------|
| Invoice # | Yes |
| Status | Yes |
| Amount | Yes |
| Currency | Yes |
| Due Date | Yes |
| Created | Yes |

---

### Story 5.4: Generate PDF Invoice

**ID**: E5-S4
**Points**: 3
**Priority**: Must

**As an** accountant
**I want to** download PDF invoice
**So that** I can send to clients

**Acceptance Criteria**:
- [ ] PDF generation on button click
- [ ] Company letterhead/logo
- [ ] All invoice details included
- [ ] Line items table
- [ ] Totals section
- [ ] Arabic and English versions
- [ ] RTL layout for Arabic

**PDF Sections**:
1. Company header (logo, contact)
2. Invoice info (number, date, due date)
3. Bill to (client details)
4. Line items table
5. Subtotal, tax, total
6. Payment instructions
7. Footer (terms, notes)

---

### Story 5.5: Track Payment Status

**ID**: E5-S5
**Points**: 2
**Priority**: Should

**As an** accountant
**I want to** mark invoices as paid
**So that** I can track receivables

**Acceptance Criteria**:
- [ ] Mark as Sent (from Draft)
- [ ] Mark as Paid (record date)
- [ ] Mark as Overdue (auto or manual)
- [ ] Cancel invoice option
- [ ] Payment date recorded

**Status Workflow**:
```
DRAFT → SENT → PAID
             → OVERDUE → PAID
             → CANCELLED
```

---

## Dependencies

- Shipments complete (E3)
- PDF generation library (react-pdf or similar)

---

## Technical Notes

- Use @react-pdf/renderer for PDF
- Decimal.js for currency calculations
- Proper rounding for totals

**Currency Format**:
| Currency | Format | Example |
|----------|--------|---------|
| SDG | SDG #,### | SDG 1,234 |
| USD | $#,###.## | $1,234.56 |
| SAR | SAR #,###.## | SAR 1,234.56 |

---

*Epic Version: 1.0*
