# BoardEase — Boarding House Billing System

## Overview

|                   |                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| **App Name**      | BoardEase                                                                                              |
| **Problem**       | Boarding-house owners may have difficulty manually tracking tenant bills and payments.                 |
| **Solution**      | A practical web and mobile system that records tenants, calculates monthly bills, and tracks payments. |
| **Main Users**    | Boarding-house owner/admin                                                                             |
| **Core Features** | Tenant management, room management, billing, payments, and dashboard                                   |
| **Goal**          | Make monthly billing and payment tracking easier and more organized.                                   |

---

## Team Roles

| Role                      | Member                 |
| ------------------------- | ---------------------- |
| Project Manager           | Hurveen Rayford Veloso |
| Fullstack                 | Kendall Bryant Maputi  |
| Fullstack                 | Joachim Ray Chiong     |
| UI/UX Designer & Frontend | Elijah Bes             |

---

## Features

### Web App — Admin/Owner

- Admin Login
- Dashboard
- Room Management
- Tenant Management
- Assign Tenant to Room
- Create Monthly Bill
- Rent Management
- Electricity & Water Charges
- Automatic Total Bill Calculation
- Record Payment
- Paid / Unpaid / Partial Status
- Outstanding Balance
- Billing History

### Mobile App — Tenant

- Tenant Login
- Dashboard
- View Current Bill
- View Bill Breakdown
- View Payment Status
- View Outstanding Balance
- View Billing History

---

## Not Included (Out of Scope)

- Online payment integration
- GCash API
- Bank integration
- Chat system
- AI
- SMS integration
- Complicated notifications
- Multiple boarding-house branches
- Advanced accounting
- Maintenance management
- Inventory
- Booking/reservation system

---

## Confirmed Business Rules

### Database Security

- Never add an RLS policy on `profiles` that allows client-side `INSERT` or `UPDATE`.

### 1. Tenant Registration

- Tenants can register their own accounts through the mobile app.
- Registration includes:
  - First Name
  - Last Name
  - Email
  - Password
  - Contact Number
- After registration, the Admin can assign the tenant to a room.

### 2. Room Occupancy

- A room can have one or multiple tenants.
- Each room has a maximum occupancy limit.
- The Admin can set the maximum occupancy for each room.
- The system must prevent assigning tenants when the room has reached its maximum occupancy.

**Example:** Room 1 — Maximum Occupancy: 3

- Tenant A, Tenant B, and Tenant C can be assigned.
- A fourth tenant cannot be assigned.

### 3. Rent Management

- Each room has a default monthly rent.
- If a room has multiple tenants, the Admin can set a different rent amount for each tenant.
- The system does **not** automatically divide the rent equally.

**Example:**

| Tenant   | Rent   |
| -------- | ------ |
| Tenant A | ₱2,000 |
| Tenant B | ₱2,500 |
| Tenant C | ₱1,500 |

### 4. Electricity and Water Charges

- The Admin manually enters the monthly electricity charge.
- The Admin manually enters the monthly water charge.
- The system does **not** calculate charges using meter readings.

### 5. Bill Calculation

The system calculates:

```
Total Bill = Rent + Electricity + Water
```

**Example:**

| Item        | Amount     |
| ----------- | ---------- |
| Rent        | ₱5,000     |
| Electricity | ₱800       |
| Water       | ₱200       |
| **Total**   | **₱6,000** |

- The Admin can edit a bill if a correction is needed.

### 6. Payments

- Payments are made directly to the Admin/Owner outside the system.
- BoardEase does **not** process online payments.
- The Admin records payments in BoardEase.
- A bill can have multiple payments.
- Partial payments are supported.
- The Admin can edit or delete incorrectly recorded payments.

### 7. Payment Status

| Condition       | Status    |
| --------------- | --------- |
| No payment      | `UNPAID`  |
| Partial payment | `PARTIAL` |
| Fully paid      | `PAID`    |

## Technical Diagrams

### Business Process Flow Chart

![Business Process Flow Chart](/docs_images/flowchart.png)

### System Architecture

![System Architecture](/docs_images/new_sys_arch.png)

### Entity Relationship Diagram (ERD)

![Entity Relationship Diagram](/docs_images/image_erd.png)
