# StockERP - Supabase Setup & Migration Guide

This guide describes how to set up a brand-new, clean Supabase project for a new client using the single setup script.

---

## Quick Setup: 1 Single SQL Script

The entire database schema, standard Ethiopian trading units, triggers, RLS policies, security roles, and initial credentials can be set up in **one step**.

### Step 1: Create a New Supabase Project
1. Log into [Supabase](https://supabase.com) with your client credentials.
2. Create a new project (choose your preferred region, e.g., Central Europe / Frankfurt or Middle East).
3. Set a strong database password and wait ~1–2 minutes for Supabase to provision.

---

### Step 2: Run the Setup SQL Script
1. In your Supabase Project dashboard, navigate to **SQL Editor** (the terminal icon in the left menu).
2. Click **New query**.
3. Open [`supabase/complete_setup.sql`](./complete_setup.sql) in this repository, copy all contents, and paste into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl + Enter`).
5. Verify you see the green success message: **"Success. No rows returned"**.

---

### Step 3: Configure Environment Variables in the App
1. In your Supabase dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Copy the following keys:
   - **Project URL**
   - **Project API Keys** -> `anon` / `public`
   - **Project API Keys** -> `service_role` (keep secret!)
3. Update `.env.local` on the client's desktop:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-new-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-new-service-role-key>
```

---

### Step 4: Log In with the Default Accounts
The script automatically sets up two initial accounts:

| Role | Email | Password |
|:-----|:------|:---------|
| **Owner / Manager** | `manager@stockerp.et` | `Password123!` |
| **Sales Staff** | `staff@stockerp.et` | `Password123!` |

> [!NOTE]
> The manager can immediately add staff accounts, change email addresses, or update passwords from the **User Access Control** (`/users`) page inside the app!

---

### What the Script Automatically Configures:
- **Extensions**: `uuid-ossp`, `pgcrypto`
- **Branches**: Default `Main Branch`
- **Roles & Profiles**: `owner_manager` and `staff` roles with auto-profile trigger on `auth.users`
- **Measurement Units**: Gram (g - base), Kilogram (kg), Quintal (q), Liter (L), Milliliter (ml), Piece (pcs), Bottle (btl), Carton (ctn), Bag (bag), Packet (pkt)
- **Tables**: `products`, `suppliers`, `stock_movements` (append-only ledger), `stock_adjustments`, `purchases`, `purchase_items`, `sales`, `sale_items`, `customer_credits`, `credit_payments`
- **Views**: `view_product_current_stock` (real-time stock balances, valuations, and low-stock alarms)
- **Protection**: Negative stock prevention trigger (`enforce_negative_stock_protection`)
- **Security**: Full Row Level Security (RLS) enabled on all tables
