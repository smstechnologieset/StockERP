"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createUserAction, updateUserAccountAction } from "@/app/actions/users";
import { Loader2, UserPlus, UserCog, Eye, EyeOff } from "lucide-react";
import type { Profile, AppRole } from "@/types/database";

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: (Profile & { email?: string }) | null;
  onSuccess: () => void;
}

export function UserFormModal({
  open,
  onOpenChange,
  userToEdit,
  onSuccess,
}: UserFormModalProps) {
  const { t, isAmharic } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = !!userToEdit;

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        setFullName(userToEdit.full_name || "");
        setEmail(userToEdit.email || "");
        setPassword("");
        setRole(userToEdit.role || "staff");
      } else {
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("staff");
      }
      setShowPassword(false);
      setErrorMessage(null);
    }
  }, [open, userToEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage(isAmharic ? "ሙሉ ስም ማስገባት ግዴታ ነው።" : "Full name is required.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage(isAmharic ? "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።" : "Please provide a valid email address.");
      return;
    }

    if (!isEditing && (!password || password.trim().length < 6)) {
      setErrorMessage(
        isAmharic
          ? "የይለፍ ቃል ቢያንስ 6 ፊደላት ወይም ቁጥሮች መሆን አለበት።"
          : "Password must be at least 6 characters long."
      );
      return;
    }

    if (isEditing && password.trim().length > 0 && password.trim().length < 6) {
      setErrorMessage(
        isAmharic
          ? "አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት ወይም ቁጥሮች መሆን አለበት።"
          : "New password must be at least 6 characters long."
      );
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        const res = await updateUserAccountAction({
          id: userToEdit.id,
          full_name: fullName.trim(),
          email: email.trim(),
          password: password.trim() ? password.trim() : undefined,
          role,
        });

        if (!res.success) {
          throw new Error(res.error || (isAmharic ? "መለያውን ማስተካከል አልተቻለም።" : "Failed to update user account."));
        }
      } else {
        const res = await createUserAction({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        });

        if (!res.success) {
          throw new Error(res.error || (isAmharic ? "አዲስ ሰራተኛ መመዝገብ አልተቻለም።" : "Failed to create user account."));
        }
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <UserCog className="h-5 w-5 text-amber-600" />
                {t("users_modal_edit_title")}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-amber-600" />
                {t("users_modal_add_title")}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing ? t("users_modal_edit_desc") : t("users_modal_add_desc")}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="user-fullname" className="text-xs font-semibold">
              {t("users_full_name")} *
            </Label>
            <Input
              id="user-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isAmharic ? "ምሳሌ፡ አቶ ዳዊት በቀለ" : "e.g. Abebe Bekele"}
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="user-email" className="text-xs font-semibold">
              {t("users_login_email")} *
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. staff@stockerp.et"
              className="h-9 text-xs font-mono"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="user-password" className="text-xs font-semibold">
              {isEditing ? t("users_new_password_label") : t("users_password_label")}
            </Label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? t("users_new_password_placeholder") : t("users_password_placeholder")}
                className="h-9 text-xs pr-9"
                minLength={isEditing && !password ? undefined : 6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isEditing && (
              <p className="text-[11px] text-muted-foreground">
                {isAmharic
                  ? "የነበረውን የይለፍ ቃል ላለመቀየር ይህን ቦታ ባዶ ይተዉት።"
                  : "Leave blank if you do not wish to change the password."}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="user-role" className="text-xs font-semibold">
              {t("users_role_label")}
            </Label>
            <Select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className="h-9 text-xs"
            >
              <option value="staff">
                {isAmharic ? "ሰራተኛ (Staff - ሽያጭና እቃ መረከብ)" : "Staff Member (POS & Stock-In)"}
              </option>
              <option value="owner_manager">
                {isAmharic ? "ባለቤት / ስራ አስኪያጅ (Owner / Manager - ሙሉ ፈቃድ)" : "Owner / Manager (Full Access)"}
              </option>
            </Select>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              {t("btn_cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEditing
                ? isAmharic ? "መረጃውን አዘምን" : "Save Changes"
                : isAmharic ? "መለያውን ፍጠር" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
