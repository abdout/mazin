# Epic 3: Shipment Management

## Overview

**Epic ID**: E3
**Priority**: Must
**Sprint**: 4
**Total Points**: 21

---

## Goal

Implement full shipment tracking for import and export cargo, including creation, listing, status updates, and detailed views.

---

## Stories

### Story 3.1: Create Shipment

**ID**: E3-S1
**Points**: 5
**Priority**: Must

**As a** clerk
**I want to** create a new shipment
**So that** I can track incoming/outgoing cargo

**Acceptance Criteria**:
- [ ] Form with all shipment fields
- [ ] Type selection (Import/Export)
- [ ] Auto-generate shipment number
- [ ] Validation with error messages
- [ ] Success toast notification
- [ ] Redirect to detail page on save

**Fields**:
| Field | Type | Required |
|-------|------|----------|
| Type | Select | Yes |
| Description | Textarea | Yes |
| Consignor | Text | Yes |
| Consignee | Text | Yes |
| Container No | Text | No |
| Vessel Name | Text | No |
| Weight | Number | No |
| Quantity | Number | No |
| Arrival Date | Date | No |
| Departure Date | Date | No |

---

### Story 3.2: Shipment List View

**ID**: E3-S2
**Points**: 5
**Priority**: Must

**As a** user
**I want to** view all shipments in a list
**So that** I can find and manage shipments

**Acceptance Criteria**:
- [ ] Data table with pagination
- [ ] Sortable columns
- [ ] Filter by status
- [ ] Search by shipment number, consignee
- [ ] Status badge colors
- [ ] Row click to detail page
- [ ] Responsive table design

**Columns**:
| Column | Sortable | Filter |
|--------|----------|--------|
| Shipment # | Yes | Search |
| Type | Yes | Select |
| Status | Yes | Select |
| Consignee | Yes | Search |
| Arrival Date | Yes | Date Range |
| Created | Yes | - |

---

### Story 3.3: Shipment Detail View

**ID**: E3-S3
**Points**: 3
**Priority**: Must

**As a** user
**I want to** view shipment details
**So that** I can see all information about a shipment

**Acceptance Criteria**:
- [ ] Display all shipment fields
- [ ] Status badge prominently shown
- [ ] Edit button (if permitted)
- [ ] Delete button (admin only)
- [ ] Related customs declarations
- [ ] Related invoices
- [ ] Timeline/activity log (optional)

---

### Story 3.4: Edit Shipment

**ID**: E3-S4
**Points**: 3
**Priority**: Must

**As a** clerk
**I want to** edit shipment details
**So that** I can correct or update information

**Acceptance Criteria**:
- [ ] Pre-filled form with current values
- [ ] Same validation as create
- [ ] Cancel button returns to detail
- [ ] Success notification on save
- [ ] Optimistic update (optional)

---

### Story 3.5: Update Shipment Status

**ID**: E3-S5
**Points**: 3
**Priority**: Must

**As a** clerk
**I want to** update shipment status
**So that** I can track progress through workflow

**Acceptance Criteria**:
- [ ] Status dropdown on detail page
- [ ] Only valid next statuses shown
- [ ] Confirmation for status change
- [ ] Timestamp recorded

**Status Workflow**:
```
PENDING → IN_TRANSIT → ARRIVED → CLEARED → DELIVERED
```

---

### Story 3.6: Delete Shipment

**ID**: E3-S6
**Points**: 2
**Priority**: Should

**As an** admin
**I want to** delete a shipment
**So that** I can remove incorrect entries

**Acceptance Criteria**:
- [ ] Admin role only
- [ ] Confirmation dialog
- [ ] Soft delete (optional) or cascade
- [ ] Cannot delete if has invoices
- [ ] Redirect to list after delete

---

## Dependencies

- Authentication complete (E1)
- Platform layout (E2)
- Prisma Shipment model

---

## Technical Notes

- Feature module pattern: `/components/platform/shipments/`
- Server actions in `actions.ts`
- Zod schemas in `validation.ts`
- TanStack Table for data table

---

*Epic Version: 1.0*
