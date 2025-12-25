# Business Requirements Document (BRD)

## Mazin - Port Sudan Export/Import Management System

---

## 1. Executive Summary

Mazin is a comprehensive logistics management platform designed for customs clearance and freight operations at Port Sudan. The system will digitize shipment tracking, customs declarations, document management, and invoicing processes.

---

## 2. Business Problem Statement

### Current State
- **Manual shipment tracking** using paper logs and spreadsheets
- **Paper-based customs documentation** prone to errors and delays
- **Disconnected invoicing** separate from operations data
- **No real-time visibility** for shipment status
- **Language barriers** with English-only legacy systems

### Impact
- 3-5 day average customs clearance delays
- 15% document error rate requiring re-submission
- Lost revenue from invoicing inconsistencies
- Customer dissatisfaction due to lack of visibility
- Staff inefficiency from manual data entry

---

## 3. Business Goals

| # | Goal | Success Metric |
|---|------|----------------|
| BG1 | Reduce customs processing time | 50% reduction in clearance time |
| BG2 | Improve document accuracy | < 2% error rate |
| BG3 | Enable real-time tracking | 100% shipment visibility |
| BG4 | Streamline invoicing | Same-day invoice generation |
| BG5 | Support Arabic users | Full RTL Arabic interface |

---

## 4. Functional Requirements

### 4.1 User Management (FR1-FR3)

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR1 | User authentication with email/password | Must | As a user, I can log in securely |
| FR2 | Role-based access control (Admin, Manager, Clerk, Viewer) | Must | As an admin, I can assign roles to users |
| FR3 | Password reset functionality | Should | As a user, I can reset my forgotten password |

### 4.2 Shipment Management (FR4-FR8)

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR4 | Create shipment (import/export) | Must | As a clerk, I can register a new shipment |
| FR5 | View shipment list with filters | Must | As a user, I can search and filter shipments |
| FR6 | Update shipment status | Must | As a clerk, I can update shipment progress |
| FR7 | View shipment details | Must | As a user, I can see all shipment information |
| FR8 | Track container and vessel info | Should | As a user, I can see container and vessel details |

### 4.3 Customs Processing (FR9-FR13)

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR9 | Create customs declaration | Must | As a customs officer, I can create a declaration |
| FR10 | Upload supporting documents | Must | As a clerk, I can attach documents to declarations |
| FR11 | Declaration approval workflow | Must | As a manager, I can approve/reject declarations |
| FR12 | Calculate duties and taxes | Should | As a system, I can calculate applicable duties |
| FR13 | Track declaration status | Must | As a user, I can see declaration progress |

### 4.4 Invoicing (FR14-FR18)

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR14 | Create invoice from shipment | Must | As an accountant, I can generate an invoice |
| FR15 | Add line items (services, duties, fees) | Must | As an accountant, I can add invoice items |
| FR16 | Multi-currency support (SDG, USD, SAR) | Must | As a user, I can select invoice currency |
| FR17 | Generate PDF invoice | Must | As an accountant, I can download PDF invoice |
| FR18 | Track payment status | Should | As an accountant, I can mark invoices as paid |

### 4.5 Dashboard & Reporting (FR19-FR21)

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR19 | Dashboard with KPI cards | Must | As a manager, I can see key metrics |
| FR20 | Recent shipments widget | Must | As a user, I can see recent activity |
| FR21 | Pending customs widget | Should | As a manager, I can see pending approvals |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time < 3 seconds
- API response time < 500ms
- Support 50 concurrent users

### 5.2 Security
- HTTPS encryption
- Password hashing (bcrypt)
- Session-based authentication
- Role-based authorization

### 5.3 Usability
- Arabic (RTL) primary language
- English (LTR) secondary language
- Mobile-responsive design
- WCAG 2.1 AA accessibility

### 5.4 Reliability
- 99.5% uptime SLA
- Daily database backups
- Error logging and monitoring

### 5.5 Scalability
- Serverless architecture (auto-scaling)
- Database connection pooling
- CDN for static assets

---

## 6. User Roles & Permissions

| Feature | Admin | Manager | Clerk | Viewer |
|---------|-------|---------|-------|--------|
| User Management | CRUD | Read | - | - |
| Shipments | CRUD | CRUD | CRUD | Read |
| Customs | CRUD | CRUD | CRU | Read |
| Approve Declarations | Yes | Yes | No | No |
| Invoices | CRUD | CRUD | CRU | Read |
| Dashboard | Full | Full | Limited | Limited |
| Settings | Full | Read | - | - |

---

## 7. Data Requirements

### 7.1 Core Entities
- **User** - Authentication and profile
- **Shipment** - Import/export tracking
- **CustomsDeclaration** - Customs paperwork
- **Document** - File attachments
- **Invoice** - Billing records
- **InvoiceItem** - Line items

### 7.2 Data Relationships
```
User (1) ─────► (n) Shipment
Shipment (1) ─► (n) CustomsDeclaration
CustomsDeclaration (1) ─► (n) Document
Shipment (1) ─► (n) Invoice
Invoice (1) ─► (n) InvoiceItem
```

### 7.3 Data Retention
- Active records: Indefinite
- Archived records: 7 years
- Audit logs: 2 years

---

## 8. Integration Requirements

### 8.1 Phase 1 (MVP)
- None - standalone system

### 8.2 Phase 2+ (Future)
- Government customs API
- Banking/payment systems
- SMS notification service
- Email service (Resend)

---

## 9. Constraints & Assumptions

### Constraints
- Single company deployment (not multi-tenant)
- Browser-based only (no native mobile apps)
- Internet connectivity required

### Assumptions
- Users have basic computer literacy
- Stable internet connection available
- Management approval for process changes

---

## 10. Acceptance Criteria

The system will be accepted when:
1. All "Must" priority requirements are implemented
2. User acceptance testing passes with > 90% success rate
3. Performance benchmarks are met
4. Security audit passes
5. Arabic localization is complete

---

## 11. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Business Stakeholder | | | |
| Technical Lead | | | |

---

*Document Version: 1.0*
*Last Updated: December 2025*
