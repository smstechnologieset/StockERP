"use client";

import { useState, useMemo } from "react";
import { Users, Plus, Search, Phone, MapPin, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SupplierFormModal } from "@/components/suppliers/SupplierFormModal";
import type { Supplier } from "@/types/database";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SuppliersClientProps {
  initialSuppliers: Supplier[];
  isManager: boolean;
}

export function SuppliersClient({
  initialSuppliers,
  isManager,
}: SuppliersClientProps) {
  const router = useRouter();
  const [suppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    });
  }, [suppliers, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            Suppliers & Farmers
          </h1>
          <p className="text-sm text-muted-foreground">
            Directory of grain producers, farmers' unions, and spice wholesalers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/purchases/new">
            <Button variant="outline" size="sm" className="border-amber-600/30 text-amber-900 dark:text-amber-300">
              Receive Shipment
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
              <Plus className="h-4 w-4" /> Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <Card className="border">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vendor name, contact, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
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
                      Contact: {supplier.contact_person}
                    </CardDescription>
                  )}
                </div>
                <Badge
                  variant={supplier.is_active ? "success" : "outline"}
                  className="text-[10px]"
                >
                  {supplier.is_active ? "Active" : "Archived"}
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

            <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/20 rounded-b-xl">
              <Link
                href={`/purchases?supplierId=${supplier.id}`}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
              >
                View Shipments
              </Link>
              {isManager && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingSupplier(supplier);
                    setModalOpen(true);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
              )}
            </div>
          </Card>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No suppliers match your search. Click "Add Supplier" to add one.
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
    </div>
  );
}
