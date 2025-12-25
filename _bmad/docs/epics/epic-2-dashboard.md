# Epic 2: Dashboard

## Overview

**Epic ID**: E2
**Priority**: Must
**Sprint**: 3
**Total Points**: 8

---

## Goal

Create a dashboard that provides at-a-glance visibility of key metrics, recent activity, and quick actions for logistics operations.

---

## Stories

### Story 2.1: KPI Cards

**ID**: E2-S1
**Points**: 3
**Priority**: Must

**As a** manager
**I want to** see key metrics on the dashboard
**So that** I can monitor operations at a glance

**Acceptance Criteria**:
- [ ] Total shipments (with period comparison)
- [ ] Pending customs declarations
- [ ] Unpaid invoices amount
- [ ] Shipments in transit
- [ ] Cards show loading state
- [ ] Arabic number formatting
- [ ] Responsive grid layout

**KPI Cards**:
| Card | Data | Icon |
|------|------|------|
| Shipments | Total count | Ship |
| In Transit | Active shipments | Truck |
| Pending Customs | Awaiting approval | FileText |
| Invoices Due | Unpaid amount | DollarSign |

---

### Story 2.2: Recent Shipments Widget

**ID**: E2-S2
**Points**: 3
**Priority**: Must

**As a** user
**I want to** see recent shipments
**So that** I can quickly access current work

**Acceptance Criteria**:
- [ ] Display last 5 shipments
- [ ] Show shipment number, status, date
- [ ] Click to navigate to detail
- [ ] Status badge with color
- [ ] "View All" link to shipments list
- [ ] Empty state when no shipments

---

### Story 2.3: Quick Actions

**ID**: E2-S3
**Points**: 2
**Priority**: Should

**As a** clerk
**I want to** quickly create new items
**So that** I can work efficiently

**Acceptance Criteria**:
- [ ] "New Shipment" button
- [ ] "New Declaration" button
- [ ] "New Invoice" button
- [ ] Actions based on user role
- [ ] Keyboard shortcut hints (optional)

---

## Dependencies

- Authentication complete (E1)
- Platform layout template
- Shipment, Customs, Invoice models

---

## Technical Notes

- Use Server Components for data fetching
- StatCard atom component
- Real-time refresh not required (MVP)

---

*Epic Version: 1.0*
