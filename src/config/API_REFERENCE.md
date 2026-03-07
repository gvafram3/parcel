# Shortly API reference (from Swagger)

Base URL: `http://backend.mandmservicescorp.org/shortly`  
Security: **Bearer Authentication** (JWT) on all endpoints below.

---

## Front Desk Management

### Addresses

| Method | Path | Summary |
|--------|------|---------|
| **GET** | `/api-frontdesk/addresses` | Get addresses stored (by office). Query: `name` (optional, string). Returns `Address[]`. |
| **POST** | `/api-frontdesk/addresses` | Save office address. Body: `AddAddressRequest`. Returns `Address`. |

**AddAddressRequest**
- `name` (string)
- `cost` (number, double)

**Address**
- `id` (string)
- `name` (string)
- `officeId` (string)
- `cost` (number, double)

---

### Parcels

| Method | Path | Summary |
|--------|------|---------|
| **POST** | `/api-frontdesk/parcel` | Add a new parcel. Body: `ParcelRequest`. Returns `Parcel`. |
| **PUT** | `/api-frontdesk/parcel/{id}` | Update a parcel. Body: `ParcelUpdateRequest`. Returns `Parcel`. |
| **GET** | `/api-frontdesk/parcels` | Search parcels. Query: `isPOD`, `isDelivered`, `isParcelAssigned`, `driverId`, `hasCalled`, **pageable** (required). Returns `PageParcel`. |

**ParcelRequest** (main fields)
- `senderName`, `senderPhoneNumber`, `receiverName`, `receiverAddress`, `recieverPhoneNumber`
- `parcelDescription`, `driverName`, `driverPhoneNumber`, `vehicleNumber`
- `inboundCost`, `pickUpCost`, `deliveryCost`, `storageCost`
- `shelfNumber`, `shelfName`, `shelfId`, `officeId`
- `hasCalled`, `pickedUp`, `homeDelivery`, `paymentMethod`, `inboudPayed`
- `typeofParcel`: `"PARCEL"` \| `"ONLINE"` \| `"PICKUP"`
- `pod`, `delivered`, `parcelAssigned`, `fragile`, `itemCost`, `itemOwnerPaid`
- Optional pickup/delivery: `pickupAddress`, `pickupContactName`, `pickupContactPhoneNumber`, `pickupInstructions`, `deliveryAddress`, `deliveryContactName`, `deliveryContactPhoneNumber`, `specialInstructions`

---

### Reconciliation

| Method | Path | Summary |
|--------|------|---------|
| **POST** | `/api-frontdesk/reconcilation-parcels` | Reconcile rider payments. Body: `ReconcilationRiderRequest`. |
| **GET** | `/api-frontdesk/reconciliations/by-date` | Get reconciliations by date. Query: `date` (int64, required), `useReconciledAt` (boolean, default false), **pageable** (required). Requires MANAGER or ADMIN. |
| **GET** | `/api-frontdesk/reconciliation/stats` | Get reconciliation statistics. Query: `period` (default `"day"`). |

**ReconcilationRiderRequest**
- `assignmentId` (string)
- `reconciledAt` (integer, int64)
- `payedAmount` (number, double)

---

### Riders & assignments

| Method | Path | Summary |
|--------|------|---------|
| **GET** | `/api-frontdesk/riders/office` | Get list of available riders in office. Query: `availability` (boolean, default true). |
| **GET** | `/api-frontdesk/riders/assignments` | Get office rider assignments. Query: `payed` (boolean, default false), **pageable** (required). |
| **GET** | `/api-frontdesk/riders/assignments/returned` | Get returned delivery assignments. Query: **pageable** (required). |
| **GET** | `/api-frontdesk/rider/{riderId}/assignments` | Get rider assignments. Query: `payed` (default true). |
| **POST** | `/api-frontdesk/assign-parcels` | Assign parcels to rider. Body: `DeliveryAssignmentRequest` (`riderId`, `parcelIds[]`). |
| **DELETE** | `/api-frontdesk/assignment/{assignmentId}/parcel/{parcelId}` | Remove parcel from assignment. |

---

### Other Front Desk

