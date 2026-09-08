import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

console.log("Connecting to Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  try {
    // Check if tables exist
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select("*")
      .limit(5);

    if (unitsError) {
      console.log("Status: Tables not yet created in Supabase. Reason:", unitsError.message);
      console.log("Action: The SQL migrations in supabase/migrations/ need to be run in Supabase SQL Editor.");
      return { initialized: false, error: unitsError.message };
    }

    console.log("SUCCESS! Connected to Supabase and found 'units' table. Row count:", units?.length || 0);
    return { initialized: true, count: units?.length || 0 };
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return { initialized: false, error: err.message };
  }
}

check();
