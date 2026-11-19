"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function OrganizationSwitcher() {
  const router = useRouter();

  const { data: organizations, isPending: organizationsLoading } =
    authClient.useListOrganizations();

  const { data: activeOrganization, isPending: activeOrganizationLoading } =
    authClient.useActiveOrganization();

  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  async function handleSwitch(organizationId: string) {
    setError("");

    const selectedId = organizationId || null;

    if (selectedId === (activeOrganization?.id ?? null)) {
      return;
    }

    setSwitching(true);

    try {
      const { error } = await authClient.organization.setActive({
        organizationId: selectedId,
      });

      if (error) {
        setError(error.message || "Unable to switch organization.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to switch organization.");
    } finally {
      setSwitching(false);
    }
  }

  if (organizationsLoading || activeOrganizationLoading) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Loading workspaces...
      </div>
    );
  }

  const organizationList = organizations ?? [];

  if (organizationList.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-gray-500">
          You don't belong to any organizations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Workspace</h2>

          <p className="mt-1 text-sm text-gray-500">
            Switch between your organizations.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="organization-switcher"
          className="mb-2 block text-sm font-medium"
        >
          Active organization
        </label>

        <select
          id="organization-switcher"
          value={activeOrganization?.id ?? ""}
          onChange={(event) => {
            void handleSwitch(event.target.value);
          }}
          disabled={switching}
          className="w-full rounded-lg border bg-white px-3 py-3 text-sm disabled:opacity-50"
        >
          <option value="">No active workspace</option>

          {organizationList.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </div>

      {activeOrganization && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Currently working in</p>

          <p className="mt-1 font-medium">{activeOrganization.name}</p>

          <p className="mt-1 text-xs text-gray-500">
            {activeOrganization.slug}
          </p>
        </div>
      )}

      {switching && (
        <p className="mt-3 text-sm text-gray-500">Switching workspace...</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
