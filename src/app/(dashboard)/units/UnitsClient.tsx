"use client";

import { useState } from "react";
import { Scale, Plus, Edit, Calculator, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitFormModal } from "@/components/units/UnitFormModal";
import type { Unit } from "@/types/database";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface UnitsClientProps {
  initialUnits: Unit[];
  isManager: boolean;
}

export function UnitsClient({ initialUnits, isManager }: UnitsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [units] = useState(initialUnits);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Unit Converter Interactive Tool State
  const [calcQuantity, setCalcQuantity] = useState<number>(1);
  const [calcUnitId, setCalcUnitId] = useState<string>(
    units.find((u) => u.symbol === "q")?.id || units[0]?.id || ""
  );

  const selectedCalcUnit = units.find((u) => u.id === calcUnitId) || units[0];
  const gramsTotal = calcQuantity * (selectedCalcUnit?.conversion_factor || 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl">
            {t("unit_page_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("unit_page_subtitle")}
          </p>
        </div>

        {isManager && (
          <Button
            onClick={() => {
              setEditingUnit(null);
              setModalOpen(true);
            }}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> {t("unit_add_custom")}
          </Button>
        )}
      </div>

      {/* Interactive Unit Conversion Calculator Widget */}
      <Card className="border-amber-600/30 bg-gradient-to-r from-amber-500/10 via-card to-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base font-bold text-foreground">
              {t("unit_calc_title")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            {t("unit_calc_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6">
            <div className="space-y-1.5">
              <Label htmlFor="calcQty">{t("unit_calc_qty")}</Label>
              <Input
                id="calcQty"
                type="number"
                step="any"
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calcUnit">{t("unit_calc_select_unit")}</Label>
              <select
                id="calcUnit"
                value={calcUnitId}
                onChange={(e) => setCalcUnitId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg bg-background p-2.5 border text-center">
              <span className="text-xs text-muted-foreground block">{t("unit_calc_base_grams")}</span>
              <span className="text-lg font-bold font-mono text-amber-600">
                {gramsTotal.toLocaleString()} g
              </span>
            </div>
          </div>

          {/* Grid of All Equivalent Measures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {units.map((u) => {
              const eq = gramsTotal / u.conversion_factor;
              return (
                <div
                  key={u.id}
                  className="rounded-lg border bg-background/80 p-2.5 text-center shadow-xs"
                >
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {u.name}
                  </span>
                  <span className="text-sm font-bold font-mono text-foreground">
                    {Number(eq.toFixed(3)).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    {u.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card className="shadow-sm border">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">{t("unit_math_card_title")}</CardTitle>
          <CardDescription className="text-xs">
            {t("unit_math_card_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-3.5">{t("unit_name_col")}</th>
                  <th className="px-6 py-3.5">{t("unit_symbol_col")}</th>
                  <th className="px-6 py-3.5 text-right">{t("unit_factor_col")}</th>
                  <th className="px-6 py-3.5 text-center">{t("common_status")}</th>
                  <th className="px-6 py-3.5 text-right">{t("common_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {u.symbol}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-foreground">
                      1 {u.symbol} = {Number(u.conversion_factor).toLocaleString()} g
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.is_base_unit ? (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> {t("unit_base_badge")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          {u.name}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isManager && !u.is_base_unit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUnit(u);
                            setModalOpen(true);
                          }}
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> {t("btn_edit")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <UnitFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        unitToEdit={editingUnit}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

