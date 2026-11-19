import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import RoleManagement from "@/components/role-management";

export default function RoleManagementPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Roles & Permissions</h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage organization-specific roles and permissions.
        </p>

        <Suspense fallback={<RolesLoading />}>
          <AuthenticatedRoleManagement />
        </Suspense>
      </div>
    </main>
  );
}

async function AuthenticatedRoleManagement() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return <p className="mt-8">Select an organization first.</p>;
  }

  const [canRead, canCreate, canUpdate, canDelete, canAssignRoles] =
    await Promise.all([
      auth.api.hasPermission({
        headers: requestHeaders,
        body: { permissions: { ac: ["read"] } },
      }),
      auth.api.hasPermission({
        headers: requestHeaders,
        body: { permissions: { ac: ["create"] } },
      }),
      auth.api.hasPermission({
        headers: requestHeaders,
        body: { permissions: { ac: ["update"] } },
      }),
      auth.api.hasPermission({
        headers: requestHeaders,
        body: { permissions: { ac: ["delete"] } },
      }),
      auth.api.hasPermission({
        headers: requestHeaders,
        body: { permissions: { member: ["update"] } },
      }),
    ]);

  if (!canRead.success) {
    return (
      <div className="mt-8 max-w-3xl rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Access denied</h2>

        <p className="mt-2 text-sm text-gray-500">
          You don&apos;t have permission to view organization roles.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <RoleManagement
        organizationId={organizationId}
        currentUserId={session.user.id}
        canCreate={canCreate.success}
        canUpdate={canUpdate.success}
        canDelete={canDelete.success}
        canAssignRoles={canAssignRoles.success}
      />
    </div>
  );
}

function RolesLoading() {
  return (
    <div className="mt-8 space-y-8" aria-busy="true">
      <div className="h-56 animate-pulse rounded-xl border bg-white" />
      <div className="h-80 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
