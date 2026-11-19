import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import DynamicRoleTest from "@/components/dynamic-role-test";

export default async function DynamicRoleTestPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Dynamic RBAC Testing</h1>

        <p className="mt-2 text-sm text-gray-500">
          Create and inspect organization-specific roles.
        </p>

        <div className="mt-8">
          <DynamicRoleTest />
        </div>
      </div>
    </main>
  );
}
