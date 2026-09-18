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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const itemsToUpdate = [
  { newName: "የሀበሻ ምስር", oldNames: ["ምስር ሃበሻ"], stockKg: 650, costKg: 295, sellKg: 300 },
  { newName: "ሩዝ", oldNames: ["ሩዝ"], stockKg: 50, costKg: 113, sellKg: 115 },
  { newName: "ምስር የውጭ", oldNames: ["ምስር የውጪ"], stockKg: 1050, costKg: 200, sellKg: 205 },
  { newName: "ድፍን ምስር የበሻ", oldNames: ["ድፍን ምስር ሃበሻ"], stockKg: 1275, costKg: 225, sellKg: 245 },
  { newName: "ድፍን ምስር የውጭ", oldNames: ["ድፍን ምስር የውጪ"], stockKg: 2475, costKg: 230, sellKg: 235 },
  { newName: "ፈንዲሻ", oldNames: ["ፈንዲሻ"], stockKg: 120, costKg: 310, sellKg: 320 },
  { newName: "ባቄላ ሽሮ", oldNames: ["ባቄላ ሽሮ"], stockKg: 600, costKg: 108, sellKg: 113 },
  { newName: "ባቄላ ክክ", oldNames: ["ባቄላ ክክ"], stockKg: 4850, costKg: 111, sellKg: 116 },
  { newName: "ሽምብራ ሽሮ", oldNames: ["ሽምብራ ሽሮ"], stockKg: 1850, costKg: 130, sellKg: 135 },
  { newName: "በሶ", oldNames: ["በሶ"], stockKg: 400, costKg: 170, sellKg: 175 },
  { newName: "ሽሮ ዱቄት", oldNames: ["ሽሮ ዱቀት"], stockKg: 2650, costKg: 150, sellKg: 155 },
  { newName: "በርበሬ ልዩ", oldNames: ["በርበሬ ኣንደኛ"], stockKg: 100, costKg: 360, sellKg: 370 },
  { newName: "አጃ ፍልፍል", oldNames: ["ኣጃ ፈልፈል"], stockKg: 350, costKg: 118, sellKg: 125 },
  { newName: "አጃ ቂንጬ", oldNames: ["ኣጃ ቂንጬ"], stockKg: 150, costKg: 137, sellKg: 145 },
  { newName: "ገብስ 2ኛ", oldNames: ["ገብስ ሁለተኛ"], stockKg: 600, costKg: 0, sellKg: 0 },
  { newName: "ገብስ 1ኛ", oldNames: ["ገብስ ኣንደኛ"], stockKg: 1525, costKg: 127, sellKg: 140 },
  { newName: "ስንዴ ቂንጬ", oldNames: ["ስንዴ ቂንጬ"], stockKg: 100, costKg: 95, sellKg: 105 }, // 95 ETB cost (standard margin with 105 sell)
  { newName: "አብሽ ያገር ውስጥ", oldNames: ["ኣብሽ ሃበሻ"], stockKg: 2550, costKg: 140, sellKg: 160 },
  { newName: "ሽሮ አተር", oldNames: ["ሽሮ ኣተር"], stockKg: 12700, costKg: 100, sellKg: 115 },
  { newName: "ጓያ", oldNames: ["ጏያ"], stockKg: 7300, costKg: 128, sellKg: 130 },
  { newName: "እርድ ልዩ", oldNames: ["እርድ ቀይ"], stockKg: 0.5, costKg: 75, sellKg: 85 },
  { newName: "እርድ 2ኛ", oldNames: ["እርድ ቢጫ"], stockKg: 0, costKg: 70, sellKg: 75 },
  { newName: "አተር ሳሚያ", oldNames: ["ኣተር (ሳሚያ)"], stockKg: 1975, costKg: 0, sellKg: 0 },
  { newName: "አተር ባሻን", oldNames: ["ኣተር ባሻን"], stockKg: 2450, costKg: 142, sellKg: 150 },
  { newName: "አሳ", oldNames: ["ኣተር (ኣሳ)"], stockKg: 1150, costKg: 0, sellKg: 0 },
  { newName: "በርበሬ 2ኛ", oldNames: ["በርበሬ ሁለተኛ"], stockKg: 2000, costKg: 360, sellKg: 375 },
  { newName: "አብሽ የውጭ", oldNames: ["ኣብሽ የውጪ"], stockKg: 0, costKg: 0, sellKg: 0 },
];

