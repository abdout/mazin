# Project Brief: Mazin

## Project Overview

**Project Name:** Mazin
**Client:** Port Sudan Customs & Logistics Company
**Location:** Port Sudan, Sudan
**Start Date:** December 2025
**Project Type:** Custom Export/Import Management System

## Vision Statement

Digitize and streamline import/export operations for Port Sudan, creating a modern, Arabic-first logistics management platform that reduces customs processing time and provides real-time visibility across the supply chain.

## Business Context

Port Sudan is Sudan's main seaport and a critical gateway for international trade. The current manual processes for customs clearance, shipment tracking, and invoicing create delays and inefficiencies. Mazin will modernize these operations with a comprehensive digital platform.

## Key Stakeholders

| Role | Responsibility |
|------|----------------|
| **Operations Manager** | Overall logistics oversight, reporting |
| **Customs Officers** | Declaration processing, document verification |
| **Warehouse Staff** | Inventory management, goods receipt/dispatch |
| **Finance/Accountants** | Invoicing, payment tracking, reporting |
| **Company Admin** | User management, system configuration |

## Success Criteria

1. **Reduce customs processing time by 50%** - From submission to clearance
2. **Real-time shipment visibility** - Track status at every stage
3. **Automated invoice generation** - Linked to shipments and duties
4. **Arabic-first with English support** - Full RTL/LTR localization
5. **Mobile-responsive design** - Access from any device

## Project Scope

### In Scope (MVP)
- User authentication with role-based access
- Shipment management (import/export)
- Customs declaration workflow
- Document management
- Invoice generation (multi-currency)
- Dashboard with KPIs

### Out of Scope (Phase 2+)
- Client self-service portal
- Mobile native apps
- Integration with government systems
- Advanced analytics/BI
- SMS/Email notifications

## Technical Constraints

- **Stack:** Next.js 16, React 19, Prisma 6, Neon PostgreSQL
- **Hosting:** Vercel (serverless)
- **Languages:** Arabic (primary), English (secondary)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)

## Timeline Overview

| Phase | Duration | Focus |
|-------|----------|-------|
| Sprint 0 | Day 1 | BMAD Planning |
| Sprint 1-2 | Days 2-5 | Foundation & Auth |
| Sprint 3 | Days 6-7 | Core Layout |
| Sprint 4-6 | Days 8-16 | Features |
| Sprint 7 | Days 17-18 | Polish & Deploy |

## Key Risks

| Risk | Mitigation |
|------|------------|
| RTL layout complexity | Use tested i18n patterns from codebase |
| Multi-currency accuracy | Implement proper decimal handling |
| Document storage costs | Use efficient file storage (Vercel Blob) |
| User adoption | Arabic-first, intuitive UX |

## Approval

- [ ] Product Owner Approval
- [ ] Technical Lead Approval
- [ ] Stakeholder Sign-off

---

*Document Version: 1.0*
*Last Updated: December 2025*
