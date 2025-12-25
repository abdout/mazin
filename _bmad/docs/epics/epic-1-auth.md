# Epic 1: Authentication & Authorization

## Overview

**Epic ID**: E1
**Priority**: Must
**Sprint**: 2
**Total Points**: 13

---

## Goal

Implement secure user authentication with role-based access control supporting Admin, Manager, Clerk, and Viewer roles.

---

## Stories

### Story 1.1: User Login

**ID**: E1-S1
**Points**: 3
**Priority**: Must

**As a** user
**I want to** log in with my email and password
**So that** I can access the platform

**Acceptance Criteria**:
- [ ] Login form with email and password fields
- [ ] Form validation (required, email format)
- [ ] Error messages for invalid credentials
- [ ] Redirect to dashboard on success
- [ ] Arabic and English labels
- [ ] Remember me option (optional)

**Technical Notes**:
- Use NextAuth v5 credentials provider
- Server action for authentication
- Zod schema for validation

---

### Story 1.2: Role-Based Access Control

**ID**: E1-S2
**Points**: 5
**Priority**: Must

**As an** admin
**I want to** assign roles to users
**So that** they have appropriate permissions

**Acceptance Criteria**:
- [ ] Four roles: Admin, Manager, Clerk, Viewer
- [ ] Role stored in user session
- [ ] Middleware checks role permissions
- [ ] Unauthorized pages show 403 error
- [ ] Navigation shows only accessible links

**Permission Matrix**:
| Feature | Admin | Manager | Clerk | Viewer |
|---------|-------|---------|-------|--------|
| Users | CRUD | R | - | - |
| Shipments | CRUD | CRUD | CRUD | R |
| Customs | CRUD | CRUD | CRU | R |
| Approve | Yes | Yes | No | No |
| Invoices | CRUD | CRUD | CRU | R |

---

### Story 1.3: Protected Routes

**ID**: E1-S3
**Points**: 3
**Priority**: Must

**As a** system
**I want to** protect platform routes
**So that** unauthenticated users cannot access them

**Acceptance Criteria**:
- [ ] /dashboard and /platform/* require authentication
- [ ] Unauthenticated users redirect to /login
- [ ] Login page redirects authenticated users to dashboard
- [ ] Locale preserved in redirects

**Technical Notes**:
- Implement in middleware.ts
- Combine with i18n routing

---

### Story 1.4: User Logout

**ID**: E1-S4
**Points**: 2
**Priority**: Must

**As a** user
**I want to** log out
**So that** my session is terminated

**Acceptance Criteria**:
- [ ] Logout button in header/sidebar
- [ ] Session cleared on logout
- [ ] Redirect to login page
- [ ] Confirmation not required (single click)

---

## Dependencies

- NextAuth v5 configured
- Prisma User model with role field
- Middleware setup

---

## Out of Scope

- OAuth providers (Google, GitHub)
- Password reset (Phase 2)
- Email verification (Phase 2)
- Two-factor authentication (Phase 2)

---

*Epic Version: 1.0*
