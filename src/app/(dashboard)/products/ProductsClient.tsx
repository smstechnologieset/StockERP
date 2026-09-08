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
  Trash2,
  Archive,
  ArchiveRestore,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { formatETB, formatQuantity } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { deleteProductAction, toggleProductStatusAction } from "@/app/actions/products";
import type { Product, Unit } from "@/types/database";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const { t, isAmharic } = useLanguage();
  const [data, setData] = useState(initialProducts);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter categories and status
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (statusFilter === "active" && !item.is_active) return false;
      if (statusFilter === "archived" && item.is_active) return false;
      return true;
    });
  }, [data, selectedCategory, statusFilter]);

  async function handleToggleStatus(product: Product) {
    const nextStatus = !product.is_active;
    const res = await toggleProductStatusAction(product.id, nextStatus);
    if (res.success) {
      setData((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: nextStatus } : p))
      );
      setNotice(nextStatus ? `Product "${product.name}" restored.` : `Product "${product.name}" archived.`);
      setTimeout(() => setNotice(null), 4000);
      router.refresh();
    }
  }

  async function handleConfirmDelete() {
    if (!productToDelete) return;
    setDeleting(true);
    const res = await deleteProductAction(productToDelete.id);
    if (res.success) {
      if (res.archived) {
        setData((prev) =>
          prev.map((p) => (p.id === productToDelete.id ? { ...p, is_active: false } : p))
        );
      } else {
        setData((prev) => prev.filter((p) => p.id !== productToDelete.id));
      }
      setNotice(res.message || "Action completed.");
      setTimeout(() => setNotice(null), 4000);
      setProductToDelete(null);
      router.refresh();
    }
    setDeleting(false);
  }

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
          const product = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingProduct(product);
                  setModalOpen(true);
                }}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                title="Edit product details"
              >
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleStatus(product)}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                title={product.is_active ? "Archive product" : "Restore product"}
              >
                {product.is_active ? (
                  <Archive className="h-3.5 w-3.5 text-amber-600" />
                ) : (
                  <ArchiveRestore className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProductToDelete(product)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                title="Delete or safe-archive commodity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [isManager, data]
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
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Wheat className="h-7 w-7 text-amber-600" />
            {t("nav_products")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAmharic
              ? "የእህል፣ የዱቄትና የቅመማ ቅመም ዝርዝር መዝገብ፣ ዋጋ እና ዝቅተኛ የክምችት መጠን ማስጠንቀቂያ"
              : "Master catalog of whole grains, powdered spices, pulses, and pricing normalized to grams."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/products/pricing">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-amber-600/30">
              <Tag className="h-3.5 w-3.5 text-amber-600" />
              {t("nav_pricing")}
            </Button>
          </Link>
          {isManager && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs"
            >
              <Plus className="h-4 w-4" /> {t("btn_add_product")}
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg">
          {notice}
        </div>
      )}

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
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Category & Status Filter */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 text-xs">
                <Button
                  variant={statusFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                  className="h-8 text-xs"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "archived" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("archived")}
                  className="h-8 text-xs"
                >
                  Archived
                </Button>
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="h-8 text-xs"
                >
                  {t("btn_all")}
                </Button>
              </div>

              <Filter className="h-4 w-4 text-muted-foreground ml-2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
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

      {/* Delete / Archive Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="max-w-md" onClose={() => setProductToDelete(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete / Archive Commodity
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{productToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-muted-foreground p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <p className="font-semibold text-foreground">Audit Protection Rule:</p>
            <p>
              If this commodity already has historical sales invoices or inventory ledger movements, the system will <strong>safely archive</strong> it (hiding it from POS sales) rather than permanently deleting it. This protects your financial and inventory records.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={deleting}
            >
              {t("btn_cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Confirm Removal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
