# Functional Requirements Document
## Call Center Operations – Centralized Post-Delivery Follow-Up

**Document Version:** 1.0  
**Date:** February 11, 2026  
**Status:** Draft for Development  
**System:** M&M Parcel Delivery System  

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional requirements for enhancing the Call Center module to support centralized, nationwide post-delivery follow-up. The goal is to replace manual data sharing via WhatsApp with an integrated, structured workflow for contacting recipients and recording delivery feedback.

### 1.2 Scope

- **In scope:** Call Center role configuration, post-delivery parcel visibility, click-to-call, remark recording, Admin Dashboard follow-up tracking.
- **Out of scope:** Pre-delivery home delivery requests (existing behavior), WhatsApp integration, automated dialing.

### 1.3 References

- Current Call Center Operations (Bantama, Kumasi) – operational description
- M&M Parcel Delivery System – existing application

---

## 2. Current State Summary

| Item | Description |
|------|-------------|
| Call center functions | Embedded within individual stations |
| Responsibility for calling | Station manager or front desk officer |
| Pre-delivery flow | Recipients requesting home delivery appear in Call Center section |
| Post-call behavior | Record disappears from Call Center once contacted |
| Limitation | No post-delivery follow-up; no centralized visibility after deliveries |
| Data sharing | Managers send delivery snapshots manually via WhatsApp |

---

## 3. Functional Requirements

### 3.1 User Role & Access

#### FR-UC-001: Call Center Role – No Station Assignment

| ID | FR-UC-001 |
|----|-----------|
| **Title** | Call Center users not tied to any station |
| **Description** | Users assigned the role “Call Center” (CALLER) must be configurable without a station/office assignment. |
| **Acceptance Criteria** | <ul><li>User management allows creating/editing users with role CALLER and officeId = null</li><li>Login and authorization work for CALLER users with no station</li><li>CALLER users without station can access nationwide data</li></ul> |
| **Priority** | Must Have |

#### FR-UC-002: Call Center Role – Station Assignment (Optional)

| ID | FR-UC-002 |
|----|-----------|
| **Title** | Optional station assignment for Call Center |
| **Description** | A CALLER user may optionally be assigned to a specific station. When assigned, access may be restricted to that station’s data (for backward compatibility or regional call centers). |
| **Acceptance Criteria** | <ul><li>User with role CALLER can have officeId = null OR a valid officeId</li><li>When officeId is set, system restricts visibility to that station’s parcels (if product decision is to support both modes)</li></ul> |
| **Priority** | Should Have |

#### FR-UC-003: Admin Access to Follow-Up Data

| ID | FR-UC-003 |
|----|-----------|
| **Title** | Admin access to follow-up tracking |
| **Description** | Users with role ADMIN must be able to view follow-up status and statistics for all parcels across all stations. |
| **Acceptance Criteria** | <ul><li>Admin Dashboard shows follow-up statistics</li><li>Admin can filter and view follow-up records by station, date, status</li></ul> |
| **Priority** | Must Have |

---

### 3.2 Delivered Parcels Visibility

#### FR-DP-001: Nationwide Delivered Parcels List

| ID | FR-DP-001 |
|----|-----------|
| **Title** | Call Center sees all delivered parcels nationwide |
| **Description** | CALLER users (without station or with nationwide access) must see a list of all delivered parcels across all stations. |
| **Acceptance Criteria** | <ul><li>API returns delivered parcels from all stations for authorized Call Center users</li><li>Response includes: parcelId, recipientName, recipientPhone, receiverAddress, delivery date, station/office name</li><li>Pagination supported (page, size)</li></ul> |
| **Priority** | Must Have |

#### FR-DP-002: Delivered Parcels Filtering

| ID | FR-DP-002 |
|----|-----------|
| **Title** | Filter delivered parcels |
| **Description** | Call Center users must be able to filter the delivered parcels list. |
| **Filters** | <ul><li>Delivery date range (from, to)</li><li>Station/Office (optional)</li><li>Follow-up status: Pending, Followed Up, All</li></ul> |
| **Acceptance Criteria** | <ul><li>All filters work in combination</li><li>Default view shows parcels not yet followed up (or configurable default)</li></ul> |
| **Priority** | Must Have |

#### FR-DP-003: Follow-Up Status Indicator

