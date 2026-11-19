import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import OrganizationManager from "@/components/organization-manager";

export default function OrganizationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">My Organizations</h1>

        <p className="mt-2 text-sm text-gray-500">
          Create and manage your workspaces.
        </p>

        <Suspense fallback={<OrganizationsLoading />}>
          <AuthenticatedOrganizations />
        </Suspense>
      </div>
    </main>
  );
}

async function AuthenticatedOrganizations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="mt-8">
      <OrganizationManager />
    </div>
  );
}

function OrganizationsLoading() {
  return (
    <div className="mt-8 space-y-8" aria-busy="true">
      <div className="h-56 animate-pulse rounded-xl border bg-white" />
      <div className="h-40 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
