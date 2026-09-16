"use client";

import XLSX from "xlsx-js-style";

export interface ExcelStockItem {
  name: string;
  category: string;
  currentStockDisplay: string;
  baseUnitsGrams: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  marginETB: number;
  marginPercent: number;
  valuationAtCostETB: number;
  valuationAtSellingETB: number;
  unrealizedProfitETB: number;
  status: string;
}

export interface ExcelCreditItem {
  customerName: string;
  customerPhone: string;
  invoiceNumber: string;
  ethiopianDate: string;
  gregorianDate: string;
  ethiopianDueDate: string;
  gregorianDueDate: string;
  totalCreditAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: string;
}

export interface ExcelReportData {
  reportPeriodEthiopian: string;
  reportPeriodGregorian: string;
  generatedDateEthiopian: string;
  generatedDateGregorian: string;
  preparedBy?: string;

  // Financial KPIs
  totalSalesRevenue: number;
  totalGoodsPurchasesCost?: number;
  totalTransportCost?: number;
  totalLaborCost?: number;
  totalPurchasesCost: number;
  netOperatingCashFlow: number;
  salesCount: number;
  purchasesCount: number;
  currentStockValuation: number; // Valuation at cost
  potentialStockValuation?: number; // Valuation at retail selling price
  potentialUnrealizedProfit?: number; // Potential gross profit
  creditOutstanding: number;
  creditCollected: number;

  // Top Selling Commodities
  topSelling: {
    rank?: number;
    name: string;
    soldDisplay: string;
    soldGrams: number;
    revenue: number;
  }[];

  // Supplier Procurement
  supplierSpending: {
    name: string;
    shipments: number;
    totalCost: number;
  }[];

  // Sales Ledger
  sales: {
    ethiopianDate: string;
    gregorianDate: string;
    invoiceNumber: string;
    customerName: string;
    paymentMethod: string;
    itemsSummary: string;
    totalAmount: number;
  }[];

  // Purchases Ledger
  purchases: {
    ethiopianDate: string;
    gregorianDate: string;
    supplierName: string;
    reference: string;
    itemsCost?: number;
    transportCost?: number;
    laborCost?: number;
    totalCost: number;
  }[];

  // Inventory Valuation Audit
  inventory: ExcelStockItem[];

  // Customer Credit Ledger
  credits?: ExcelCreditItem[];
}

// Reusable Cell Style Factories
const thinBorder = {
  top: { style: "thin", color: { rgb: "E5E7EB" } },
  bottom: { style: "thin", color: { rgb: "E5E7EB" } },
  left: { style: "thin", color: { rgb: "E5E7EB" } },
  right: { style: "thin", color: { rgb: "E5E7EB" } },
};

const doubleBottomBorder = {
  top: { style: "thin", color: { rgb: "374151" } },
  bottom: { style: "double", color: { rgb: "111827" } },
  left: { style: "thin", color: { rgb: "E5E7EB" } },
  right: { style: "thin", color: { rgb: "E5E7EB" } },
};

function bannerCell(text: string, bgColor: string, fontSize = 12) {
  return {
    v: text,
    t: "s",
    s: {
      fill: { fgColor: { rgb: bgColor } },
      font: { name: "Segoe UI", sz: fontSize, bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };
}

function subBannerCell(text: string, bgColor = "374151") {
  return {
    v: text,
    t: "s",
    s: {
      fill: { fgColor: { rgb: bgColor } },
      font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "F3F4F6" } },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };
}

function headerCell(text: string, bgColor: string) {
  return {
    v: text,
    t: "s",
    s: {
      fill: { fgColor: { rgb: bgColor } },
      font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: thinBorder,
    },
  };
}

function dataTextCell(text: string, align: "left" | "center" | "right" = "left", bold = false, isAlt = false) {
  return {
    v: text,
    t: "s",
    s: {
      fill: { fgColor: { rgb: isAlt ? "F9FAFB" : "FFFFFF" } },
      font: { name: "Segoe UI", sz: 10, bold, color: { rgb: "111827" } },
      alignment: { horizontal: align, vertical: "center" },
      border: thinBorder,
    },
  };
}

function dataNumberCell(num: number, numFmt = "#,##0.00", bold = false, isAlt = false) {
  return {
    v: num,
    t: "n",
    s: {
      fill: { fgColor: { rgb: isAlt ? "F9FAFB" : "FFFFFF" } },
      font: { name: "Segoe UI", sz: 10, bold, color: { rgb: "111827" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: thinBorder,
      numFmt,
    },
  };
}

function totalLabelCell(text: string) {
  return {
    v: text,
    t: "s",
    s: {
      fill: { fgColor: { rgb: "F3F4F6" } },
      font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "111827" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: doubleBottomBorder,
    },
  };
}

function totalNumberCell(num: number, numFmt = "#,##0.00") {
  return {
    v: num,
    t: "n",
    s: {
      fill: { fgColor: { rgb: "F3F4F6" } },
      font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "047857" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: doubleBottomBorder,
      numFmt,
    },
  };
}

// Helper to push a merged section banner dynamically without static row index arithmetic
function addMergedBanner(
  rows: any[][],
  merges: XLSX.Range[],
  text: string,
  bgColor: string,
  totalCols: number,
  fontSize = 11,
  align: "left" | "center" = "left",
  textColor = "FFFFFF"
) {
  const rIdx = rows.length;
  const row = new Array(totalCols).fill(null);
  row[0] = {
    v: text,
    t: "s",
    s: {
      fill: { fgColor: { rgb: bgColor } },
      font: { name: "Segoe UI", sz: fontSize, bold: true, color: { rgb: textColor } },
      alignment: { horizontal: align, vertical: "center" },
      border: thinBorder,
    },
  };
  rows.push(row);
  merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: totalCols - 1 } });
}

