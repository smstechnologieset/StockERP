"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Profile, AppRole } from "@/types/database";

export async function getUsersAction(): Promise<{
  success: boolean;
  data: (Profile & { email?: string; branch_name?: string })[];
  error?: string;
}> {
  try {
    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.listUsers();
    if (authError) throw authError;

    const authUsersMap = new Map<string, { email?: string; created_at?: string }>();
    (authData?.users || []).forEach((u) => {
      authUsersMap.set(u.id, { email: u.email, created_at: u.created_at });
    });

    const { data: profiles, error: profError } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (profError) throw profError;

    const formatted = (profiles || []).map((p: any) => {
      const authInfo = authUsersMap.get(p.id);
      return {
        ...p,
        branch_name: "Main Store",
        email: authInfo?.email || (p.role === "owner_manager" ? "manager@stockerp.et" : "staff@stockerp.et"),
      };
    });

    return { success: true, data: formatted };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function updateUserRoleAction(userId: string, newRole: AppRole) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/users");
    revalidatePath("/manager");
    revalidatePath("/staff");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createUserAction(data: {
  full_name: string;
  email: string;
  password: string;
  role: AppRole;
}) {
  try {
    const admin = createAdminClient();

    if (!data.password || data.password.trim().length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    // 1. Create auth user with confirmed email
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
      email_confirm: true,
      user_metadata: { full_name: data.full_name.trim() },
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error("Failed to create user record.");

    // 2. Insert profile
    const defaultBranchId = "00000000-0000-0000-0000-000000000001";
    const { error: profError } = await admin.from("profiles").upsert({
      id: authUser.user.id,
      full_name: data.full_name.trim(),
      role: data.role,
      branch_id: defaultBranchId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profError) throw profError;

    revalidatePath("/users");
    revalidatePath("/manager");
    return {
      success: true,
      user: {
        id: authUser.user.id,
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        branch_id: defaultBranchId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error("Create user error:", err);
    return { success: false, error: err.message };
  }
}

export async function updateUserAccountAction(data: {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  role: AppRole;
}) {
  try {
    const admin = createAdminClient();

    // 1. Prepare auth updates
    const authPayload: any = {
      email: data.email.trim().toLowerCase(),
      user_metadata: { full_name: data.full_name.trim() },
    };

    if (data.password && data.password.trim().length > 0) {
      if (data.password.trim().length < 6) {
        return { success: false, error: "Password must be at least 6 characters." };
      }
      authPayload.password = data.password.trim();
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      data.id,
      authPayload
    );

    if (authError) throw authError;

    // 2. Update profile
    const { error: profError } = await admin
      .from("profiles")
      .update({
        full_name: data.full_name.trim(),
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (profError) throw profError;

    revalidatePath("/users");
    revalidatePath("/manager");
    revalidatePath("/staff");

    return { success: true };
  } catch (err: any) {
    console.error("Update user error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteUserAccountAction(userId: string) {
  try {
    const admin = createAdminClient();

    await admin.from("profiles").delete().eq("id", userId);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    revalidatePath("/users");
    return { success: true };
  } catch (err: any) {
    console.error("Delete user error:", err);
    return { success: false, error: err.message };
  }
}

