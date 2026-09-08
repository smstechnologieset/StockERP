"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Wheat,
  Plus,
  Search,
  Edit,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { formatETB, formatQuantity } from "@/lib/utils";
import type { Product, Unit } from "@/types/database";
import { useRouter } from "next/navigation";

interface ProductsClientProps {
  initialProducts: (Product & { default_unit?: Unit })[];
  units: Unit[];
  isManager: boolean;
}

const columnHelper = createColumnHelper<Product & { default_unit?: Unit }>();

export function ProductsClient({
  initialProducts,
  units,
  isManager,
}: ProductsClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialProducts);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filter categories
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [data, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(data.map((d) => d.category));
    return Array.from(set);
  }, [data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold text-foreground hover:text-amber-600 transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Commodity Name
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: (info) => (
          <div>
            <div className="font-semibold text-foreground">{info.getValue()}</div>
            {info.row.original.code && (
              <span className="text-[11px] font-mono text-muted-foreground">
                SKU: {info.row.original.code}
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => (
          <Badge variant="secondary" className="text-xs">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("default_unit", {
        header: "Default Unit",
        cell: (info) => {
          const unit = info.getValue();
          return (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{unit?.name || "Unit"}</span>{" "}
              ({unit?.symbol})
            </div>
          );
        },
      }),
      columnHelper.accessor("cost_price_per_base_unit", {
        header: "Cost Price (ETB)",
        cell: (info) => {
          const unit = info.row.original.default_unit;
          const factor = unit?.conversion_factor || 1;
          const priceInUnit = info.getValue() * factor;
          return (
            <div>
              <div className="font-medium text-foreground">
                {formatETB(priceInUnit)}
                <span className="text-[11px] text-muted-foreground"> / {unit?.symbol || "unit"}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {formatETB(info.getValue())} / g
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("selling_price_per_base_unit", {
        header: "Selling Price (ETB)",
        cell: (info) => {
          const unit = info.row.original.default_unit;
          const factor = unit?.conversion_factor || 1;
          const priceInUnit = info.getValue() * factor;
          return (
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-300">
                {formatETB(priceInUnit)}
                <span className="text-[11px] text-muted-foreground font-normal"> / {unit?.symbol || "unit"}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {formatETB(info.getValue())} / g
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("reorder_threshold_base_units", {
        header: "Reorder Alert",
        cell: (info) => {
          const unit = info.row.original.default_unit;
          const factor = unit?.conversion_factor || 1;
          const thresholdInUnit = info.getValue() / factor;
          return (
            <div>
              <span className="font-medium text-foreground">
                {formatQuantity(thresholdInUnit, unit?.symbol)}
              </span>
              <div className="text-[10px] text-muted-foreground font-mono">
                {formatQuantity(info.getValue(), "g")}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => (
          <Badge
            variant={info.getValue() ? "success" : "outline"}
            className="text-[10px]"
          >
            {info.getValue() ? "Active" : "Archived"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          if (!isManager) return null;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingProduct(info.row.original);
                setModalOpen(true);
              }}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          );
        },
      }),
    ],
    [isManager]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Commodity Products & Pricing
          </h1>
          <p className="text-sm text-muted-foreground">
            Master catalog of whole grains, powdered spices, pulses, and pricing normalized to grams.
          </p>
        </div>

        {isManager && (
          <Button
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">All Categories ({data.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-3.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No commodities found. Click "Add Product" to create your first commodity item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-xs text-muted-foreground">
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                filteredData.length
              )}{" "}
              of {filteredData.length} items
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <ProductFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        units={units}
        productToEdit={editingProduct}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