| ID | FR-DP-003 |
|----|-----------|
| **Title** | Show follow-up status per parcel |
| **Description** | Each delivered parcel must display whether it has been followed up and, if so, the latest remark type and date. |
| **Acceptance Criteria** | <ul><li>List shows: Pending, Followed Up (with date and remark type)</li><li>Status is accurate based on stored follow-up records</li></ul> |
| **Priority** | Must Have |

---

### 3.3 Click-to-Call

#### FR-CC-001: Call Button

| ID | FR-CC-001 |
|----|-----------|
| **Title** | Click-to-call from system |
| **Description** | Call Center staff must be able to initiate a call to the recipient directly from the system. |
| **Acceptance Criteria** | <ul><li>Each parcel row has a call button or link</li><li>Clicking opens the device dialer with recipient phone number (tel: link or equivalent)</li><li>Works on web (where supported) and mobile</li></ul> |
| **Priority** | Must Have |

---

### 3.4 Remark Recording

#### FR-RR-001: Predefined Remark Options

| ID | FR-RR-001 |
|----|-----------|
| **Title** | Predefined remark options |
| **Description** | After each follow-up call, Call Center staff must record remarks using predefined options. |
| **Options** | <ul><li>No comment</li><li>Not reachable</li><li>Unanswered</li><li>High cost</li><li>Rider was rude</li><li>Did not receive any package</li><li>Wrong contact</li><li>Other</li></ul> |
| **Acceptance Criteria** | <ul><li>All options are selectable in the UI</li><li>One option must be selected to submit</li><li>Options are stored with a stable enum/code for reporting</li></ul> |
| **Priority** | Must Have |

#### FR-RR-002: Other – Free-Text Input

| ID | FR-RR-002 |
|----|-----------|
| **Title** | Free-text input for “Other” |
| **Description** | When “Other” is selected, the user must be able to enter free-text. |
| **Acceptance Criteria** | <ul><li>“Other” reveals a text field (e.g. textarea)</li><li>Free-text is required when “Other” is selected</li><li>Max length defined (e.g. 500 characters)</li></ul> |
| **Priority** | Must Have |

#### FR-RR-003: Record Follow-Up Action

| ID | FR-RR-003 |
|----|-----------|
| **Title** | Record follow-up |
| **Description** | Call Center staff must be able to submit a follow-up record for a delivered parcel. |
| **Acceptance Criteria** | <ul><li>UI provides “Record follow-up” or similar action per parcel</li><li>Modal or form collects: remark type (required), “Other” text (if applicable)</li><li>Submission creates a follow-up record with: parcelId, remarkType, remarkOther (optional), followedUpBy (current user), followedUpAt (server timestamp)</li><li>List refreshes after successful submission</li></ul> |
| **Priority** | Must Have |

#### FR-RR-004: Multiple Follow-Ups (Optional)

| ID | FR-RR-004 |
|----|-----------|
| **Title** | Support multiple follow-up attempts |
| **Description** | System may allow multiple follow-up records per parcel (e.g. retries). |
| **Acceptance Criteria** | <ul><li>Each submission creates a new follow-up record (does not overwrite)</li><li>List shows latest follow-up status</li><li>History view (optional) shows all follow-ups for a parcel</li></ul> |
| **Priority** | Should Have |

---

### 3.5 Admin Dashboard

#### FR-AD-001: Follow-Up Statistics

| ID | FR-AD-001 |
|----|-----------|
| **Title** | Admin sees follow-up statistics |
| **Description** | Administrators must see aggregated follow-up statistics on the Admin Dashboard. |
| **Metrics** | <ul><li>Total delivered parcels (in selected period)</li><li>Count followed up</li><li>Count pending follow-up</li><li>Optionally: breakdown by station</li></ul> |
| **Acceptance Criteria** | <ul><li>Statistics are displayed clearly (e.g. cards or summary section)</li><li>Date range filter for statistics (e.g. last 7 days, 30 days, custom)</li><li>Data is accurate and reflects stored follow-up records</li></ul> |
| **Priority** | Must Have |

#### FR-AD-002: Follow-Up Tracking Table

| ID | FR-AD-002 |
|----|-----------|
| **Title** | Admin tracks follow-up status per parcel |
| **Description** | Administrators must be able to view and filter parcels by follow-up status for accountability and quality control. |
| **Acceptance Criteria** | <ul><li>Table/list shows: parcelId, recipient, station, delivery date, follow-up status, remark type, followed up by, followed up at</li><li>Filters: station, date range, follow-up status, remark type</li><li>Pagination for large result sets</li></ul> |
| **Priority** | Must Have |

