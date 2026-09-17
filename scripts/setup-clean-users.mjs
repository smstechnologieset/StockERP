import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    const val = v.join("=").trim().replace(/^["']|["']$/g, "");
    if (k === "NEXT_PUBLIC_SUPABASE_URL") url = val;
    if (k === "SUPABASE_SERVICE_ROLE_KEY") serviceKey = val;
  }
}

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_USERS = [
  {
    email: "admin@stockerp.com",
    password: "Admin@123456",
    fullName: "Store Administrator",
    role: "owner_manager",
  },
  {
    email: "manager@stockerp.et",
    password: "Password123!",
    fullName: "Owner / Store Manager",
    role: "owner_manager",
  },
  {
    email: "staff@stockerp.et",
    password: "Password123!",
    fullName: "Cashier / Sales Staff",
    role: "staff",
  },
];

async function setupUsers() {
  console.log("Connecting to Supabase at:", url);

  // Ensure default branch exists
  const { data: branch, error: branchErr } = await supabase
    .from("branches")
    .upsert(
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Main Branch",
        code: "MAIN",
        address: "Addis Ababa, Ethiopia",
        is_active: true,
      },
      { onConflict: "code" }
    )
    .select()
    .single();

  if (branchErr) {
    console.warn("Notice checking branch:", branchErr.message);
  }

  for (const u of DEFAULT_USERS) {
    console.log(`\nSetting up account: ${u.email}...`);

    // Check if user already exists
    const { data: existingUserList } = await supabase.auth.admin.listUsers();
    const existing = existingUserList?.users?.find(
      (usr) => usr.email?.toLowerCase() === u.email.toLowerCase()
    );

    let userId = existing?.id;

    if (existing) {
      console.log(`  User already registered (${existing.id}). Updating password & confirmed status...`);
      const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName, role: u.role },
        }
      );
      if (updateErr) {
        console.error(`  Error updating user:`, updateErr.message);
      } else {
        console.log(`  ✓ Updated credentials for ${u.email}`);
      }
    } else {
      console.log(`  Creating new auth user...`);
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName, role: u.role },
      });

      if (createErr) {
        console.error(`  Error creating user:`, createErr.message);
      } else if (created.user) {
        userId = created.user.id;
        console.log(`  ✓ Created user ${u.email} (ID: ${userId})`);
      }
    }

    if (userId) {
      // Upsert profile
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: u.fullName,
        role: u.role,
        branch_id: "00000000-0000-0000-0000-000000000001",
      });

      if (profErr) {
        console.error(`  Error linking profile:`, profErr.message);
      } else {
        console.log(`  ✓ Linked profile: ${u.fullName} (${u.role})`);
      }
    }
  }

  // Verify accounts
  const { data: verifyList, error: vErr } = await supabase.auth.admin.listUsers();
  if (vErr) {
    console.error("\n❌ Could not verify accounts due to:", vErr.message);
    console.error("Please run the SQL command in Supabase SQL Editor to clean up corrupt auth users:");
    console.error("DELETE FROM auth.users WHERE email IN ('admin@stockerp.com', 'manager@stockerp.et', 'staff@stockerp.et');\n");
    return;
  }

  console.log("\n=======================================================");
  console.log("ALL INITIAL ACCOUNTS ARE CONFIGURED AND READY TO LOGIN!");
  console.log("=======================================================");
  console.log("Manager: admin@stockerp.com  /  Admin@123456");
  console.log("Manager: manager@stockerp.et /  Password123!");
  console.log("Staff:   staff@stockerp.et   /  Password123!");
  console.log("=======================================================\n");
}

setupUsers().catch(console.error);
