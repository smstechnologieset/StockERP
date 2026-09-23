"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit,
  FileText,
  Trash2,
  Archive,
  ArchiveRestore,
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
import { SupplierFormModal } from "@/components/suppliers/SupplierFormModal";
import type { Supplier } from "@/types/database";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { deleteSupplierAction, toggleSupplierStatusAction } from "@/app/actions/suppliers";

interface SuppliersClientProps {
  initialSuppliers: Supplier[];
  isManager: boolean;
}

export function SuppliersClient({
  initialSuppliers,
  isManager,
}: SuppliersClientProps) {
  const router = useRouter();
  const { t, isAmharic, language } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Sync state whenever server revalidates
  useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "archived" && s.is_active) return false;

      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    });
  }, [suppliers, search, statusFilter]);

  async function handleToggleStatus(supplier: Supplier) {
    const nextStatus = !supplier.is_active;
    const res = await toggleSupplierStatusAction(supplier.id, nextStatus);
    if (res.success) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? { ...s, is_active: nextStatus } : s))
      );
      setNotice(
        nextStatus
          ? language === "am" ? `አቅራቢ "${supplier.name}" ዳግም እንዲሰራ ተደርጓል።` : `Supplier "${supplier.name}" restored.`
          : language === "am" ? `አቅራቢ "${supplier.name}" ታግዷል።` : `Supplier "${supplier.name}" archived.`
      );
      setTimeout(() => setNotice(null), 4000);
      router.refresh();
    }
  }

  async function handleConfirmDelete() {
    if (!supplierToDelete) return;
    setDeleting(true);
    const res = await deleteSupplierAction(supplierToDelete.id);
    if (res.success) {
      if (res.archived) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === supplierToDelete.id ? { ...s, is_active: false } : s))
        );
      } else {
        setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
      }
      setNotice(res.message || (language === "am" ? "ተግባሩ ተጠናቋል።" : "Action completed."));
      setTimeout(() => setNotice(null), 4500);
      setSupplierToDelete(null);
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-600" />
            {t("sup_page_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("sup_page_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/purchases/new">
            <Button variant="outline" size="sm" className="border-amber-600/30 text-amber-900 dark:text-amber-300">
              {t("sup_receive_shipment")}
            </Button>
          </Link>
          {isManager && (
            <Button
              onClick={() => {
                setEditingSupplier(null);
                setModalOpen(true);
              }}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" /> {t("btn_add_supplier")}
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("sup_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1 text-xs">
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className="h-8 text-xs"
              >
                {t("btn_active")}
              </Button>
              <Button
                variant={statusFilter === "archived" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("archived")}
                className="h-8 text-xs"
              >
                {t("btn_archived")}
              </Button>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8 text-xs"
              >
                {t("btn_all")} ({suppliers.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier) => (
          <Card
            key={supplier.id}
            className="hover:border-amber-600/40 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base text-foreground font-semibold">
                    {supplier.name}
                  </CardTitle>
                  {supplier.contact_person && (
                    <CardDescription className="text-xs mt-0.5">
                      {t("sup_contact_col")}: {supplier.contact_person}
                    </CardDescription>
                  )}
                </div>
                <Badge
                  variant={supplier.is_active ? "success" : "outline"}
                  className="text-[10px]"
                >
                  {supplier.is_active ? t("prod_active") : t("prod_archived")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5 text-xs text-muted-foreground pb-4">
              {supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <a
                    href={`tel:${supplier.phone}`}
                    className="hover:underline font-mono text-foreground"
                  >
                    {supplier.phone}
                  </a>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{supplier.address}</span>
                </div>
              )}

              {supplier.notes && (
                <div className="flex items-start gap-2 pt-1 border-t text-[11px] italic">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{supplier.notes}</span>
                </div>
              )}
            </CardContent>

            <div className="flex items-center justify-between border-t px-4 py-2.5 bg-muted/20 rounded-b-xl gap-2">
              <Link
                href={`/purchases?supplierId=${supplier.id}`}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
              >
                {t("purch_history_table")}
              </Link>

              {isManager && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setModalOpen(true);
                    }}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title={t("btn_edit")}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> {t("btn_edit")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(supplier)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title={supplier.is_active ? "Archive supplier" : "Restore supplier"}
                  >
                    {supplier.is_active ? (
                      <Archive className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <ArchiveRestore className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSupplierToDelete(supplier)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                    title={t("sup_delete_title")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {t("sup_table_desc")}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <SupplierFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        supplierToEdit={editingSupplier}
        onSuccess={() => router.refresh()}
      />

      {/* Delete / Archive Confirmation Dialog */}
      <Dialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <DialogContent className="max-w-md" onClose={() => setSupplierToDelete(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t("sup_delete_title")}
            </DialogTitle>
            <DialogDescription>
              {t("sup_delete_desc")}: <strong>{supplierToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-muted-foreground p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <p className="font-semibold text-foreground">Audit Protection Rule:</p>
            <p>{t("sup_delete_audit_rule")}</p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setSupplierToDelete(null)}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("btn_processing")}
                </>
              ) : (
                t("btn_confirm_removal")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


