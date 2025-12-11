# Role-Based Access Control - Parcel Management System

## User Roles & Permissions

### 1. Administrator (admin)
**Access Level:** System-wide
**Can See:** All stations' data

**Screens Accessible:**
- ✅ Admin Dashboard
- ✅ Station Management
- ✅ User Management
- ✅ System Parcel Overview
- ✅ Financial Reports (all stations)
- ✅ Driver Payments Overview
- ✅ Parcel Intake
- ✅ Parcel Search
- ✅ Package Assignments
- ✅ Call Center
- ✅ Active Deliveries
- ✅ Reconciliation
- ✅ Financial Dashboard
- ✅ Shelf Management

**Mock User:**
- Email: `admin@parcel.com`
- Name: System Administrator
- Station: STATION-001 (but can access all)

---

### 2. Station Manager (station-manager)
**Access Level:** Station-specific
**Can See:** Only their assigned station's data

**Screens Accessible:**
- ✅ Parcel Intake
- ✅ Parcel Search
- ✅ Package Assignments
- ✅ Call Center
- ✅ Active Deliveries
- ✅ Reconciliation
- ✅ Financial Dashboard (station-level only)
- ✅ Shelf Management

**Mock Users:**
- Email: `kwame@parcel.com` (STATION-001)
- Email: `ama@parcel.com` (STATION-002)

---

### 3. Front Desk Staff (front-desk)
**Access Level:** Station-specific
**Can See:** Only their assigned station's data

**Screens Accessible:**
- ✅ Parcel Intake
- ✅ Parcel Search
- ✅ Package Assignments
- ✅ Call Center
- ✅ Active Deliveries
- ✅ Reconciliation
- ✅ Financial Dashboard
- ✅ Shelf Management

**Mock Users:**
- Email: `adams@parcel.com` (STATION-001)
- Email: `john@parcel.com` (STATION-001)
- Email: `mary@parcel.com` (STATION-002)

---

### 4. Call Center Staff (call-center)
**Access Level:** Station-specific
**Can See:** Only their assigned station's data

**Screens Accessible:**
- ✅ Parcel Search
- ✅ Call Center
- ✅ Reconciliation

**Mock Users:**
- Email: `grace@parcel.com` (STATION-001)
- Email: `kofi@parcel.com` (STATION-002)

---

### 5. Rider/Driver (rider)
**Access Level:** Personal assignments only
**Can See:** Only their own assigned deliveries

**Screens Accessible:**
- ✅ Active Deliveries (only their assigned parcels)

**Mock Users:**
- Email: `john.mensah@parcel.com` (STATION-001)
- Email: `kwame.rider@parcel.com` (STATION-001)
- Email: `ama.rider@parcel.com` (STATION-002)

---

## Authentication Flow

1. User lands on `/` → Redirects to `/login`
2. User enters email (and password in production)
3. System finds user in mockUsers by email
4. Sets user in StationContext
5. Sets station based on user's stationId
6. Redirects to appropriate dashboard:
   - Admin → `/admin/dashboard`
   - Station Manager → `/parcel-intake`
   - Front Desk → `/parcel-intake`
   - Call Center → `/call-center`
   - Rider → `/active-deliveries`

---

## Data Filtering Rules

- **Admin:** Sees all data from all stations
- **Station Manager, Front Desk, Call Center:** See only data from their `stationId`
- **Rider:** See only parcels where `assignedRiderId === currentUser.id`

---

## Route Protection

- All routes except `/login`, `/forgot-password`, `/password-request-sent` require authentication
- Unauthenticated users are redirected to `/login`
- Authenticated users trying to access `/login` are redirected to their dashboard

