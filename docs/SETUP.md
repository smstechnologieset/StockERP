# Local Setup & Supabase Configuration Guide

Follow this guide to run the Grain & Powder Trading ERP locally and configure your Supabase backend.

---

## 1. Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm**: v9 or higher
- A free Supabase account at [supabase.com](https://supabase.com)

---

## 2. Environment Variables

Create a file named `.env.local` in the root of the project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Where to Find These Keys in Supabase:
1. Open your project on [supabase.com](https://supabase.com).
2. Click **Project Settings** (gear icon in the bottom-left).
3. Navigate to **API** under the Configuration section.
4. Copy:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon (public)** key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role (secret)** key -> `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Applying Database Migrations

You can run the migrations directly inside the Supabase dashboard:
1. In your Supabase dashboard, click **SQL Editor** on the left menu.
2. Click **New query**.
3. Open and paste the contents of each file from the `supabase/migrations/` folder in order:
   - `supabase/migrations/01_initial_schema.sql` (Creates tables, views, and indexes)
   - `supabase/migrations/02_rls_policies.sql` (Enables Row Level Security & role permissions)
   - `supabase/migrations/03_stock_functions.sql` (Adds negative stock blocker triggers)
   - `supabase/seed.sql` (Seeds Main Branch and standard units: g, kg, quintal, mg, etc.)
4. Click **Run** for each.

---

## 4. Running the App Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Supabase Free Tier: 7-Day Auto-Pause Notice

> [!WARNING]
> **Important Note on Supabase Inactivity**:
> Projects on Supabase's Free Tier automatically **pause after 7 days of inactivity** (meaning no API requests are received).

### Lightweight Ways to Prevent Auto-Pause During Development:
1. **Free Uptime Monitor (Recommended & Simplest)**:
   - Create a free account at [UptimeRobot.com](https://uptimerobot.com) or [Cron-job.org](https://cron-job.org).
   - Create a simple HTTP monitor that pings your Supabase REST API endpoint every 24 hours:
     `https://<your-project-id>.supabase.co/rest/v1/units?select=symbol`
   - In the request headers, include:
     - `apikey: <your-anon-key>`
     - `Authorization: Bearer <your-anon-key>`
2. **GitHub Action Ping (If hosted on GitHub)**:
   - Add a `.github/workflows/keep-alive.yml` file scheduled on a cron (`0 12 * * *`) that sends a `curl` GET request to the Supabase endpoint.
