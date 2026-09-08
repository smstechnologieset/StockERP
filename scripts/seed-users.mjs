import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUsers = [
  {
    email: "manager@stockerp.et",
    password: "Password123!",
    fullName: "Ato Dawit Manager",
    role: "owner_manager",
  },
  {
    email: "staff@stockerp.et",
    password: "Password123!",
    fullName: "W/ro Tigist Staff",
    role: "staff",
  },
];

async function seed() {
  console.log("Seeding test users into Supabase Auth...");

  for (const user of testUsers) {
    try {
      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      });

      let userId = authData?.user?.id;

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
          console.log(`User ${user.email} already exists in Auth. Updating password and metadata...`);
          // Find user id by listing
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u) => u.email === user.email);
          if (existingUser) {
            userId = existingUser.id;
            await supabase.auth.admin.updateUserById(userId, {
              password: user.password,
              user_metadata: {
                full_name: user.fullName,
                role: user.role,
              },
            });
          }
        } else {
          console.error(`Error creating ${user.email}:`, authError.message);
          continue;
        }
      } else {
        console.log(`✓ Created user in Auth: ${user.email}`);
      }

      // 2. Ensure profile in public.profiles exists and has correct role
      if (userId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            full_name: user.fullName,
            role: user.role,
            branch_id: "00000000-0000-0000-0000-000000000001",
          });

        if (profileError) {
          console.error(`Error upserting profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`✓ Profile synced in public.profiles for ${user.email} with role '${user.role}'`);
        }
      }
    } catch (err) {
      console.error(`Exception for ${user.email}:`, err.message);
    }
  }

  console.log("\nDone! Test credentials ready:");
  console.log("------------------------------------------");
  console.log("Manager: manager@stockerp.et / Password123!");
  console.log("Staff:   staff@stockerp.et   / Password123!");
  console.log("------------------------------------------");
}

seed();
