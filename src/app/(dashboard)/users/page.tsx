import { getUsersAction } from "@/app/actions/users";
import { UsersClient } from "./UsersClient";
import type { Profile } from "@/types/database";

export const revalidate = 0;

export default async function UsersManagementPage() {
  let users: (Profile & { email?: string; branch_name?: string })[] = [];

  const res = await getUsersAction();
  if (res.success && res.data.length > 0) {
    users = res.data;
  }

  // Fallback demo users if empty
  if (users.length === 0) {
    users = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        full_name: "Ato Dawit Manager",
        role: "owner_manager",
        branch_id: "00000000-0000-0000-0000-000000000001",
        branch_name: "Main Store",
        email: "manager@stockerp.et",
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        full_name: "W/ro Tigist Staff",
        role: "staff",
        branch_id: "00000000-0000-0000-0000-000000000001",
        branch_name: "Main Store",
        email: "staff@stockerp.et",
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  return <UsersClient initialUsers={users} />;
}

