# System Architecture: Grain & Powder Trading ERP

Welcome to the Grain & Powder Trading ERP architecture document! If you are primarily a frontend developer, this guide explains how the system is designed, how data flows between your UI and the database, and why decisions were made.

---

## 1. High-Level Overview

This application is built for a business in Ethiopia trading whole grains (e.g. Sinde/Wheat, Gebs/Barley, Ater/Peas) and powdered spices/foods (e.g. Berbere, Shiro).

```
+-------------------------------------------------------------------+
|               Next.js App Router Frontend (Client/Server)         |
|  - Staff Dashboard (/staff)       - Manager Dashboard (/manager)  |
|  - POS Sales Screen               - Inventory & Reorder Alerts   |
|  - Stock-In / Purchases Form      - Pricing & Supplier Management |
+---------------------------------+---------------------------------+
                                  |
                                  | Supabase Client & SSR Auth
                                  v
+-------------------------------------------------------------------+
|               Supabase (PostgreSQL + Auth + RLS)                  |
|  - Auth & Roles: 'owner_manager' vs. 'staff'                      |
|  - Row Level Security (RLS) policies enforcing table permissions  |
|  - Base Unit Conversion Engine: Everything stored in Grams (g)    |
|  - Append-Only Stock Ledger: Single source of inventory truth     |
|  - Automated Negative Stock Blocker trigger                       |
+-------------------------------------------------------------------+
```

---

## 2. Roles & Permissions

The system has two roles:

1. **Owner / Manager (`owner_manager`)**:
   - Access to everything staff can do.
   - Can create, edit, or archive products and change prices.
   - Can manage suppliers and view purchase costs.
   - Can view financial reports (revenue, stock valuation, top-selling items).
   - Can manage staff accounts and branch settings.

2. **Staff (`staff`)**:
   - Record incoming shipments from suppliers (Purchases).
   - Record sales to customers (POS).
   - View real-time inventory levels and item search.
   - Cannot change master product pricing, delete historical records, or view executive margin reports.

### How Role Security Works
Instead of only hiding buttons in the React UI, we use **Supabase Row Level Security (RLS)** in PostgreSQL. Even if someone inspects the network tab or tries to make a direct API call:
- If a staff member sends an update to a product's price, PostgreSQL rejects the query.
- If a staff member tries to delete a sale or purchase, PostgreSQL blocks it.
- In `src/middleware.ts`, Next.js checks the user's role on route navigation and redirects unauthorized users away from `/manager/*`.

---

## 3. The Base Unit Conversion Philosophy

In Ethiopian grain trading, products are bought and sold in very different units:
- Bulk grain is bought in **Quintals (Kuntal)**: 1 quintal = 100 kg = 100,000 grams.
- Retail sales often happen in **Kilograms (kg)**: 1 kg = 1,000 grams.
- High-value spices like Berbere or Korarima are sold in **Grams (g)** or packaged pouches like **250g Packets**.

### The Problem
If a database stores 5 quintals of wheat, and you sell 25 kg, you cannot simply do `5 - 25`. You'd get `-20`, which is mathematically wrong and causes inventory chaos.

### The Solution: A Single Base Unit (Grams)
All quantities in the database are converted into **Grams (g)** at the exact moment of entry:
- **Conversion Factor**: Each unit has a `conversion_factor` that defines *how many grams are in 1 unit*.
  - `Gram (g)`: factor = `1.0` (The Base Unit)
  - `Kilogram (kg)`: factor = `1,000.0`
  - `Quintal (q)`: factor = `100,000.0`
  - `Milligram (mg)`: factor = `0.001`
  - `250g Packet`: factor = `250.0`
- **When saving a record**:
  $$\text{quantity in grams} = \text{entered quantity} \times \text{conversion factor}$$
- **When displaying to the user**:
  $$\text{display quantity} = \frac{\text{quantity in grams}}{\text{conversion factor}}$$

Because the math is normalized to grams, you can buy in quintals and sell in 250g packets with zero rounding errors.

---

## 4. The Append-Only Stock Ledger

Most traditional beginners' apps update inventory using `UPDATE products SET stock = stock - 5`. This is dangerous for business accounting because:
- If someone edits a row or a bug happens, you lose the history.
- You cannot explain *why* stock changed, who did it, or on what date.

### Our Approach: `stock_movements`
The ERP treats stock like a bank account ledger:
- Stock **never** gets directly overwritten.
- Every event is an immutable entry in `stock_movements`:
  - **Purchase (Stock In)**: `+100,000 g`
  - **Sale (Stock Out)**: `-2,500 g`
  - **Adjustment Out (e.g. drying loss or spillage)**: `-500 g`
  - **Adjustment In (e.g. physical recount found an extra bag)**: `+50,000 g`
- **Current on-hand stock** is calculated by summing all movements:
  $$\text{Current Stock} = \sum \text{quantity\_base\_units}$$
- **Zero Deletion / Zero Update Rule**: The database RLS explicitly forbids `UPDATE` or `DELETE` on `stock_movements`. If a mistake was made, a balancing adjustment entry must be recorded.

---

## 5. Negative Stock Protection

Requirement: *A sale should never push stock below zero without an explicit manual override and reason.*

In PostgreSQL, we implemented a trigger function `enforce_negative_stock_protection()`:
1. When a sale item is inserted, the database checks the projected balance:
   $$\text{Current Stock} - \text{Requested Quantity}$$
2. If the result is $< 0$:
   - If `manual_override = false`: The transaction **aborts with an error**.
   - If `manual_override = true` and `override_reason` is supplied: The transaction is logged with the reason (e.g., "Supplier delivered early before invoice entered").

---

## 6. Multi-Branch Readiness

Even though this MVP is deployed for a single store, all tables include:
`branch_id UUID REFERENCES branches(id) DEFAULT '00000000-0000-0000-0000-000000000001'`
Defaulting to the seeded **"Main Branch"** ensures that when the business opens a second branch in Merkato or outside Addis Ababa, you can add multi-branch filtering without restructuring your database.

---

## 7. Assumptions & Defaults
- **Tax / VAT**: As requested, no tax/VAT logic is applied. Prices and totals are pure transaction amounts in Ethiopian Birr (ETB).
- **Currency**: ETB (Ethiopian Birr), formatted to two decimal places (`ETB 1,500.00`).
- **Base Unit**: Grams (`g`).
