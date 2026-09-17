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

  return <UsersClient initialUsers={users} />;
}