| Method | Path | Summary |
|--------|------|---------|
| **GET** | `/api-frontdesk/parcels/home-delivery` | Get office pickup parcels (not home delivery, not delivered). Pageable. |
| **GET** | `/api-frontdesk/parcels-uncalled` | Get uncalled parcels. Pageable. |
| **GET** | `/api-frontdesk/parcel-assignment` | Get delivery assignments by status. Query: `status` (default `"DELIVERED"`, enum: ASSIGNED, ACCEPTED, PICKED_UP, DELIVERED, RETURNED, COMPLETED, CANCELLED), **pageable**. |
| **GET** | `/api-frontdesk/online-parcels/unpaid` | Get unpaid online parcels. Pageable. |
| **GET** | `/api-frontdesk/driver/{driverId}/parcels` | Get driver parcels. Query: `isPOD` (default true), `inboundPayed` (string, default `"false"`). |

---

## User Management (auth)

| Method | Path | Summary |
|--------|------|---------|
| **POST** | `/api-user/login` | User login. Body: `UserLoginRequestDto` (`phoneNumber` pattern `^\+233[2-9][0-9]{8}$`, `password`). Returns `UserLoginResponse` (userId, token, phoneNumber, name, role, office). |
| **POST** | `/api-user/request-password-reset` | Request password reset. Body: `ForgetPasswordRequest` (phoneNumber). |
| **POST** | `/api-user/reset-password` | Reset password. Body: `ResetPasswordRequest` (newPassword, verificationCode, verificationId). |

---

## Admin Management

| Method | Path | Summary |
|--------|------|---------|
| **GET** | `/api-admin/reconciliations/by-date` | Get reconciliations by date. Query: `date` (int64), **officeId** (required), `useReconciledAt`, **pageable**. |
| **GET** | `/api-admin/parcels` | Search parcels (admin). Same as frontdesk/parcels plus `officeId` query. |
| **POST** | `/api-admin/shelf` | Add office shelf. Body: `ShelfRequest` (name, officeId). |
| **GET** | `/api-admin/users` | Get all users. Pageable. |
| Offices, locations, register, user status, delete user, etc. | | See full Swagger. |

---

## Office Management (public-ish)

| Method | Path | Summary |
|--------|------|---------|
| **GET** | `/api/offices/locations` | Get all locations with offices. Query: `locationName`, `officeName` (optional). |

---

## Rider controller

| Method | Path | Summary |
|--------|------|---------|
| **PUT** | `/api-rider/rider-status` | Update rider status. Body: `RiderStatusUpdateRequest` (riderStatus: READY, OFFLINE, BUSY, ON_TRIP). |
| **PUT** | `/api-rider/assignments/{assignmentId}/status` | Update delivery status. Body: `DeliveryStatusUpdateRequest` (status, returnReason, confirmationCode, payementMethod, parcelId). |
| **GET** | `/api-rider/assignments` | Get rider assignments. Query: `onlyUndelivered` (boolean, default false). |
| **GET** | `/api-rider/search` | Search by receiver phone. Query: `receiverPhone` (required). |

---

## Schemas (selected)

- **Pageable**: `page` (int32, min 0), `size` (int32, min 1), `sort` (array of strings).
- **ParcelInfo** (inside assignments): parcelId, receiverName, receiverPhoneNumber, receiverAddress, parcelAmount, payed, returned, delivered, inboundCost, deliveryCost, storageCost, pickUpCost, homeDelivery, vehicleNumber, driverName, driverPhoneNumber, driverId, officeId, shelfName, shelfId, typeofParcel, pod, fragile, itemCost, etc.
- **DeliveryAssignments**: assignmentId, riderInfo, parcels (ParcelInfo[]), officeId, status, assignedAt, acceptedAt, completedAt, payementMethod, payed, confirmationCode, amount, inboundCost, deliveryCost, returnReason, amountPayed, payedAt, payedTo, createdAt, updatedAt.

---

Live Swagger UI: [https://backend.mandmservicescorp.org/shortly/swagger-ui/index.html](https://backend.mandmservicescorp.org/shortly/swagger-ui/index.html)
