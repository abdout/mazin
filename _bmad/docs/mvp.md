# MVP Scope Document

## Mazin - Minimum Viable Product Definition

---

## 1. MVP Vision

Deliver a functional logistics management platform that enables Port Sudan customs and freight operations to digitize their core workflows: shipment tracking, customs declarations, and invoicing.

---

## 2. MVP Success Criteria

| Metric | Target |
|--------|--------|
| User authentication | 100% functional |
| Shipment CRUD | Complete workflow |
| Customs processing | Basic workflow |
| Invoice generation | PDF output |
| Arabic/English | Full support |
| Mobile responsive | All pages |

---

## 3. In-Scope Features (MVP)

### 3.1 Authentication & Users (Priority: Must)

| Feature | Description |
|---------|-------------|
| Email/password login | Secure credential authentication |
| Role-based access | Admin, Manager, Clerk, Viewer |
| Session management | NextAuth v5 with JWT |
| Protected routes | Middleware-based auth checks |

### 3.2 Dashboard (Priority: Must)

| Feature | Description |
|---------|-------------|
| KPI cards | Shipments, customs, invoices metrics |
| Recent activity | Last 10 shipments |
| Pending items | Awaiting action count |
| Quick actions | Create shipment, declaration |

### 3.3 Shipment Management (Priority: Must)

| Feature | Description |
|---------|-------------|
| Create shipment | Import/export with details |
| List view | Filterable, sortable table |
| Detail view | Full shipment information |
| Status updates | Workflow progression |
| Search | By number, consignee, status |

**Shipment Fields (MVP):**
- Shipment number (auto-generated)
- Type (Import/Export)
- Status (Pending → In Transit → Arrived → Cleared → Delivered)
- Description
- Consignor (shipper)
- Consignee (receiver)
- Container number (optional)
- Vessel name (optional)
- Arrival/departure dates

### 3.4 Customs Processing (Priority: Must)

| Feature | Description |
|---------|-------------|
| Create declaration | Linked to shipment |
| Document upload | PDF, images (Vercel Blob) |
| Status workflow | Draft → Submitted → Approved/Rejected |
| Basic duty entry | Manual amount input |

**Customs Fields (MVP):**
- Declaration number (auto-generated)
- Status
- HS Code (optional)
- Duty amount
- Tax amount
- Currency (SDG, USD, SAR)
- Linked shipment

### 3.5 Invoicing (Priority: Must)

| Feature | Description |
|---------|-------------|
| Create invoice | Linked to shipment (optional) |
| Line items | Add/edit/remove services |
| Multi-currency | SDG, USD, SAR |
| PDF generation | Downloadable invoice |
| Status tracking | Draft → Sent → Paid |

**Invoice Fields (MVP):**
- Invoice number (auto-generated)
- Status
- Currency
- Line items (description, quantity, unit price)
- Subtotal, tax, total
- Due date

### 3.6 Internationalization (Priority: Must)

| Feature | Description |
|---------|-------------|
| Arabic UI | RTL layout, Tajawal font |
| English UI | LTR layout, Inter font |
| Language switcher | Header toggle |
| Locale routing | /ar/*, /en/* |

---

## 4. Out-of-Scope (Post-MVP)

### 4.1 Phase 2 Features

| Feature | Reason for Deferral |
|---------|---------------------|
| Warehouse management | Additional complexity |
| Transport tracking | Requires vehicle module |
| Client portal | Separate user type |
| SMS notifications | External service integration |
| Email notifications | External service integration |
| Advanced reporting | BI/Analytics scope |
| Duty calculator | Complex customs rules |
| Document OCR | AI processing scope |

### 4.2 Technical Debt Accepted

| Item | Mitigation |
|------|------------|
| No automated tests | Manual QA for MVP |
| Basic error handling | Improve post-launch |
| No audit logging | Add in Phase 2 |
| Simple PDF template | Enhance design later |

---

## 5. User Roles (MVP)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, user management |
| **Manager** | CRUD all features, approve declarations |
| **Clerk** | CRUD shipments/customs/invoices, no approvals |
| **Viewer** | Read-only access |

---

## 6. Technical Constraints

### 6.1 Infrastructure
- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Vercel
- **Storage**: Vercel Blob (documents)
- **Auth**: NextAuth v5 (credentials provider)

### 6.2 Performance Targets
- Page load: < 3 seconds
- API response: < 500ms
- Concurrent users: 50

### 6.3 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 7. MVP Screens

### 7.1 Authentication
- `/[lang]/login` - Login page
- `/[lang]/register` - Registration (admin-created only for MVP)

### 7.2 Platform
- `/[lang]/dashboard` - Main dashboard
- `/[lang]/shipments` - Shipment list
- `/[lang]/shipments/new` - Create shipment
- `/[lang]/shipments/[id]` - Shipment detail
- `/[lang]/shipments/[id]/edit` - Edit shipment
- `/[lang]/customs` - Customs declarations list
- `/[lang]/customs/new` - Create declaration
- `/[lang]/customs/[id]` - Declaration detail
- `/[lang]/invoices` - Invoice list
- `/[lang]/invoices/new` - Create invoice
- `/[lang]/invoices/[id]` - Invoice detail/PDF view
- `/[lang]/settings` - User settings

---

## 8. Data Volume Estimates

| Entity | Year 1 Estimate |
|--------|-----------------|
| Users | 20 |
| Shipments | 2,000 |
| Customs Declarations | 2,500 |
| Documents | 5,000 |
| Invoices | 1,500 |

---

## 9. MVP Definition of Done

- [ ] All "Must" priority features implemented
- [ ] Arabic and English fully translated
- [ ] RTL/LTR layouts working correctly
- [ ] PDF invoice generation functional
- [ ] Document upload working (Vercel Blob)
- [ ] Role-based access enforced
- [ ] Mobile responsive design
- [ ] Deployed to Vercel production
- [ ] User acceptance testing passed

---

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RTL styling issues | High | Use tested i18n patterns |
| PDF generation performance | Medium | Server-side generation |
| File upload limits | Medium | Implement size validation |
| Multi-currency rounding | High | Use Decimal type, proper formatting |

---

## 11. Post-MVP Roadmap

### Phase 2 (Months 2-3)
- Warehouse management
- Transport tracking
- Email notifications

### Phase 3 (Months 4-6)
- Client self-service portal
- Advanced reporting
- SMS notifications

### Phase 4 (Months 7+)
- Government API integration
- Mobile native apps
- AI-powered duty calculation

---

*Document Version: 1.0*
*Last Updated: December 2025*
