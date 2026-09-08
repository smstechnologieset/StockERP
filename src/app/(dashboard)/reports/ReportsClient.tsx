"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Boxes,
  Users,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatETB, formatQuantity } from "@/lib/utils";
import Link from "next/link";

interface ReportsClientProps {
  revenueDaily: { date: string; revenue: number; orders: number }[];
  categoryValuation: { name: string; value: number; color: string }[];
  topSelling: { name: string; soldGrams: number; soldDisplay: string; revenue: number }[];
  supplierBreakdown: { name: string; totalCost: number; shipments: number }[];
  lowStockItems: any[];
}

export function ReportsClient({
  revenueDaily,
  categoryValuation,
  topSelling,
  supplierBreakdown,
  lowStockItems,
}: ReportsClientProps) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  const totalRevenue = revenueDaily.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalValuation = categoryValuation.reduce((acc, curr) => acc + curr.value, 0);
  const totalPurchases = supplierBreakdown.reduce((acc, curr) => acc + curr.totalCost, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Management Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Business intelligence for sales revenue, inventory valuation, commodity demand, and supplier spending.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1">
          <Button
            size="sm"
            variant={timeRange === "day" ? "default" : "ghost"}
            onClick={() => setTimeRange("day")}
            className="text-xs h-7"
          >
            Daily
          </Button>
          <Button
            size="sm"
            variant={timeRange === "week" ? "default" : "ghost"}
            onClick={() => setTimeRange("week")}
            className="text-xs h-7"
          >
            Weekly
          </Button>
          <Button
            size="sm"
            variant={timeRange === "month" ? "default" : "ghost"}
            onClick={() => setTimeRange("month")}
            className="text-xs h-7"
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Sales Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatETB(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all payment channels</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Stock Valuation
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {formatETB(totalValuation)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-hand commodities in warehouse</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Supplier Purchases Cost
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatETB(totalPurchases)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total procurement expenses</p>
          </CardContent>
        </Card>

        <Card className={lowStockItems.length > 0 ? "border-red-500/40 bg-red-50/20" : "border"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Low-Stock Warnings
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lowStockItems.length} Products
            </div>
            <p className="text-xs text-muted-foreground mt-1">Action required by manager</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 Charts: Revenue Timeline & Category Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Area Chart (7 cols) */}
        <Card className="lg:col-span-7 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Revenue Timeline ({timeRange.toUpperCase()})
                </CardTitle>
                <CardDescription className="text-xs">
                  Daily POS and wholesale sales revenue in Ethiopian Birr (ETB)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueDaily}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [formatETB(Number(value)), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stock Valuation by Category (5 cols) */}
        <Card className="lg:col-span-5 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              Stock Valuation by Category
            </CardTitle>
            <CardDescription className="text-xs">
              Portfolio distribution of stored inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryValuation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryValuation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatETB(Number(value)), "Valuation"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-xs">
              {categoryValuation.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Selling Products & Supplier Procurement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (6 cols) */}
        <Card className="lg:col-span-6 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              Top-Selling Commodities
            </CardTitle>
            <CardDescription className="text-xs">
              Highest turnover products by sales volume & revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topSelling.map((prod, index) => (
                <div
                  key={prod.name}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 font-bold text-xs text-amber-700">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{prod.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Volume: <span className="font-medium text-foreground">{prod.soldDisplay}</span> ({formatQuantity(prod.soldGrams, "g")})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatETB(prod.revenue)}</div>
                    <span className="text-[11px] text-emerald-600 font-medium">Revenue</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Procurement Cost Breakdown (6 cols) */}
        <Card className="lg:col-span-6 shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              Procurement Cost Breakdown by Supplier
            </CardTitle>
            <CardDescription className="text-xs">
              Expenses distributed across farming cooperatives and wholesalers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {supplierBreakdown.map((sup) => (
                <div
                  key={sup.name}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{sup.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {sup.shipments} Incoming Shipments Logged
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatETB(sup.totalCost)}</div>
                    <span className="text-[11px] text-muted-foreground">Total Spent</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low-Stock Reorder Action Center */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-600/40 bg-gradient-to-r from-amber-500/10 via-card to-card">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Low-Stock Reorder Priority Center
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Grams on hand have reached or dropped below reorder threshold. Generate purchase orders to replenish warehouse stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-3">Commodity</th>
                    <th className="px-6 py-3 text-right">Current On-Hand</th>
                    <th className="px-6 py-3 text-right">Reorder Threshold</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lowStockItems.map((item) => (
                    <tr key={item.product_id} className="hover:bg-muted/20">
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-3 text-right text-red-600 font-bold">
                        {formatQuantity(item.current_stock_default_unit, item.default_unit_symbol)} ({formatQuantity(item.current_stock_base_units, "g")})
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground font-mono text-xs">
                        {formatQuantity(item.reorder_threshold_base_units, "g")}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link href="/purchases/new">
                          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                            Receive Stock
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
