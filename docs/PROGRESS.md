# Project Progress & Decisions Log

This document tracks progress across development phases, recording what was built, key decisions made, and rationale.

---

## Performance & UX Optimization (Loading Screens, Instant Feedback & Fast Compiling)

### What Was Built
1. **High-Performance Compilation Optimizations (`next.config.mjs`)**:
   - Configured `optimizePackageImports: ["lucide-react", "recharts", "@tanstack/react-table"]`.
   - Prevents Webpack from bundling full icon libraries, drastically reducing cold-compilation times on route visits.
2. **Global Navigation Progress Bar (`src/components/navigation/ProgressBar.tsx`)**:
   - An animated, branded Ethiopian golden amber progress bar at the very top of the window.
   - Triggers instantly (0ms delay) on any internal navigation click, eliminating the "is it stuck?" feeling.
3. **Route Loading Skeletons (`loading.tsx`)**:
   - Added tailored shimmer skeletons using React Suspense:
     - Root Dashboard (`/loading.tsx`)
     - Inventory Ledger (`/inventory/loading.tsx`)
     - POS Sales (`/sales/loading.tsx`)
     - Purchases (`/purchases/loading.tsx`)
     - Products (`/products/loading.tsx`)
     - Reports (`/reports/loading.tsx`)
4. **Button Re-Submission & Double-Click Guards**:
   - All forms and action buttons (POS Checkout, Stock-In, Product/Unit/Supplier Modals, Login) are immediately disabled upon submission with spinning indicators, preventing accidental double-charging or duplicate ledger transactions.

---

## Phase 1: Project Scaffold, Supabase Schema, Auth & RLS

### What Was Built
1. **Next.js 14 App Architecture**:
   - Initialized with App Router, TypeScript, Tailwind CSS, Lucide icons, and component libraries.
   - Tailored Ethiopian grain design theme with warm amber, golden wheat, deep berbere red, and emerald accents.
2. **Database Schema (`supabase/migrations/01_initial_schema.sql` & `supabase/full_schema_setup.sql`)**:
   - `branches`: Location tracking defaulted to "Main Branch" for future multi-branch support.
   - `profiles`: Linked to `auth.users` with `app_role` enum (`owner_manager`, `staff`).
   - `units`: Extensible unit conversion table normalizing all units to **Grams (g)**.
   - `products`: Catalog tracking SKU, category, default unit, cost/price per gram, and reorder threshold in grams.
   - `suppliers`: Supplier directory.
   - `stock_movements`: Single source of truth append-only ledger.
   - `view_product_current_stock`: Live calculation view of inventory and low-stock status.
   - `purchases` & `purchase_items`: Incoming stock receipts.
   - `sales` & `sale_items`: POS outgoing orders.
   - `stock_adjustments`: Physical recount adjustments with required reasons.
3. **Row Level Security (`supabase/migrations/02_rls_policies.sql`)**:
   - `is_manager()` security definer function.
   - Full read/write segregation between Staff and Manager.
   - Append-only policy: `stock_movements` permits `INSERT` and `SELECT`, with zero `UPDATE` or `DELETE` permissions.
4. **Negative Stock Enforcement (`supabase/migrations/03_stock_functions.sql`)**:
   - Database trigger blocking sales that push stock below zero without `manual_override = true` and an explicit `override_reason`.
5. **Seed Data (`supabase/seed.sql`)**:
   - Seeded Main Branch and standard Ethiopian units (g, kg, quintal, mg, 250g packet, 50kg sack).

---

## Phase 2: Products, Units, Suppliers & Purchases (Stock-In)

### What Was Built
1. **Commodity Products Management (`/products`)**:
   - TanStack Table with search by commodity name, SKU, or category.
   - Product creation and editing modal (`ProductFormModal.tsx`) with real-time base gram calculation:
     - User enters cost and selling price per display unit (e.g. 5,000 ETB / quintal), system auto-converts to ETB / gram.
     - User enters reorder threshold in display unit, system auto-converts to grams for storage.
2. **Extensible Units Management (`/units`)**:
   - Interactive live commodity unit converter widget allowing instant conversion between Quintals, Kg, Grams, Milligrams, 250g Packets, and 50kg Sacks.
   - Unit creation modal (`UnitFormModal.tsx`) enabling adding custom packages (e.g. 500g pouch) with conversion factors.
3. **Suppliers Directory (`/suppliers`)**:
   - Vendor directory cards for grain cooperatives and spice wholesalers with phone dialing, regional address, and note logs.
   - Add/Edit supplier modal (`SupplierFormModal.tsx`).
4. **Stock-In Purchases (`/purchases/new` & `/purchases`)**:
   - Dynamic multi-item receiving form (`ReceiveStockForm.tsx`) supporting multiple lines in quintals or kg.
   - Server action `createPurchaseAction()` performing atomic insert into `purchases`, `purchase_items`, and positive movements in `stock_movements` ledger.

---

## Phase 3: Sales (POS) & Stock Ledger Wiring

### What Was Built
1. **Point of Sale Register (`/sales/new`)**:
   - Dual-panel POS counter with quick-search commodity catalog on left and active register cart on right.
   - Real-time stock verification: checks on-hand grams before processing.
   - **Negative Stock Protection**: If customer requests more than on-hand stock, blocks checkout unless staff explicitly activates **Manual Stock Override** and provides a mandatory explanation.
   - Multi-payment support: Cash, Telebirr, CBE Birr, Bank Transfer, Credit.
2. **Sales History & Invoicing (`/sales`)**:
   - Invoices log with customer names, payment method badges, itemized line items, and totals in ETB.
   - Server action `createSaleAction()` logging negative movements into `stock_movements`.

---

## Phase 4: Manager Dashboard Reports & Low-Stock Alerts

### What Was Built
1. **Executive Reports Dashboard (`/reports`)**:
   - Interactive Recharts visual analytics:
     - Revenue timeline area chart (Daily, Weekly, Monthly in ETB).
     - Stock Valuation Donut Chart by commodity category.
     - Top-selling commodities ranked by volume and revenue.
     - Supplier Procurement Cost Breakdown.
2. **Low-Stock Alert Center**:
   - Automated threshold detection: flags commodities where current grams $\le$ reorder threshold.
   - Direct reorder action shortcuts linking to Stock-In.

---

## Phase 5: Sample Data & Production Readiness

### What Was Built
1. **Ethiopian Commodity Seed Script (`supabase/seed_sample_commodities.sql`)**:
   - Authentic Ethiopian grains and spices: Berbere Special Grade 1, Sinde (Wheat Grain), Ater (Split Yellow Peas), and Barley (Gebs).
   - Seeded farming cooperatives and wholesale vendors.
   - Initial stock shipments seeded into the append-only ledger.
2. **Full Production Build Verification**:
   - Zero TypeScript errors, zero ESLint errors, all dynamic and static pages compiled.