#### FR-AD-003: Export Follow-Up Data (Optional)

| ID | FR-AD-003 |
|----|-----------|
| **Title** | Export follow-up data |
| **Description** | Administrators may export follow-up data (e.g. CSV) for reporting. |
| **Acceptance Criteria** | <ul><li>Export button triggers download of filtered data</li><li>CSV includes relevant columns (parcel, recipient, station, delivery date, follow-up status, remark, user, timestamp)</li></ul> |
| **Priority** | Could Have |

---

### 3.6 Data Model

#### FR-DM-001: Follow-Up Record Entity

| ID | FR-DM-001 |
|----|-----------|
| **Title** | Follow-up record data model |
| **Description** | System must persist follow-up records. |
| **Fields** | <ul><li>id (primary key)</li><li>parcelId (foreign key)</li><li>followedUpAt (timestamp)</li><li>followedUpBy (user id)</li><li>remarkType (enum)</li><li>remarkOther (text, nullable)</li><li>officeId / stationId (denormalized, optional)</li></ul> |
| **Acceptance Criteria** | <ul><li>Record is created on each follow-up submission</li><li>Record is immutable (no edit/delete, or controlled by admin only)</li></ul> |
| **Priority** | Must Have |

#### FR-DM-002: Remark Type Enum

| ID | FR-DM-002 |
|----|-----------|
| **Title** | Remark type enumeration |
| **Description** | Remark types must be stored as a stable enum. |
| **Values** | NO_COMMENT, NOT_REACHABLE, UNANSWERED, HIGH_COST, RIDER_RUDE, DID_NOT_RECEIVE, WRONG_CONTACT, OTHER |
| **Acceptance Criteria** | <ul><li>API and DB use consistent enum values</li><li>Adding new options in future does not break existing data</li></ul> |
| **Priority** | Must Have |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Delivered parcels list must load within 3 seconds for typical filters.
- Pagination must handle at least 10,000 delivered parcels without degradation.

### 4.2 Security

- Call Center and Admin endpoints must enforce role-based access.
- Only authorized users can view nationwide parcel data and follow-up records.

### 4.3 Usability

- Remark selection must be achievable in 2–3 clicks.
- Follow-up modal must be clearly visible and easy to dismiss or submit.

---

## 5. API Specification Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api-caller/parcels/delivered` | Paginated delivered parcels (all stations, filters) |
| POST | `/api-caller/parcels/:parcelId/follow-up` | Create follow-up record |
| GET | `/api-caller/parcels/:parcelId/follow-ups` | Follow-up history for a parcel (optional) |
| GET | `/api-admin/follow-up-stats` | Aggregated follow-up statistics |
| GET | `/api-admin/follow-up-records` | Paginated follow-up records for admin tracking |

---

## 6. UI/UX Specifications Summary

### 6.1 Call Center Page (Redesign)

- **Header:** Title, date range filter, station filter, follow-up status filter.
- **Table:** Recipient, Phone, Destination, Delivery Date, Station, Follow-up Status, Actions (Call, Record follow-up).
- **Record Follow-up Modal:** Radio/select for remark type, conditional textarea for “Other”, Submit and Cancel.

### 6.2 Admin Dashboard – New Section

- **Follow-up overview:** Summary cards (total delivered, followed up, pending).
- **Follow-up tracking:** Table with filters and optional export.

---

## 7. Out of Scope

- Integration with telephony or softphone.
- Automated dialing.
- WhatsApp integration.
- Changing pre-delivery home delivery request workflow (unless explicitly requested).
- Mobile native app (web responsive only).

---

## 8. Assumptions

1. Backend supports role-based access and multi-tenant/station data.
2. Parcel entity includes `delivered` (or equivalent) and delivery timestamp.
3. User entity supports `officeId = null` for CALLER.
4. Existing Call Center page can be replaced or extended without breaking other flows.

---

## 9. Glossary

| Term | Definition |
|------|------------|
| Call Center | Centralized team contacting recipients for post-delivery feedback |
| Follow-up | Contacting a recipient after delivery and recording feedback |
| Remark | Structured feedback option selected (or free-text for “Other”) |
| Delivered parcel | Parcel with status indicating successful delivery |

---

## 10. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | — | Initial draft |

---

*End of Document*
