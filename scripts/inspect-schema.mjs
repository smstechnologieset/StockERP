import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tables = [
    "branches",
    "units",
    "products",
    "suppliers",
    "profiles",
    "stock_movements",
    "purchases",
    "purchase_items",
    "sales",
    "sale_items",
    "stock_adjustments",
    "view_product_current_stock"
  ];

  console.log("=== SUPABASE DATABASE STATUS ===");
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`[ ] ${t.padEnd(28)}: Missing or Error (${error.message})`);
    } else {
      console.log(`[✓] ${t.padEnd(28)}: OK (Rows: ${count ?? 0})`);
    }
  }
}

inspect();