export function generateExecutiveExcelReport(data: ExcelReportData, filenamePrefix = "StockERP_Master_Report") {
  const wb = XLSX.utils.book_new();

  // =============================================================
  // 1. SHEET 1: MASTER BUSINESS AUDIT REPORT (ዋና አጠቃላይ ሪፖርት)
  // Contains EVERY SINGLE DETAIL: KPIs, Products, Sales, Credits, Deliveries
  // =============================================================
  const s1Rows: any[][] = [];
  const s1Merges: XLSX.Range[] = [];
  const S1_COLS = 10;

  // Title Banner
  addMergedBanner(
    s1Rows,
    s1Merges,
    "STOCKERP - MASTER BUSINESS PERFORMANCE & AUDIT REPORT / እስቶክ ኢአርፒ ሙሉ የንግድ ስራ እና የሂሳብ ኦዲት ሪፖርት",
    "D97706",
    S1_COLS,
    13,
    "center"
  );

  // Sub-banner
  addMergedBanner(
    s1Rows,
    s1Merges,
    "COMPREHENSIVE ALL-IN-ONE BUSINESS LEDGER / ሁሉን አቀፍ የተሟላ የንግድና የሂሳብ መረጃ",
    "1F2937",
    S1_COLS,
    10,
    "center"
  );
  s1Rows.push([]);

  // Metadata Rows
  const metaRow1 = new Array(S1_COLS).fill(null);
  metaRow1[0] = dataTextCell("Report Period / የሪፖርት ጊዜ:", "left", true);
  metaRow1[1] = dataTextCell(`${data.reportPeriodEthiopian}  [${data.reportPeriodGregorian}]`, "left");
  metaRow1[3] = dataTextCell("Prepared By / አዘጋጅ:", "left", true);
  metaRow1[4] = dataTextCell(data.preparedBy || "Manager / ስራ አስኪያጅ", "left");
  const metaR1Idx = s1Rows.length;
  s1Rows.push(metaRow1);
  s1Merges.push({ s: { r: metaR1Idx, c: 1 }, e: { r: metaR1Idx, c: 2 } });
  s1Merges.push({ s: { r: metaR1Idx, c: 4 }, e: { r: metaR1Idx, c: 9 } });

  const metaRow2 = new Array(S1_COLS).fill(null);
  metaRow2[0] = dataTextCell("Generated On / የተዘጋጀበት ቀን:", "left", true);
  metaRow2[1] = dataTextCell(`${data.generatedDateEthiopian}  [${data.generatedDateGregorian}]`, "left");
  metaRow2[3] = dataTextCell("Verification / ሁኔታ:", "left", true);
  metaRow2[4] = dataTextCell("Official Verified Business Audit Report", "left");
  const metaR2Idx = s1Rows.length;
  s1Rows.push(metaRow2);
  s1Merges.push({ s: { r: metaR2Idx, c: 1 }, e: { r: metaR2Idx, c: 2 } });
  s1Merges.push({ s: { r: metaR2Idx, c: 4 }, e: { r: metaR2Idx, c: 9 } });
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 1: Executive Financial Summary & Stock Valuations
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "1. EXECUTIVE FINANCIAL SUMMARY & VALUATIONS / የፋይናንስ እና የሀብት ቁልፍ አመልካቾች",
    "FEF3C7",
    S1_COLS,
    11,
    "left",
    "92400E"
  );

  const kpiHdrRow = new Array(S1_COLS).fill(null);
  kpiHdrRow[0] = headerCell("No.", "4B5563");
  kpiHdrRow[1] = headerCell("Financial Metric / የሂሳብ መለኪያ", "4B5563");
  kpiHdrRow[2] = headerCell("Category / ምድብ", "4B5563");
  kpiHdrRow[3] = headerCell("Amount (ETB) / መጠን በብር", "4B5563");
  kpiHdrRow[4] = headerCell("Audit & Operational Clarification / ማብራሪያ", "4B5563");
  const kpiHdrIdx = s1Rows.length;
  s1Rows.push(kpiHdrRow);
  s1Merges.push({ s: { r: kpiHdrIdx, c: 4 }, e: { r: kpiHdrIdx, c: 9 } });

  const potentialValuation = data.potentialStockValuation || (data.currentStockValuation * 1.25);
  const unrealizedProfit = data.potentialUnrealizedProfit || (potentialValuation - data.currentStockValuation);

  const kpiItems = [
    {
      metric: "Total Sales Revenue (ጠቅላላ የሽያጭ ገቢ)",
      category: "Revenue",
      amount: data.totalSalesRevenue,
      note: `${data.salesCount} Sales Invoices completed in selected period`,
    },
    {
      metric: "Commodity Goods Purchases (የእህል ግዢዎች ዋጋ)",
      category: "Cost of Goods",
      amount: data.totalGoodsPurchasesCost ?? (data.totalPurchasesCost - (data.totalTransportCost || 0) - (data.totalLaborCost || 0)),
      note: "Pure commodity inventory procurement expenditure",
    },
    {
      metric: "Inbound Freight & Transport (የትራንስፖርት ወጪ)",
      category: "Logistics Expense",
      amount: data.totalTransportCost || 0,
      note: "Freight and delivery costs for inbound stock shipments",
    },
    {
      metric: "Offloading Labor & Porter Fees (የማውረጃ እና ኩሊ ወጪ)",
      category: "Labor Expense",
      amount: data.totalLaborCost || 0,
      note: "Offloading and labor fees for received shipments",
    },
    {
      metric: "Grand Total Procurement & Logistics (ጠቅላላ የግዢ እና ማጓጓዣ ወጪ)",
      category: "Total Landed Cost",
      amount: data.totalPurchasesCost,
      note: `${data.purchasesCount} Shipments received and restocked from suppliers`,
    },
    {
      metric: "Net Operating Cash Flow (የተጣራ የጥሬ ገንዘብ ፍሰት)",
      category: "Cash Flow",
      amount: data.netOperatingCashFlow,
      note: data.netOperatingCashFlow >= 0 ? "Positive Cash Flow Surplus" : "Operating Deficit",
    },
    {
      metric: "Current Stock Valuation at Cost (የክምችት ዋጋ በግዢ ዋጋ)",
      category: "Asset (Cost)",
      amount: data.currentStockValuation,
      note: "Total physical stock valuation on hand in warehouse at purchase cost",
    },
    {
      metric: "Potential Stock Valuation at Retail (የክምችት ዋጋ በመሸጫ ዋጋ)",
      category: "Asset (Retail)",
      amount: potentialValuation,
      note: "Total projected valuation of current warehouse inventory at retail selling prices",
    },
    {
      metric: "Potential Gross Profit in Stock (በክምችት ላይ የሚጠበቅ ትርፍ)",
      category: "Gross Profit",
      amount: unrealizedProfit,
      note: "Unrealized gross margin embedded in physical warehouse stock",
    },
    {
      metric: "Outstanding Customer Credit (ያልተሰበሰበ የደንበኞች ብድር)",
      category: "Receivables",
      amount: data.creditOutstanding,
      note: "Active customer debt balances awaiting collection",
    },
    {
      metric: "Credit Repayments Collected (የተሰበሰበ የደንበኞች ብድር)",
      category: "Collection",
      amount: data.creditCollected,
      note: "Cash collected from outstanding customer debts in period",
    },
  ];

  kpiItems.forEach((kpi, idx) => {
    const isAlt = idx % 2 === 1;
    const row = new Array(S1_COLS).fill(null);
    row[0] = dataTextCell(String(idx + 1), "center", false, isAlt);
    row[1] = dataTextCell(kpi.metric, "left", true, isAlt);
    row[2] = dataTextCell(kpi.category, "center", false, isAlt);
    row[3] = dataNumberCell(kpi.amount, "#,##0.00", true, isAlt);
    row[4] = dataTextCell(kpi.note, "left", false, isAlt);
    const rIdx = s1Rows.length;
    s1Rows.push(row);
    s1Merges.push({ s: { r: rIdx, c: 4 }, e: { r: rIdx, c: 9 } });
  });
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 2: Complete Product Stock Levels, Prices & Valuation Audit
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "2. COMPLETE PRODUCT STOCK LEVELS, PRICES & VALUATION AUDIT / የምርት ክምችት፣ የመሸጫና የግዢ ዋጋ ዝርዝር ኦዲት",
    "EDE9FE",
    S1_COLS,
    11,
    "left",
    "5B21B6"
  );

  s1Rows.push([
    headerCell("No.", "6D28D9"),
    headerCell("Commodity Name / የእህል ስም", "6D28D9"),
    headerCell("Category / ምድብ", "6D28D9"),
    headerCell("Physical Stock / ያለ ክምችት", "6D28D9"),
    headerCell("Unit Cost (ETB) / መግዣ", "6D28D9"),
    headerCell("Unit Selling (ETB) / መሸጫ", "6D28D9"),
    headerCell("Margin / ትርፍ (ETB)", "6D28D9"),
    headerCell("Stock at Cost (ETB) / በግዢ", "6D28D9"),
    headerCell("Stock at Retail (ETB) / በመሸጫ", "6D28D9"),
    headerCell("Status / ሁኔታ", "6D28D9"),
  ]);

  let sumStockCost = 0;
  let sumStockSelling = 0;

  if (!data.inventory || data.inventory.length === 0) {
    const emptyRow = new Array(S1_COLS).fill(null);
    emptyRow[0] = dataTextCell("No inventory items found", "center");
    const rIdx = s1Rows.length;
    s1Rows.push(emptyRow);
    s1Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 9 } });
  } else {
    data.inventory.forEach((inv, idx) => {
      const isAlt = idx % 2 === 1;
      sumStockCost += inv.valuationAtCostETB;
      sumStockSelling += inv.valuationAtSellingETB;
      s1Rows.push([
        dataTextCell(String(idx + 1), "center", false, isAlt),
        dataTextCell(inv.name, "left", true, isAlt),
        dataTextCell(inv.category, "left", false, isAlt),
        dataTextCell(inv.currentStockDisplay, "right", true, isAlt),
        dataNumberCell(inv.unitCostPrice, "#,##0.00", false, isAlt),
        dataNumberCell(inv.unitSellingPrice, "#,##0.00", false, isAlt),
        dataNumberCell(inv.marginETB, "#,##0.00", false, isAlt),
        dataNumberCell(inv.valuationAtCostETB, "#,##0.00", true, isAlt),
        dataNumberCell(inv.valuationAtSellingETB, "#,##0.00", true, isAlt),
        dataTextCell(inv.status, "center", false, isAlt),
      ]);
    });

    const totStockRIdx = s1Rows.length;
    const totStockRow = new Array(S1_COLS).fill(null);
    totStockRow[0] = totalLabelCell("TOTAL WAREHOUSE STOCK VALUATION (ጠቅላላ የክምችት ዋጋ ድምር):");
    totStockRow[7] = totalNumberCell(sumStockCost);
    totStockRow[8] = totalNumberCell(sumStockSelling);
    totStockRow[9] = totalLabelCell("");
    s1Rows.push(totStockRow);
    s1Merges.push({ s: { r: totStockRIdx, c: 0 }, e: { r: totStockRIdx, c: 6 } });
  }
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 3: Itemized Sales Transactions in Period
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "3. ITEMIZED SALES TRANSACTIONS IN PERIOD / የተከናወኑ የሽያጭ ዝርዝር ደረሰኞች",
    "D1FAE5",
    S1_COLS,
    11,
    "left",
    "065F46"
  );

  const saleHdrRow = new Array(S1_COLS).fill(null);
  saleHdrRow[0] = headerCell("No.", "047857");
  saleHdrRow[1] = headerCell("Date (የኢትዮጵያ ቀን)", "047857");
  saleHdrRow[2] = headerCell("Gregorian Date", "047857");
  saleHdrRow[3] = headerCell("Invoice # / ደረሰኝ", "047857");
  saleHdrRow[4] = headerCell("Customer Name / ደንበኛ", "047857");
  saleHdrRow[5] = headerCell("Payment Method / አከፋፈል", "047857");
  saleHdrRow[6] = headerCell("Commodities & Quantities Sold / የተሸጡ እህሎች", "047857");
  saleHdrRow[9] = headerCell("Total Amount (ETB) / ጠቅላላ ብር", "047857");
  const sHdrIdx = s1Rows.length;
  s1Rows.push(saleHdrRow);
  s1Merges.push({ s: { r: sHdrIdx, c: 6 }, e: { r: sHdrIdx, c: 8 } });

  let sumSalesS1 = 0;
  if (!data.sales || data.sales.length === 0) {
    const emptyRow = new Array(S1_COLS).fill(null);
    emptyRow[0] = dataTextCell("No sales recorded in this period", "center");
    const rIdx = s1Rows.length;
    s1Rows.push(emptyRow);
    s1Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 9 } });
  } else {
    data.sales.forEach((s, idx) => {
      const isAlt = idx % 2 === 1;
      sumSalesS1 += s.totalAmount;
      const sRow = new Array(S1_COLS).fill(null);
      sRow[0] = dataTextCell(String(idx + 1), "center", false, isAlt);
      sRow[1] = dataTextCell(s.ethiopianDate, "center", true, isAlt);
      sRow[2] = dataTextCell(s.gregorianDate, "center", false, isAlt);
      sRow[3] = dataTextCell(s.invoiceNumber, "center", true, isAlt);
      sRow[4] = dataTextCell(s.customerName, "left", false, isAlt);
      sRow[5] = dataTextCell(s.paymentMethod.toUpperCase(), "center", false, isAlt);
      sRow[6] = dataTextCell(s.itemsSummary || "-", "left", false, isAlt);
      sRow[9] = dataNumberCell(s.totalAmount, "#,##0.00", true, isAlt);
      const rIdx = s1Rows.length;
      s1Rows.push(sRow);
      s1Merges.push({ s: { r: rIdx, c: 6 }, e: { r: rIdx, c: 8 } });
    });

    const sTotRIdx = s1Rows.length;
    const sTotRow = new Array(S1_COLS).fill(null);
    sTotRow[0] = totalLabelCell("TOTAL SALES REVENUE IN PERIOD (ጠቅላላ የሽያጭ ገቢ ድምር):");
    sTotRow[9] = totalNumberCell(sumSalesS1);
    s1Rows.push(sTotRow);
    s1Merges.push({ s: { r: sTotRIdx, c: 0 }, e: { r: sTotRIdx, c: 8 } });
  }
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 4: Customer Credit & Debt Ledger (Given & Remaining)
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "4. CUSTOMER CREDIT & DEBT LEDGER / የደንበኞች ብድር እና ቀሪ እዳ መዝገብ",
    "FFEDD5",
    S1_COLS,
    11,
    "left",
    "9A3412"
  );

  s1Rows.push([
    headerCell("No.", "C2410C"),
    headerCell("Customer Name / ደንበኛ", "C2410C"),
    headerCell("Phone / ስልክ", "C2410C"),
    headerCell("Invoice Ref / ደረሰኝ", "C2410C"),
    headerCell("Credit Date (ቀን)", "C2410C"),
    headerCell("Due Date (መክፈያ)", "C2410C"),
    headerCell("Credit Given (ETB) / የተሰጠ", "C2410C"),
    headerCell("Amount Paid (ETB) / የተከፈለ", "C2410C"),
    headerCell("Remaining Debt (ETB) / ቀሪ", "C2410C"),
    headerCell("Status / ሁኔታ", "C2410C"),
  ]);

  let sumCredGiven = 0;
  let sumCredPaid = 0;
  let sumCredRemaining = 0;

  if (!data.credits || data.credits.length === 0) {
    const emptyRow = new Array(S1_COLS).fill(null);
    emptyRow[0] = dataTextCell("No active credit accounts recorded", "center");
    const rIdx = s1Rows.length;
    s1Rows.push(emptyRow);
    s1Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 9 } });
  } else {
    data.credits.forEach((c, idx) => {
      const isAlt = idx % 2 === 1;
      sumCredGiven += c.totalCreditAmount;
      sumCredPaid += c.paidAmount;
      sumCredRemaining += c.remainingBalance;

      s1Rows.push([
        dataTextCell(String(idx + 1), "center", false, isAlt),
        dataTextCell(c.customerName, "left", true, isAlt),
        dataTextCell(c.customerPhone || "-", "center", false, isAlt),
        dataTextCell(c.invoiceNumber || "-", "center", false, isAlt),
        dataTextCell(c.ethiopianDate, "center", false, isAlt),
        dataTextCell(c.ethiopianDueDate || "-", "center", false, isAlt),
        dataNumberCell(c.totalCreditAmount, "#,##0.00", true, isAlt),
        dataNumberCell(c.paidAmount, "#,##0.00", false, isAlt),
        dataNumberCell(c.remainingBalance, "#,##0.00", true, isAlt),
        dataTextCell(c.status, "center", true, isAlt),
      ]);
    });

    const cTotRIdx = s1Rows.length;
    const cTotRow = new Array(S1_COLS).fill(null);
    cTotRow[0] = totalLabelCell("TOTAL CUSTOMER CREDITS & RECEIVABLES (ጠቅላላ የብድር ሂሳብ ድምር):");
    cTotRow[6] = totalNumberCell(sumCredGiven);
    cTotRow[7] = totalNumberCell(sumCredPaid);
    cTotRow[8] = totalNumberCell(sumCredRemaining);
    cTotRow[9] = totalLabelCell("");
    s1Rows.push(cTotRow);
    s1Merges.push({ s: { r: cTotRIdx, c: 0 }, e: { r: cTotRIdx, c: 5 } });
  }
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 5: Itemized Incoming Supplier Shipments
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "5. ITEMIZED INCOMING SUPPLIER PROCUREMENT SHIPMENTS / የገቡ የግዢ ጭነቶች ዝርዝር",
    "DBEAFE",
    S1_COLS,
    11,
    "left",
    "1E40AF"
  );

  const purHdrRow = new Array(S1_COLS).fill(null);
  purHdrRow[0] = headerCell("No.", "1D4ED8");
  purHdrRow[1] = headerCell("Date (የኢትዮጵያ ቀን)", "1D4ED8");
  purHdrRow[2] = headerCell("Gregorian Date", "1D4ED8");
  purHdrRow[3] = headerCell("Supplier / Cooperative / አቅራቢ", "1D4ED8");
  purHdrRow[5] = headerCell("Waybill / Invoice Ref / ማመሳከሪያ", "1D4ED8");
  purHdrRow[8] = headerCell("Delivery Status / ሁኔታ", "1D4ED8");
  purHdrRow[9] = headerCell("Total Cost (ETB) / ጠቅላላ ወጪ", "1D4ED8");
  const pHdrIdx = s1Rows.length;
  s1Rows.push(purHdrRow);
  s1Merges.push({ s: { r: pHdrIdx, c: 3 }, e: { r: pHdrIdx, c: 4 } });
  s1Merges.push({ s: { r: pHdrIdx, c: 5 }, e: { r: pHdrIdx, c: 7 } });

  let sumPurchasesS1 = 0;
  if (!data.purchases || data.purchases.length === 0) {
    const emptyRow = new Array(S1_COLS).fill(null);
    emptyRow[0] = dataTextCell("No purchases recorded in this period", "center");
    const rIdx = s1Rows.length;
    s1Rows.push(emptyRow);
    s1Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 9 } });
  } else {
    data.purchases.forEach((p, idx) => {
      const isAlt = idx % 2 === 1;
      sumPurchasesS1 += p.totalCost;
      const pRow = new Array(S1_COLS).fill(null);
      pRow[0] = dataTextCell(String(idx + 1), "center", false, isAlt);
      pRow[1] = dataTextCell(p.ethiopianDate, "center", true, isAlt);
      pRow[2] = dataTextCell(p.gregorianDate, "center", false, isAlt);
      pRow[3] = dataTextCell(p.supplierName, "left", true, isAlt);
      pRow[5] = dataTextCell(p.reference || "Direct Receipt", "left", false, isAlt);
      const trsp = Number(p.transportCost) || 0;
      const lbr = Number(p.laborCost) || 0;
      let statusStr = "Received & Restocked";
      if (trsp > 0 || lbr > 0) {
        const parts: string[] = [];
        if (trsp > 0) parts.push(`+${trsp.toLocaleString()} Trsp`);
        if (lbr > 0) parts.push(`+${lbr.toLocaleString()} Lbr`);
        statusStr = parts.join(" | ");
      }
      pRow[8] = dataTextCell(statusStr, "center", false, isAlt);
      pRow[9] = dataNumberCell(p.totalCost, "#,##0.00", true, isAlt);
      const rIdx = s1Rows.length;
      s1Rows.push(pRow);
      s1Merges.push({ s: { r: rIdx, c: 3 }, e: { r: rIdx, c: 4 } });
      s1Merges.push({ s: { r: rIdx, c: 5 }, e: { r: rIdx, c: 7 } });
    });

    const pTotRIdx = s1Rows.length;
    const pTotRow = new Array(S1_COLS).fill(null);
    pTotRow[0] = totalLabelCell("TOTAL PROCUREMENT EXPENSES (ጠቅላላ የግዢ ወጪ ድምር):");
    pTotRow[9] = totalNumberCell(sumPurchasesS1);
    s1Rows.push(pTotRow);
    s1Merges.push({ s: { r: pTotRIdx, c: 0 }, e: { r: pTotRIdx, c: 8 } });
  }
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 6: Top Selling Commodities in Period
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "6. TOP-SELLING COMMODITIES IN PERIOD / በብዛት የተሸጡ እህሎችና ምርቶች",
    "FEF3C7",
    S1_COLS,
    11,
    "left",
    "92400E"
  );

  const topHdrRow = new Array(S1_COLS).fill(null);
  topHdrRow[0] = headerCell("Rank (#)", "D97706");
  topHdrRow[1] = headerCell("Commodity / የእህል ስም", "D97706");
  topHdrRow[4] = headerCell("Volume Sold / የተሸጠ መጠን", "D97706");
  topHdrRow[6] = headerCell("Total Revenue (ETB) / የተገኘ ገቢ", "D97706");
  topHdrRow[8] = headerCell("Revenue Share (%) / ድርሻ", "D97706");
  const topHdrIdx = s1Rows.length;
  s1Rows.push(topHdrRow);
  s1Merges.push({ s: { r: topHdrIdx, c: 1 }, e: { r: topHdrIdx, c: 3 } });
  s1Merges.push({ s: { r: topHdrIdx, c: 4 }, e: { r: topHdrIdx, c: 5 } });
  s1Merges.push({ s: { r: topHdrIdx, c: 6 }, e: { r: topHdrIdx, c: 7 } });
  s1Merges.push({ s: { r: topHdrIdx, c: 8 }, e: { r: topHdrIdx, c: 9 } });

  if (!data.topSelling || data.topSelling.length === 0) {
    const emptyRow = new Array(S1_COLS).fill(null);
    emptyRow[0] = dataTextCell("No sales recorded in this period", "center");
    const rIdx = s1Rows.length;
    s1Rows.push(emptyRow);
    s1Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 9 } });
  } else {
    data.topSelling.forEach((item, idx) => {
      const isAlt = idx % 2 === 1;
      const share = data.totalSalesRevenue > 0 ? (item.revenue / data.totalSalesRevenue) * 100 : 0;
      const topR = new Array(S1_COLS).fill(null);
      topR[0] = dataTextCell(`#${idx + 1}`, "center", true, isAlt);
      topR[1] = dataTextCell(item.name, "left", true, isAlt);
      topR[4] = dataTextCell(item.soldDisplay, "right", false, isAlt);
      topR[6] = dataNumberCell(item.revenue, "#,##0.00", true, isAlt);
      topR[8] = dataTextCell(`${share.toFixed(1)}%`, "center", false, isAlt);
      const curTopIdx = s1Rows.length;
      s1Rows.push(topR);
      s1Merges.push({ s: { r: curTopIdx, c: 1 }, e: { r: curTopIdx, c: 3 } });
      s1Merges.push({ s: { r: curTopIdx, c: 4 }, e: { r: curTopIdx, c: 5 } });
      s1Merges.push({ s: { r: curTopIdx, c: 6 }, e: { r: curTopIdx, c: 7 } });
      s1Merges.push({ s: { r: curTopIdx, c: 8 }, e: { r: curTopIdx, c: 9 } });
    });
  }
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 7: Supplier Procurement Expenses Breakdown
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "7. SUPPLIER PROCUREMENT EXPENSES BREAKDOWN / የአቅራቢዎች የግዢ ወጪ ድርሻ",
    "DBEAFE",
    S1_COLS,
    11,
    "left",
    "1E40AF"
  );

  const supHdrRow = new Array(S1_COLS).fill(null);
  supHdrRow[0] = headerCell("No.", "2563EB");
  supHdrRow[1] = headerCell("Supplier / Cooperative / አቅራቢ", "2563EB");
  supHdrRow[4] = headerCell("Shipments / የጭነት ብዛት", "2563EB");
  supHdrRow[6] = headerCell("Total Cost (ETB) / ጠቅላላ ወጪ", "2563EB");
  supHdrRow[8] = headerCell("Procurement Share (%) / ድርሻ", "2563EB");
  const supHdrIdx = s1Rows.length;
  s1Rows.push(supHdrRow);
  s1Merges.push({ s: { r: supHdrIdx, c: 1 }, e: { r: supHdrIdx, c: 3 } });
  s1Merges.push({ s: { r: supHdrIdx, c: 4 }, e: { r: supHdrIdx, c: 5 } });
  s1Merges.push({ s: { r: supHdrIdx, c: 6 }, e: { r: supHdrIdx, c: 7 } });
  s1Merges.push({ s: { r: supHdrIdx, c: 8 }, e: { r: supHdrIdx, c: 9 } });

  if (!data.supplierSpending || data.supplierSpending.length === 0) {
    const emptyRow = new Array(S1_COLS).fill(null);
    emptyRow[0] = dataTextCell("No purchases recorded in this period", "center");
    const rIdx = s1Rows.length;
    s1Rows.push(emptyRow);
    s1Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 9 } });
  } else {
    data.supplierSpending.forEach((sup, idx) => {
      const isAlt = idx % 2 === 1;
      const share = data.totalPurchasesCost > 0 ? (sup.totalCost / data.totalPurchasesCost) * 100 : 0;
      const supR = new Array(S1_COLS).fill(null);
      supR[0] = dataTextCell(String(idx + 1), "center", false, isAlt);
      supR[1] = dataTextCell(sup.name, "left", true, isAlt);
      supR[4] = dataTextCell(`${sup.shipments} shipments`, "center", false, isAlt);
      supR[6] = dataNumberCell(sup.totalCost, "#,##0.00", true, isAlt);
      supR[8] = dataTextCell(`${share.toFixed(1)}%`, "center", false, isAlt);
      const curSupIdx = s1Rows.length;
      s1Rows.push(supR);
      s1Merges.push({ s: { r: curSupIdx, c: 1 }, e: { r: curSupIdx, c: 3 } });
      s1Merges.push({ s: { r: curSupIdx, c: 4 }, e: { r: curSupIdx, c: 5 } });
      s1Merges.push({ s: { r: curSupIdx, c: 6 }, e: { r: curSupIdx, c: 7 } });
      s1Merges.push({ s: { r: curSupIdx, c: 8 }, e: { r: curSupIdx, c: 9 } });
    });
  }
  s1Rows.push([]);

  // -------------------------------------------------------------
  // Section 8: Official Verification & Authorization Sign-Off
  // -------------------------------------------------------------
  addMergedBanner(
    s1Rows,
    s1Merges,
    "8. OFFICIAL MANAGEMENT VERIFICATION & AUTHORIZATION / ይፋዊ ማረጋገጫና ፊርማ",
    "F3F4F6",
    S1_COLS,
    10,
    "center",
    "374151"
  );

  const signRow1 = new Array(S1_COLS).fill(null);
  signRow1[0] = dataTextCell("Prepared By: __________________________", "left", true);
  signRow1[4] = dataTextCell("Approved By: __________________________", "left", true);
  signRow1[7] = dataTextCell("Store Stamp & Date: ___________________", "left", true);
  const sR1Idx = s1Rows.length;
  s1Rows.push(signRow1);
  s1Merges.push({ s: { r: sR1Idx, c: 0 }, e: { r: sR1Idx, c: 3 } });
  s1Merges.push({ s: { r: sR1Idx, c: 4 }, e: { r: sR1Idx, c: 6 } });
  s1Merges.push({ s: { r: sR1Idx, c: 7 }, e: { r: sR1Idx, c: 9 } });

  const ws1 = XLSX.utils.aoa_to_sheet(s1Rows);
  ws1["!merges"] = s1Merges;
  ws1["!cols"] = [
    { wch: 6 },   // Col 0: No. / Rank
    { wch: 32 },  // Col 1: Name / Commodity / Metric
    { wch: 22 },  // Col 2: Category / Phone / Gregorian Date
    { wch: 22 },  // Col 3: Invoice # / Physical Stock / Amount
    { wch: 20 },  // Col 4: Unit Cost / Issue Date / Volume / Prepared By
    { wch: 20 },  // Col 5: Unit Selling / Due Date / Method / Ref
    { wch: 20 },  // Col 6: Margin / Credit Given / Revenue
    { wch: 22 },  // Col 7: Stock at Cost / Paid / Share
    { wch: 22 },  // Col 8: Stock at Retail / Remaining / Status
    { wch: 24 },  // Col 9: Total ETB / Status / Stamp
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Master Business Audit");

  // =============================================================
  // 2. SHEET 2: SALES LEDGER (የሽያጭ ዝርዝር ደረሰኞች)
  // =============================================================
  const s2Rows: any[][] = [];
  const s2Merges: XLSX.Range[] = [];
  addMergedBanner(
    s2Rows,
    s2Merges,
    "ITEMIZED SALES TRANSACTIONS LEDGER / የተከናወኑ የሽያጭ ደረሰኞች ዝርዝር",
    "059669",
    8,
    12,
    "center"
  );
  addMergedBanner(
    s2Rows,
    s2Merges,
    `Period: ${data.reportPeriodEthiopian}  [${data.reportPeriodGregorian}]  •  Total Sales: ${data.sales.length} Invoices`,
    "065F46",
    8,
    10,
    "center"
  );
  s2Rows.push([]);

  s2Rows.push([
    headerCell("No.", "047857"),
    headerCell("Date (የኢትዮጵያ ቀን)", "047857"),
    headerCell("Gregorian Date", "047857"),
    headerCell("Invoice # / ደረሰኝ", "047857"),
    headerCell("Customer Name / ደንበኛ", "047857"),
    headerCell("Payment Method / አከፋፈል", "047857"),
    headerCell("Commodities & Quantities Sold / የተሸጡ እህሎች", "047857"),
    headerCell("Total Amount (ETB) / ጠቅላላ ብር", "047857"),
  ]);

  let sumSalesS2 = 0;
  data.sales.forEach((s, idx) => {
    const isAlt = idx % 2 === 1;
    sumSalesS2 += s.totalAmount;
    s2Rows.push([
      dataTextCell(String(idx + 1), "center", false, isAlt),
      dataTextCell(s.ethiopianDate, "center", true, isAlt),
      dataTextCell(s.gregorianDate, "center", false, isAlt),
      dataTextCell(s.invoiceNumber, "center", true, isAlt),
      dataTextCell(s.customerName, "left", false, isAlt),
      dataTextCell(s.paymentMethod.toUpperCase(), "center", false, isAlt),
      dataTextCell(s.itemsSummary || "-", "left", false, isAlt),
      dataNumberCell(s.totalAmount, "#,##0.00", true, isAlt),
    ]);
  });

  const s2TotR = s2Rows.length;
  const s2TotRow = new Array(8).fill(null);
  s2TotRow[0] = totalLabelCell("TOTAL SALES REVENUE (ጠቅላላ የተገኘ የሽያጭ ገቢ):");
  s2TotRow[7] = totalNumberCell(sumSalesS2);
  s2Rows.push(s2TotRow);
  s2Merges.push({ s: { r: s2TotR, c: 0 }, e: { r: s2TotR, c: 6 } });

  const ws2 = XLSX.utils.aoa_to_sheet(s2Rows);
  ws2["!merges"] = s2Merges;
  ws2["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 42 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Sales Ledger");

  // =============================================================
  // 3. SHEET 3: INVENTORY & PRICES (የእያንዳንዱ እህል ክምችትና ዋጋ)
  // =============================================================
  const s3Rows: any[][] = [];
  const s3Merges: XLSX.Range[] = [];
  addMergedBanner(
    s3Rows,
    s3Merges,
    "WAREHOUSE INVENTORY, STOCK LEVELS & PRICING AUDIT / የመጋዘን ክምችት፣ የመሸጫና የግዢ ዋጋ ኦዲት",
    "7C3AED",
    12,
    12,
    "center"
  );
  addMergedBanner(
    s3Rows,
    s3Merges,
    `As of Date: ${data.generatedDateEthiopian}  [${data.generatedDateGregorian}]  •  Total Commodities: ${data.inventory.length}`,
    "5B21B6",
    12,
    10,
    "center"
  );
  s3Rows.push([]);

  s3Rows.push([
    headerCell("No.", "6D28D9"),
    headerCell("Commodity Name / የእህል ስም", "6D28D9"),
    headerCell("Category / ምድብ", "6D28D9"),
    headerCell("Physical Stock / ያለ ክምችት", "6D28D9"),
    headerCell("Unit Cost Price (ETB) / መግዣ", "6D28D9"),
    headerCell("Unit Selling Price (ETB) / መሸጫ", "6D28D9"),
    headerCell("Gross Margin (ETB) / ትርፍ", "6D28D9"),
    headerCell("Margin (%)", "6D28D9"),
    headerCell("Valuation at Cost (ETB) / በግዢ ዋጋ", "6D28D9"),
    headerCell("Valuation at Retail (ETB) / በመሸጫ", "6D28D9"),
    headerCell("Unrealized Profit (ETB)", "6D28D9"),
    headerCell("Stock Status / ሁኔታ", "6D28D9"),
  ]);

  let sumValCost = 0;
  let sumValSelling = 0;
  let sumUnrealized = 0;

  data.inventory.forEach((inv, idx) => {
    const isAlt = idx % 2 === 1;
    sumValCost += inv.valuationAtCostETB;
    sumValSelling += inv.valuationAtSellingETB;
    sumUnrealized += inv.unrealizedProfitETB;

    s3Rows.push([
      dataTextCell(String(idx + 1), "center", false, isAlt),
      dataTextCell(inv.name, "left", true, isAlt),
      dataTextCell(inv.category, "left", false, isAlt),
      dataTextCell(inv.currentStockDisplay, "right", true, isAlt),
      dataNumberCell(inv.unitCostPrice, "#,##0.00", false, isAlt),
      dataNumberCell(inv.unitSellingPrice, "#,##0.00", false, isAlt),
      dataNumberCell(inv.marginETB, "#,##0.00", false, isAlt),
      dataTextCell(`${inv.marginPercent.toFixed(1)}%`, "center", false, isAlt),
      dataNumberCell(inv.valuationAtCostETB, "#,##0.00", true, isAlt),
      dataNumberCell(inv.valuationAtSellingETB, "#,##0.00", true, isAlt),
      dataNumberCell(inv.unrealizedProfitETB, "#,##0.00", true, isAlt),
      dataTextCell(inv.status, "center", false, isAlt),
    ]);
  });

  const s3TotR = s3Rows.length;
  const s3TotRow = new Array(12).fill(null);
  s3TotRow[0] = totalLabelCell("TOTAL WAREHOUSE INVENTORY VALUATION (ጠቅላላ የክምችት ዋጋ ድምር):");
  s3TotRow[8] = totalNumberCell(sumValCost);
  s3TotRow[9] = totalNumberCell(sumValSelling);
  s3TotRow[10] = totalNumberCell(sumUnrealized);
  s3TotRow[11] = totalLabelCell("");
  s3Rows.push(s3TotRow);
  s3Merges.push({ s: { r: s3TotR, c: 0 }, e: { r: s3TotR, c: 7 } });

  const ws3 = XLSX.utils.aoa_to_sheet(s3Rows);
  ws3["!merges"] = s3Merges;
  ws3["!cols"] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 25 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Inventory & Prices");

  // =============================================================
  // 4. SHEET 4: CUSTOMER CREDITS (የደንበኞች ብድር መዝገብ)
  // =============================================================
  const s4Rows: any[][] = [];
  const s4Merges: XLSX.Range[] = [];
  addMergedBanner(
    s4Rows,
    s4Merges,
    "CUSTOMER CREDIT & OUTSTANDING DEBT LEDGER / የደንበኞች ብድር እና ቀሪ እዳ መዝገብ",
    "EA580C",
    11,
    12,
    "center"
  );
  addMergedBanner(
    s4Rows,
    s4Merges,
    `Total Outstanding Receivables: ${data.creditOutstanding.toLocaleString()} ETB  •  Total Collected: ${data.creditCollected.toLocaleString()} ETB`,
    "9A3412",
    11,
    10,
    "center"
  );
  s4Rows.push([]);

  s4Rows.push([
    headerCell("No.", "C2410C"),
    headerCell("Customer Name / ደንበኛ", "C2410C"),
    headerCell("Phone / ስልክ", "C2410C"),
    headerCell("Invoice Ref / ደረሰኝ", "C2410C"),
    headerCell("Credit Date (የተሰጠበት ቀን)", "C2410C"),
    headerCell("Gregorian Date", "C2410C"),
    headerCell("Due Date (መክፈያ ቀን)", "C2410C"),
    headerCell("Credit Given (ETB) / የተሰጠ", "C2410C"),
    headerCell("Amount Paid (ETB) / የተከፈለ", "C2410C"),
    headerCell("Remaining Debt (ETB) / ቀሪ እዳ", "C2410C"),
    headerCell("Status / ሁኔታ", "C2410C"),
  ]);

  let sumCredS4Given = 0;
  let sumCredS4Paid = 0;
  let sumCredS4Remaining = 0;

  if (!data.credits || data.credits.length === 0) {
    const emptyRow = new Array(11).fill(null);
    emptyRow[0] = dataTextCell("No active customer credit records found", "center");
    const rIdx = s4Rows.length;
    s4Rows.push(emptyRow);
    s4Merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx, c: 10 } });
  } else {
    data.credits.forEach((c, idx) => {
      const isAlt = idx % 2 === 1;
      sumCredS4Given += c.totalCreditAmount;
      sumCredS4Paid += c.paidAmount;
      sumCredS4Remaining += c.remainingBalance;

      s4Rows.push([
        dataTextCell(String(idx + 1), "center", false, isAlt),
        dataTextCell(c.customerName, "left", true, isAlt),
        dataTextCell(c.customerPhone || "-", "center", false, isAlt),
        dataTextCell(c.invoiceNumber || "-", "center", false, isAlt),
        dataTextCell(c.ethiopianDate, "center", false, isAlt),
        dataTextCell(c.gregorianDate || "-", "center", false, isAlt),
        dataTextCell(c.ethiopianDueDate || "-", "center", false, isAlt),
        dataNumberCell(c.totalCreditAmount, "#,##0.00", true, isAlt),
        dataNumberCell(c.paidAmount, "#,##0.00", false, isAlt),
        dataNumberCell(c.remainingBalance, "#,##0.00", true, isAlt),
        dataTextCell(c.status, "center", true, isAlt),
      ]);
    });

    const s4TotR = s4Rows.length;
    const s4TotRow = new Array(11).fill(null);
    s4TotRow[0] = totalLabelCell("TOTAL CUSTOMER CREDIT ACCOUNTS (ጠቅላላ የብድር ሂሳብ ድምር):");
    s4TotRow[7] = totalNumberCell(sumCredS4Given);
    s4TotRow[8] = totalNumberCell(sumCredS4Paid);
    s4TotRow[9] = totalNumberCell(sumCredS4Remaining);
    s4TotRow[10] = totalLabelCell("");
    s4Rows.push(s4TotRow);
    s4Merges.push({ s: { r: s4TotR, c: 0 }, e: { r: s4TotR, c: 6 } });
  }

  const ws4 = XLSX.utils.aoa_to_sheet(s4Rows);
  ws4["!merges"] = s4Merges;
  ws4["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, "Customer Credits");

  // =============================================================
  // 5. SHEET 5: PURCHASES & DELIVERIES (የአቅራቢዎች ጭነት ዝርዝር)
  // =============================================================
  const s5Rows: any[][] = [];
  const s5Merges: XLSX.Range[] = [];
  addMergedBanner(
    s5Rows,
    s5Merges,
    "ITEMIZED PROCUREMENT & RESTOCKING SHIPMENTS / የገቡ የግዢ ጭነቶች ዝርዝር",
    "2563EB",
    9,
    12,
    "center"
  );
  addMergedBanner(
    s5Rows,
    s5Merges,
    `Period: ${data.reportPeriodEthiopian}  [${data.reportPeriodGregorian}]  •  Total Shipments: ${data.purchases.length}`,
    "1E40AF",
    9,
    10,
    "center"
  );
  s5Rows.push([]);

  s5Rows.push([
    headerCell("No.", "1D4ED8"),
    headerCell("Date (የኢትዮጵያ ቀን)", "1D4ED8"),
    headerCell("Gregorian Date", "1D4ED8"),
    headerCell("Supplier / Cooperative / አቅራቢ", "1D4ED8"),
    headerCell("Waybill / Invoice Ref / ማመሳከሪያ", "1D4ED8"),
    headerCell("Goods Subtotal (ETB) / የእቃዎች ዋጋ", "1D4ED8"),
    headerCell("Transport (ETB) / ትራንስፖርት", "1D4ED8"),
    headerCell("Labor (ETB) / የማውረጃ (ኩሊ)", "1D4ED8"),
    headerCell("Total Landed Cost (ETB) / ጠቅላላ ወጪ", "1D4ED8"),
  ]);

  let sumGoodsCostS5 = 0;
  let sumTransportS5 = 0;
  let sumLaborS5 = 0;
  let sumPurchasesS5 = 0;

  data.purchases.forEach((p, idx) => {
    const isAlt = idx % 2 === 1;
    const trsp = Number(p.transportCost) || 0;
    const lbr = Number(p.laborCost) || 0;
    const goods = Number(p.itemsCost) !== undefined ? Number(p.itemsCost) : Math.max(0, p.totalCost - trsp - lbr);

    sumGoodsCostS5 += goods;
    sumTransportS5 += trsp;
    sumLaborS5 += lbr;
    sumPurchasesS5 += p.totalCost;

    s5Rows.push([
      dataTextCell(String(idx + 1), "center", false, isAlt),
      dataTextCell(p.ethiopianDate, "center", true, isAlt),
      dataTextCell(p.gregorianDate, "center", false, isAlt),
      dataTextCell(p.supplierName, "left", true, isAlt),
      dataTextCell(p.reference || "Direct Receipt", "left", false, isAlt),
      dataNumberCell(goods, "#,##0.00", false, isAlt),
      dataNumberCell(trsp, "#,##0.00", false, isAlt),
      dataNumberCell(lbr, "#,##0.00", false, isAlt),
      dataNumberCell(p.totalCost, "#,##0.00", true, isAlt),
    ]);
  });

  const s5TotR = s5Rows.length;
  const s5TotRow = new Array(9).fill(null);
  s5TotRow[0] = totalLabelCell("TOTAL PROCUREMENT & LOGISTICS EXPENSES (ጠቅላላ የግዢና የማጓጓዣ ወጪ):");
  s5TotRow[5] = totalNumberCell(sumGoodsCostS5);
  s5TotRow[6] = totalNumberCell(sumTransportS5);
  s5TotRow[7] = totalNumberCell(sumLaborS5);
  s5TotRow[8] = totalNumberCell(sumPurchasesS5);
  s5Rows.push(s5TotRow);
  s5Merges.push({ s: { r: s5TotR, c: 0 }, e: { r: s5TotR, c: 4 } });

  const ws5 = XLSX.utils.aoa_to_sheet(s5Rows);
  ws5["!merges"] = s5Merges;
  ws5["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 15 },
    { wch: 32 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, "Supplier Deliveries");

  // -------------------------------------------------------------
  // TRIGGER DOWNLOAD IN BROWSER
  // -------------------------------------------------------------
  const cleanFilename = `${filenamePrefix}_${data.reportPeriodGregorian.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}
