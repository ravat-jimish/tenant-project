import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import MemberManagement from "@/components/member-management";
import InvitationManager from "@/components/invitation-manager";

export default function OrganizationMembersPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">Organization Members</h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage membership and access to the active workspace.
        </p>

        <Suspense fallback={<MembersLoading />}>
          <AuthenticatedOrganizationMembers />
        </Suspense>
      </div>
    </main>
  );
}

async function AuthenticatedOrganizationMembers() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/sign-in");
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return (
      <div className="mt-8 max-w-3xl rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">No active organization</h2>

        <p className="mt-2 text-sm text-gray-500">
          Select an organization before managing its members.
        </p>

        <Link href="/organizations" className="mt-5 inline-block underline">
          View organizations
        </Link>
      </div>
    );
  }

  const activeMember = await auth.api.getActiveMember({
    headers: requestHeaders,
  });

  if (!activeMember) {
    return (
      <div className="mt-8 max-w-3xl rounded-xl border bg-white p-6">
        You are not a member of the active organization.
      </div>
    );
  }

  const currentRole = activeMember.role;
  const currentRoles = currentRole.split(",").map((role) => role.trim());
  const canManageMembers =
    currentRoles.includes("owner") || currentRoles.includes("admin");

  return (
    <div className="mt-8">
      <MemberManagement
        organizationId={organizationId}
        currentUserId={session.user.id}
        currentRole={currentRole}
      />

      {canManageMembers && (
        <div className="mt-8">
          <InvitationManager organizationId={organizationId} />
        </div>
      )}
    </div>
  );
}

function MembersLoading() {
  return (
    <div className="mt-8 space-y-8" aria-busy="true">
      <div className="h-72 animate-pulse rounded-xl border bg-white" />
      <div className="h-64 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
