"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function ActiveOrganizationInfo() {
  const { data: activeOrganization, isPending } =
    authClient.useActiveOrganization();

  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!activeOrganization) {
        setRole(null);
        return;
      }

      setLoadingRole(true);

      try {
        const { data, error } =
          await authClient.organization.getActiveMemberRole();

        if (!cancelled) {
          setRole(error ? null : (data?.role ?? null));
        }
      } catch {
        if (!cancelled) {
          setRole(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRole(false);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id]);

  if (isPending) {
    return <p>Loading organization...</p>;
  }

  if (!activeOrganization) {
    return (
      <p className="text-sm text-gray-500">No active organization selected.</p>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Current Workspace</h2>

      <p className="mt-2 text-lg font-medium">{activeOrganization.name}</p>

      <div className="mt-3">
        <p className="text-xs text-gray-500">Your organization role</p>

        <p className="mt-1 font-medium capitalize">
          {loadingRole ? "Loading..." : (role ?? "Unavailable")}
        </p>
      </div>
    </div>
  );
}
