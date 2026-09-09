"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog,
  ShieldCheck,
  UserCheck,
  Search,
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Edit,
  Trash2,
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
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { updateUserRoleAction, deleteUserAccountAction, getUsersAction } from "@/app/actions/users";
import { UserFormModal } from "@/components/users/UserFormModal";
import type { Profile, AppRole } from "@/types/database";

interface UsersClientProps {
  initialUsers: (Profile & { email?: string; branch_name?: string })[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const { t, isAmharic } = useLanguage();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(Profile & { email?: string }) | null>(null);

  // Delete Dialog State
  const [userToDelete, setUserToDelete] = useState<(Profile & { email?: string }) | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  async function refreshUsers() {
    const res = await getUsersAction();
    if (res.success && res.data.length > 0) {
      setUsers(res.data);
    }
    router.refresh();
  }

  async function handleToggleRole(user: Profile) {
    const nextRole: AppRole = user.role === "owner_manager" ? "staff" : "owner_manager";
    setUpdatingId(user.id);
    setNotice(null);
    setErrorNotice(null);

    const res = await updateUserRoleAction(user.id, nextRole);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      setNotice(
        isAmharic
          ? `የ${user.full_name} የስራ ድርሻ ወደ ${nextRole === "owner_manager" ? "ስራ አስኪያጅ" : "ሰራተኛ"} ተቀይሯል።`
          : `Updated role for ${user.full_name} to ${nextRole === "owner_manager" ? "Owner / Manager" : "Staff"}.`
      );
      setTimeout(() => setNotice(null), 4000);
      router.refresh();
    } else {
      setErrorNotice(res.error || (isAmharic ? "የስራ ድርሻ መቀየር አልተቻለም።" : "Failed to update role."));
    }
    setUpdatingId(null);
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    setErrorNotice(null);

    const res = await deleteUserAccountAction(userToDelete.id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setNotice(
        isAmharic
          ? `የ${userToDelete.full_name} መለያ በተሳካ ሁኔታ ተሰርዟል።`
          : `User account for ${userToDelete.full_name} was removed.`
      );
      setTimeout(() => setNotice(null), 4000);
      setUserToDelete(null);
      router.refresh();
    } else {
      setErrorNotice(res.error || (isAmharic ? "መለያውን መሰረዝ አልተቻለም።" : "Failed to delete user account."));
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <UserCog className="h-7 w-7 text-amber-600" />
            {t("users_page_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("users_page_subtitle")}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          {t("users_btn_add")}
        </Button>
      </div>

      {notice && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Role Privileges Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-amber-600/30 bg-amber-50/10 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              {t("users_mgr_perms_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>&bull; {isAmharic ? "በፋይናንስ ሪፖርቶችና የክምችት ዋጋ ላይ ሙሉ እይታ" : "Full ERP visibility across financial reports & valuation"}</p>
            <p>&bull; {isAmharic ? "የእህልና የዱቄት ዋጋዎችን እንዲሁም የማስጠንቀቂያ ገደቦችን ማስተካከል" : "Manage commodity prices & reorder thresholds"}</p>
            <p>&bull; {isAmharic ? "አቅራቢዎችን መመዝገብና ማረም፣ የግዢ ወጪዎችን መቆጣጠር" : "Register & edit suppliers, manage purchase costs"}</p>
            <p>&bull; {isAmharic ? "የብድር ሽያጮችን ማጽደቅ እና ያልተሰበሰቡ እዳዎችን ማስተዳደር" : "Approve credit sales & manage accounts receivable"}</p>
            <p>&bull; {isAmharic ? "የሰራተኞችና የራስዎን መለያ ኢሜይልና የይለፍ ቃል ማስተዳደር" : "Manage staff & manager login accounts, emails, and passwords"}</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              {t("users_staff_perms_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>&bull; {isAmharic ? "የእለት ተእለት የችርቻሮ እና የጅምላ ሽያጭ መመዝገቢያ (POS)" : "Point of Sale (POS) register for daily retail & wholesale cash sales"}</p>
            <p>&bull; {isAmharic ? "ከአቅራቢዎች የሚገቡ የእህልና የዱቄት ጭነቶች ደረሰኝ መመዝገብ" : "Record incoming grain and powder purchase receipts"}</p>
            <p>&bull; {isAmharic ? "በመጋዘን ውስጥ ያለውን ትክክለኛ ክምችት በቅጽበት መከታተል" : "View real-time commodity on-hand inventory levels"}</p>
            <p>&bull; {isAmharic ? "የደንበኞች ተከፋይ የብድር ክፍያዎችን መመዝገብ" : "Record customer credit installment repayments"}</p>
            <p>&bull; {isAmharic ? "ዋጋዎችን የመቀየር ወይም ዋና መረጃዎችን የመሰረዝ ፈቃድ የለውም" : "Restricted from modifying cost prices or deleting master data"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAmharic ? "ተጠቃሚዎችን በስም ወይም ኢሜይል ፈልግ..." : "Search users by name or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b pb-4 bg-muted/20">
          <CardTitle className="text-base font-semibold">
            {t("users_roster_title")} ({filteredUsers.length})
          </CardTitle>
          <CardDescription className="text-xs">
            {t("users_roster_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 uppercase tracking-wider text-[11px] font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-5 py-3">{t("users_full_name")}</th>
                  <th className="px-5 py-3">{t("users_login_email")}</th>
                  <th className="px-5 py-3 text-center">{t("users_assigned_role")}</th>
                  <th className="px-5 py-3 text-center">{t("users_registration_date")}</th>
                  <th className="px-5 py-3 text-right">{t("common_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => {
                  const isManager = u.role === "owner_manager";

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                            {u.full_name ? u.full_name.substring(0, 2).toUpperCase() : "US"}
                          </div>
                          <span>{u.full_name}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground font-mono">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{u.email || "staff@stockerp.et"}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          variant={isManager ? "warning" : "info"}
                          className="text-[10px] uppercase font-bold px-2 py-0.5"
                        >
                          {isManager ? (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> {t("owner_manager")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> {t("staff")}
                            </span>
                          )}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Email & Password Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(u);
                              setModalOpen(true);
                            }}
                            className="h-7 text-xs px-2 hover:border-amber-600 hover:text-amber-600 gap-1"
                            title="Edit email, password, and account details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            {t("btn_edit")}
                          </Button>

                          {/* Quick Role Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={updatingId === u.id}
                            onClick={() => handleToggleRole(u)}
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            title="Toggle role"
                          >
                            {updatingId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isManager ? (
                              t("btn_switch_to_staff")
                            ) : (
                              t("btn_promote_to_manager")
                            )}
                          </Button>

                          {/* Delete Account */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToDelete(u)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                            title="Delete user account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit User Modal */}
      <UserFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingUser(null);
        }}
        userToEdit={editingUser}
        onSuccess={async () => {
          await refreshUsers();
          setNotice(
            editingUser
              ? isAmharic
                ? `የ${editingUser.full_name} መለያ መረጃ ተሻሽሏል።`
                : `Account updated successfully for ${editingUser.full_name}.`
              : isAmharic
              ? "አዲስ የሰራተኛ መለያ በተሳካ ሁኔታ ተመዝግቧል።"
              : "New user account created successfully."
          );
          setTimeout(() => setNotice(null), 4000);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="max-w-md" onClose={() => setUserToDelete(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              {t("users_delete_btn")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("users_delete_confirm")}: <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email})
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToDelete(null)}
              disabled={deleting}
              className="text-xs"
            >
              {t("btn_cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="text-xs gap-1.5"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {isAmharic ? "አዎ፣ ሰርዝ" : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

