# Database Schema & Data Dictionary

This document provides a plain-language explanation of every table in the Grain & Powder Trading ERP, how relationships work, and the exact mathematics behind unit conversions and the append-only stock ledger.

---

## 1. Core Principles Explained Simply

### What is a Relational Database?
Think of each table as an Excel sheet, but with strict rules:
- Every row has a unique identifier called a **Primary Key (`id`)** (a unique UUID string).
- Tables link to each other using **Foreign Keys** (e.g. `supplier_id` in purchases points to a row in `suppliers`).

### Why Base Unit (Grams)?
If you buy 1 quintal of wheat and sell 500 grams, standard computer math doesn't know how to subtract grams from quintals. By storing all stock balances in **Grams**, subtraction and addition are always consistent:
$$\text{Stock in Grams} = \text{Quantity Entered} \times \text{conversion\_factor}$$

---

## 2. Table Catalog

### `branches`
Represents physical shops, stores, or warehouses.
- `id` (UUID): Unique ID. Pre-seeded with `00000000-0000-0000-0000-000000000001`.
- `name` (TEXT): Name of the branch (e.g. "Main Branch").
- `code` (TEXT): Unique short code (e.g. "MAIN").
- `address` (TEXT): Address (e.g. "Addis Ababa, Ethiopia").
- `is_active` (BOOLEAN): Whether this location is operational.

---

### `profiles`
Extends Supabase's built-in `auth.users` table with business roles and names.
- `id` (UUID): Matches the user ID in Supabase Auth.
- `full_name` (TEXT): Name of the worker or manager.
- `role` (`app_role` ENUM): Either `'owner_manager'` or `'staff'`.
- `branch_id` (UUID): The branch where this user works.

---

### `units`
Defines all units of measurement and how they convert to grams.
- `id` (UUID): Unique ID.
- `name` (TEXT): Display name (e.g. "Kilogram", "Quintal (Kuntal)").
- `symbol` (TEXT): Short symbol (e.g. "kg", "q", "g", "pkt-250g").
- `conversion_factor` (NUMERIC): How many grams make up 1 unit.
  - `Gram`: `1.0`
  - `Kilogram`: `1000.0`
  - `Quintal`: `100000.0`
  - `Milligram`: `0.001`
  - `250g Packet`: `250.0`
- `is_base_unit` (BOOLEAN): `true` only for Gram.

---

### `suppliers`
Farmers, cooperatives, and wholesalers who supply grains and spices.
- `id` (UUID): Unique ID.
- `name` (TEXT): Business name or farmer name.
- `contact_person` (TEXT): Primary contact person.
- `phone` (TEXT): Phone number (e.g. `+251 9...`).
- `address` (TEXT): Location / region.
- `notes` (TEXT): Payment terms or specialty notes.
- `is_active` (BOOLEAN): Soft-delete flag.

---

### `products`
The master catalog of items for sale.
- `id` (UUID): Unique ID.
- `name` (TEXT): e.g. "Berbere Special", "Sinde (Wheat)", "Ater (Split Peas)".
- `code` (TEXT): Barcode or SKU (e.g. "BER-001").
- `category` (TEXT): e.g. "Grains", "Powders & Spices", "Pulses".
- `default_unit_id` (UUID): Reference to `units` (the unit usually displayed on shelves).
- `reorder_threshold_base_units` (NUMERIC): Low-stock warning point in **grams** (e.g., 10,000 g = 10 kg).
- `cost_price_per_base_unit` (NUMERIC): Cost per gram in ETB (for inventory valuation).
- `selling_price_per_base_unit` (NUMERIC): Reference selling price per gram in ETB.
- `is_active` (BOOLEAN): Flag for active products.

---

### `stock_movements` (The Single Source of Truth Ledger)
The append-only log of every single physical movement of stock.
- `id` (UUID): Unique ID.
- `branch_id` (UUID): Branch location.
- `product_id` (UUID): Product moved.
- `movement_type` (TEXT): `'purchase'`, `'sale'`, `'adjustment_in'`, `'adjustment_out'`.
- `quantity_base_units` (NUMERIC): **Grams**. Positive for incoming, negative for outgoing.
- `original_quantity` (NUMERIC): What the user typed (e.g. `2.5`).
- `unit_id` (UUID): What unit the user selected (e.g. `Quintal`).
- `reference_id` (UUID): Points to `purchases.id`, `sales.id`, or `stock_adjustments.id`.
- `reference_type` (TEXT): `'purchase'`, `'sale'`, `'manual_adjustment'`.
- `manual_override` (BOOLEAN): `true` if a sale was forced despite low/zero stock.
- `override_reason` (TEXT): Reason why override was allowed.
- `notes` (TEXT): Audit explanation.
- `recorded_by` (UUID): Who performed the transaction.
- `created_at` (TIMESTAMPTZ): Exact timestamp.

> [!IMPORTANT]
> **Append-Only Guarantee**: There are **no** `UPDATE` or `DELETE` permissions on this table. To reverse an error, a new offsetting movement is created.

---

### `view_product_current_stock` (SQL View)
Computes real-time stock levels automatically:
```sql
SELECT 
    product_id,
    branch_id,
    SUM(quantity_base_units) AS current_stock_base_units,
    SUM(quantity_base_units) / default_unit_factor AS current_stock_default_unit,
    (SUM(quantity_base_units) <= reorder_threshold_base_units) AS is_low_stock,
    SUM(quantity_base_units) * cost_price_per_base_unit AS current_valuation_etb
FROM stock_movements ...
```

---

### `purchases` & `purchase_items`
Records incoming shipments from suppliers.
- `purchases`: Top-level record (Supplier, Date, Total ETB, Invoice reference).
- `purchase_items`: Individual items inside the shipment:
  - `quantity` in original unit (e.g. 5 quintals)
  - `quantity_base_units` in grams (500,000 g)
  - `unit_cost` (cost per quintal)
  - `total_cost` (quantity * unit_cost)
  - `cost_per_base_unit` (total_cost / quantity_base_units)

---

### `sales` & `sale_items`
Point of Sale (POS) invoices.
- `sales`: Invoice number, Customer name, Payment method (`cash`, `telebirr`, `cbe_birr`, `bank_transfer`, `credit`), Total ETB amount.
- `sale_items`: Each product sold in the invoice:
  - `quantity` in selected unit (e.g. 2 kg)
  - `quantity_base_units` in grams (2,000 g)
  - `unit_price` in ETB
  - `total_price` in ETB

---

### `stock_adjustments`
Manual adjustments for inventory counting audits, drying loss, or spillage.
- Requires an explicit `reason` (e.g., "500g spilled during bagging", "Moisture loss").
