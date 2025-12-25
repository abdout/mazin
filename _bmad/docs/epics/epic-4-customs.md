# Epic 4: Customs Processing

## Overview

**Epic ID**: E4
**Priority**: Must
**Sprint**: 5
**Total Points**: 18

---

## Goal

Implement customs declaration management with document uploads and approval workflow for import/export clearance.

---

## Stories

### Story 4.1: Create Customs Declaration

**ID**: E4-S1
**Points**: 5
**Priority**: Must

**As a** customs officer
**I want to** create a customs declaration
**So that** I can process shipment clearance

**Acceptance Criteria**:
- [ ] Link to existing shipment (required)
- [ ] Auto-generate declaration number
- [ ] Form with customs fields
- [ ] Validation with error messages
- [ ] Success notification
- [ ] Initial status: DRAFT

**Fields**:
| Field | Type | Required |
|-------|------|----------|
| Shipment | Select | Yes |
| HS Code | Text | No |
| Duty Amount | Currency | No |
| Tax Amount | Currency | No |
| Currency | Select | Yes |
| Notes | Textarea | No |

---

### Story 4.2: Upload Supporting Documents

**ID**: E4-S2
**Points**: 5
**Priority**: Must

**As a** clerk
**I want to** upload documents
**So that** I can attach supporting paperwork

**Acceptance Criteria**:
- [ ] File upload component
- [ ] Accept PDF, JPG, PNG
- [ ] Max file size: 10MB
- [ ] Multiple files allowed
- [ ] Preview uploaded files
- [ ] Delete uploaded file
- [ ] Progress indicator

**Document Types**:
- Bill of Lading
- Commercial Invoice
- Packing List
- Certificate of Origin
- Insurance Certificate
- Other

---

### Story 4.3: Declaration List View

**ID**: E4-S3
**Points**: 3
**Priority**: Must

**As a** user
**I want to** view all declarations
**So that** I can manage customs processing

**Acceptance Criteria**:
- [ ] Data table with pagination
- [ ] Filter by status
- [ ] Search by declaration number
- [ ] Status badge colors
- [ ] Link to related shipment

**Status Colors**:
| Status | Color |
|--------|-------|
| DRAFT | Gray |
| SUBMITTED | Blue |
| UNDER_REVIEW | Yellow |
| APPROVED | Green |
| REJECTED | Red |

---

### Story 4.4: Declaration Approval Workflow

**ID**: E4-S4
**Points**: 3
**Priority**: Must

**As a** manager
**I want to** approve or reject declarations
**So that** I can control customs clearance

**Acceptance Criteria**:
- [ ] Approve button (Manager/Admin only)
- [ ] Reject button with reason
- [ ] Cannot approve without documents
- [ ] Email notification (Phase 2)
- [ ] Status history tracked

**Workflow**:
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
                                 → REJECTED
```

**Transitions**:
| From | To | Role |
|------|-----|------|
| DRAFT | SUBMITTED | Clerk |
| SUBMITTED | UNDER_REVIEW | Manager |
| UNDER_REVIEW | APPROVED | Manager |
| UNDER_REVIEW | REJECTED | Manager |
| REJECTED | DRAFT | Clerk |

---

### Story 4.5: Declaration Detail View

**ID**: E4-S5
**Points**: 2
**Priority**: Must

**As a** user
**I want to** view declaration details
**So that** I can see customs information

**Acceptance Criteria**:
- [ ] Display all declaration fields
- [ ] Show linked shipment info
- [ ] List uploaded documents
- [ ] Download document links
- [ ] Approval actions (if permitted)
- [ ] Status history

---

## Dependencies

- Shipments complete (E3)
- Vercel Blob configured (file storage)

---

## Technical Notes

- Use Vercel Blob for document storage
- Server actions for file upload
- Document model linked to declaration

---

*Epic Version: 1.0*