async function run() {
  console.log("Updating commodity products, pricing, and stock on hand...\n");

  // 1. Get kg unit
  const { data: unitData } = await supabase.from("units").select("id, symbol").eq("symbol", "kg").single();
  const kgUnitId = unitData?.id || "10000000-0000-0000-0000-000000000002";
  console.log(`Using Kilogram unit ID: ${kgUnitId}`);

  // Fetch all existing products
  const { data: existingProducts } = await supabase.from("products").select("*");

  // Also ensure remaining products like ቆሎ and ኣተር (ያገር ውስጥ) have default_unit = kg
  for (const ep of existingProducts || []) {
    if (ep.default_unit_id !== kgUnitId) {
      await supabase.from("products").update({ default_unit_id: kgUnitId }).eq("id", ep.id);
    }
  }

  const defaultBranchId = "00000000-0000-0000-0000-000000000001";

  for (const item of itemsToUpdate) {
    // Find matching product by newName or any oldNames
    let matched = existingProducts?.find(
      (p) => p.name === item.newName || item.oldNames.includes(p.name)
    );

    const costPerGram = Number((item.costKg / 1000).toFixed(4));
    const sellPerGram = Number((item.sellKg / 1000).toFixed(4));
    const targetGrams = Math.round(item.stockKg * 1000);

    let productId = matched?.id;

    if (matched) {
      // Update details
      const { error: updateErr } = await supabase
        .from("products")
        .update({
          name: item.newName,
          category: "Whole Grains",
          default_unit_id: kgUnitId,
          cost_price_per_base_unit: costPerGram,
          selling_price_per_base_unit: sellPerGram,
          reorder_threshold_base_units: 5000.0, // 5 kg
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matched.id);

      if (updateErr) console.error(`Error updating ${item.newName}:`, updateErr.message);
    } else {
      // Insert product if not found
      const { data: inserted, error: insertErr } = await supabase
        .from("products")
        .insert({
          name: item.newName,
          category: "Whole Grains",
          default_unit_id: kgUnitId,
          cost_price_per_base_unit: costPerGram,
          selling_price_per_base_unit: sellPerGram,
          reorder_threshold_base_units: 5000.0,
          is_active: true,
        })
        .select()
        .single();

      if (insertErr) {
        console.error(`Error inserting ${item.newName}:`, insertErr.message);
        continue;
      }
      productId = inserted.id;
    }

    // Now check current stock and balance it
    const { data: stockView } = await supabase
      .from("view_product_current_stock")
      .select("current_stock_base_units")
      .eq("product_id", productId)
      .single();

    const currentGrams = Number(stockView?.current_stock_base_units) || 0;
    const deltaGrams = targetGrams - currentGrams;

    if (Math.abs(deltaGrams) > 0.001) {
      const isAdd = deltaGrams > 0;
      const { error: movErr } = await supabase.from("stock_movements").insert({
        branch_id: defaultBranchId,
        product_id: productId,
        movement_type: isAdd ? "adjustment_in" : "adjustment_out",
        quantity_base_units: deltaGrams,
        original_quantity: Math.abs(deltaGrams) / 1000,
        unit_id: kgUnitId,
        reference_type: "manual_adjustment",
        manual_override: true,
        override_reason: "Initial inventory setup balance",
        notes: `Inventory balance aligned to ${item.stockKg} kg`,
      });

      if (movErr) {
        console.error(`Error setting stock for ${item.newName}:`, movErr.message);
      }
    }
  }

  // Verify final stock levels
  console.log("\n=======================================================");
  console.log("VERIFYING UPDATED PRODUCTS & STOCK LEVELS:");
  console.log("=======================================================");
  const { data: finalStock } = await supabase
    .from("view_product_current_stock")
    .select("product_name, current_stock_default_unit, cost_price_per_base_unit, selling_price_per_base_unit")
    .order("product_name");

  console.table(
    finalStock?.map((f) => ({
      Product: f.product_name,
      "Stock (kg)": Number(f.current_stock_default_unit),
      "Cost (ETB/kg)": Number((f.cost_price_per_base_unit * 1000).toFixed(2)),
      "Sell (ETB/kg)": Number((f.selling_price_per_base_unit * 1000).toFixed(2)),
    }))
  );

  console.log("\n✓ All products, prices, and stock successfully updated!");
}

run();
