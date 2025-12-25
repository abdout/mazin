# Epic 6: Settings

## Overview

**Epic ID**: E6
**Priority**: Should
**Sprint**: 7
**Total Points**: 5

---

## Goal

Provide user and system settings management for profile updates and admin configuration.

---

## Stories

### Story 6.1: User Profile Settings

**ID**: E6-S1
**Points**: 3
**Priority**: Should

**As a** user
**I want to** update my profile
**So that** my information is current

**Acceptance Criteria**:
- [ ] View current profile info
- [ ] Update name
- [ ] Update email (with verification - Phase 2)
- [ ] Change password
- [ ] Language preference
- [ ] Success notification on save

**Fields**:
| Field | Editable |
|-------|----------|
| Name | Yes |
| Email | Yes |
| Password | Yes |
| Role | No (display only) |
| Language | Yes |

---

### Story 6.2: User Management (Admin)

**ID**: E6-S2
**Points**: 2
**Priority**: Should

**As an** admin
**I want to** manage users
**So that** I can control system access

**Acceptance Criteria**:
- [ ] List all users
- [ ] Add new user
- [ ] Edit user role
- [ ] Deactivate user
- [ ] Reset user password (admin-initiated)
- [ ] Admin role only access

**User Table Columns**:
| Column | Actions |
|--------|---------|
| Name | - |
| Email | - |
| Role | Edit |
| Status | Toggle |
| Created | - |

---

## Dependencies

- Authentication complete (E1)

---

## Out of Scope (Phase 2)

- Company settings (logo, info)
- Invoice templates customization
- Notification preferences
- API keys management
- Audit log viewing

---

## Technical Notes

- Settings page at `/[lang]/settings`
- Admin user management at `/[lang]/settings/users`
- Server actions for updates

---

*Epic Version: 1.0*
