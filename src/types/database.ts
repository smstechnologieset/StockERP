export type AppRole = "owner_manager" | "staff";

export type MovementType = "purchase" | "sale" | "adjustment_in" | "adjustment_out";

export type PaymentMethod = "cash" | "telebirr" | "cbe_birr" | "bank_transfer" | "credit";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: AppRole;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  conversion_factor: number; // Multiplier to get Grams
  is_base_unit: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  code: string | null;
  category: string;
  description: string | null;
  default_unit_id: string | null;
  reorder_threshold_base_units: number; // In grams
  cost_price_per_base_unit: number; // ETB per gram
  selling_price_per_base_unit: number; // ETB per gram
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional expanded relation
  default_unit?: Unit;
}

export interface StockMovement {
  id: string;
  branch_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_base_units: number; // Grams (positive for IN, negative for OUT)
  original_quantity: number;
  unit_id: string;
  reference_id: string | null;
  reference_type: string | null;
  manual_override: boolean;
  override_reason: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  // Relations
  product?: Product;
  unit?: Unit;
}

export interface ProductCurrentStockView {
  product_id: string;
  product_name: string;
  product_code: string | null;
  product_category: string;
  default_unit_id: string | null;
  default_unit_name: string | null;
  default_unit_symbol: string | null;
  default_unit_factor: number | null;
  reorder_threshold_base_units: number;
  cost_price_per_base_unit: number;
  selling_price_per_base_unit: number;
  is_active: boolean;
  branch_id: string;
  branch_name: string;
  current_stock_base_units: number; // Grams
  current_stock_default_unit: number;
  is_low_stock: boolean;
  current_valuation_etb: number;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_id: string;
  quantity_base_units: number;
  unit_cost: number;
  total_cost: number;
  cost_per_base_unit: number;
  created_at: string;
  product?: Product;
  unit?: Unit;
}

export interface Purchase {
  id: string;
  branch_id: string;
  supplier_id: string | null;
  purchase_date: string;
  invoice_reference: string | null;
  total_cost: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_id: string;
  quantity_base_units: number;
  unit_price: number;
  total_price: number;
  price_per_base_unit: number;
  created_at: string;
  product?: Product;
  unit?: Unit;
}

export interface Sale {
  id: string;
  branch_id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  payment_method: PaymentMethod;
  total_amount: number;
  sale_date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  items?: SaleItem[];
}

export interface StockAdjustment {
  id: string;
  branch_id: string;
  product_id: string;
  adjustment_type: "in" | "out";
  quantity: number;
  unit_id: string;
  quantity_base_units: number;
  reason: string;
  recorded_by: string | null;
  created_at: string;
  product?: Product;
  unit?: Unit;
}
