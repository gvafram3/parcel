# Authentication & Role-Based Access Guide

## 🚀 Quick Start

1. **Landing Page**: Now redirects to `/login` (not dashboard)
2. **Login**: Use email from mock users (any password works for testing)
3. **Auto-Redirect**: After login, you're redirected to your role's default screen
4. **Logout**: Click "Logout" in the sidebar

---

## 👥 Test Users

### Administrator
- **Email**: `admin@parcel.com`
- **Password**: Any (for testing)
- **Default Screen**: `/admin/dashboard`
- **Access**: All screens, all stations' data

### Station Manager (STATION-001 - Accra Central)
- **Email**: `kwame@parcel.com`
- **Password**: Any
- **Default Screen**: `/parcel-intake`
- **Access**: Station management screens, STATION-001 data only

### Station Manager (STATION-002 - Kumasi Hub)
- **Email**: `ama@parcel.com`
- **Password**: Any
- **Default Screen**: `/parcel-intake`
- **Access**: Station management screens, STATION-002 data only

### Front Desk Staff (STATION-001)
- **Email**: `adams@parcel.com` or `john@parcel.com`
- **Password**: Any
- **Default Screen**: `/parcel-intake`
- **Access**: Core operations, STATION-001 data only

### Front Desk Staff (STATION-002)
- **Email**: `mary@parcel.com`
- **Password**: Any
- **Default Screen**: `/parcel-intake`
- **Access**: Core operations, STATION-002 data only

### Call Center Staff (STATION-001)
- **Email**: `grace@parcel.com`
- **Password**: Any
- **Default Screen**: `/call-center`
- **Access**: Parcel Search, Call Center, Reconciliation, STATION-001 data only

### Call Center Staff (STATION-002)
- **Email**: `kofi@parcel.com`
- **Password**: Any
- **Default Screen**: `/call-center`
- **Access**: Parcel Search, Call Center, Reconciliation, STATION-002 data only

### Rider/Driver (STATION-001)
- **Email**: `john.mensah@parcel.com` or `kwame.rider@parcel.com`
- **Password**: Any
- **Default Screen**: `/active-deliveries`
- **Access**: Only their assigned deliveries

### Rider/Driver (STATION-002)
- **Email**: `ama.rider@parcel.com`
- **Password**: Any
- **Default Screen**: `/active-deliveries`
- **Access**: Only their assigned deliveries

---

## 📋 Role-Based Sidebar Items

### Administrator
- ✅ Parcel Intake
- ✅ Parcel Search
- ✅ Package Assignments
- ✅ Call Center
- ✅ Active Deliveries
- ✅ Reconciliation
- ✅ Financial Dashboard
- ✅ Shelf Management
- ✅ **Admin Dashboard**
- ✅ **Station Management**
- ✅ **User Management**
- ✅ **System Parcels**
- ✅ **Financial Reports**
- ✅ **Driver Payments**

### Station Manager
- ✅ Parcel Intake
- ✅ Parcel Search
- ✅ Package Assignments
- ✅ Call Center
- ✅ Active Deliveries
- ✅ Reconciliation
- ✅ Financial Dashboard
- ✅ Shelf Management

### Front Desk Staff
- ✅ Parcel Intake
- ✅ Parcel Search
- ✅ Package Assignments
- ✅ Call Center
- ✅ Active Deliveries
- ✅ Reconciliation
- ✅ Financial Dashboard
- ✅ Shelf Management

### Call Center Staff
- ✅ Parcel Search
- ✅ Call Center
- ✅ Reconciliation

### Rider/Driver
- ✅ Active Deliveries (only their assigned parcels)

---

## 🔒 Route Protection

All routes are now protected:
- Unauthenticated users → Redirected to `/login`
- Authenticated users accessing wrong role routes → Redirected to their default screen
- Login page → Redirects authenticated users to their dashboard

---

## 🧪 Testing Checklist

### Test Each Role:

1. **Admin** (`admin@parcel.com`)
   - [ ] Login redirects to Admin Dashboard
   - [ ] Can see all admin screens in sidebar
   - [ ] Can access all stations' data
   - [ ] Logout works

2. **Station Manager** (`kwame@parcel.com`)
   - [ ] Login redirects to Parcel Intake
   - [ ] Can see station management screens
   - [ ] Can only see STATION-001 data
   - [ ] Cannot access admin screens

3. **Front Desk** (`adams@parcel.com`)
   - [ ] Login redirects to Parcel Intake
   - [ ] Can see core operation screens
   - [ ] Can only see STATION-001 data
   - [ ] Cannot access admin screens

4. **Call Center** (`grace@parcel.com`)
   - [ ] Login redirects to Call Center
   - [ ] Can only see: Parcel Search, Call Center, Reconciliation
   - [ ] Can only see STATION-001 data

5. **Rider** (`john.mensah@parcel.com`)
   - [ ] Login redirects to Active Deliveries
   - [ ] Can only see Active Deliveries
   - [ ] Can only see their own assigned parcels

---

## 🔄 Authentication Flow

```
User visits / → Redirected to /login
User enters email → System finds user in mockUsers
System sets user & station in StationContext
Redirect based on role:
  - admin → /admin/dashboard
  - rider → /active-deliveries
  - call-center → /call-center
  - others → /parcel-intake
```

---

## 📝 Notes

- **Password**: For testing, any password is accepted. In production, this will verify against the backend.
- **Session**: Authentication state is stored in React Context (StationContext)
- **Logout**: Clears user and station from context, redirects to login
- **Data Filtering**: All screens automatically filter by user's station (except admin)

