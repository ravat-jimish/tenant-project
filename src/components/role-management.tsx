"use client";

import { useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

import {
  applicationPermissions,
  resourceLabels,
  actionLabels,
  type ApplicationResource,
} from "@/lib/permission-catalog";

interface Props {
  organizationId: string;
  currentUserId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssignRoles: boolean;
}

interface DynamicRole {
  id: string;
  role: string;
  organizationId: string;
  permission: Record<string, string[]>;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

type PermissionSelection = Record<string, string[]>;

const builtInRoles = [
  {
    name: "owner",
    description: "Full organization and application access.",
  },
  {
    name: "admin",
    description: "Organization administration and application access.",
  },
  {
    name: "member",
    description: "Read-only application access.",
  },
];

const reservedRoles = ["owner", "admin", "member"];

const emptyPermissions: PermissionSelection = {};

export default function RoleManagement({
  organizationId,
  currentUserId,
  canCreate,
  canUpdate,
  canDelete,
  canAssignRoles,
}: Props) {
  const [roles, setRoles] = useState<DynamicRole[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] =
    useState<PermissionSelection>(emptyPermissions);

  const [editingRole, setEditingRole] = useState<DynamicRole | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const roleResult = await authClient.organization.listRoles({
        query: { organizationId },
      });

      if (roleResult.error) {
        setError(
          roleResult.error.message || "Unable to load organization roles.",
        );
        return;
      }

      setRoles((roleResult.data ?? []) as unknown as DynamicRole[]);

      if (canAssignRoles) {
        const memberResult = await authClient.organization.listMembers({
          query: {
            organizationId,
            limit: 100,
            offset: 0,
            sortBy: "createdAt",
            sortDirection: "asc",
          },
        });

        if (memberResult.error) {
          setError(
            memberResult.error.message ||
              "Unable to load organization members.",
          );
          return;
        }

        const result = memberResult.data as unknown as {
          members: OrganizationMember[];
        } | null;

        setMembers(result?.members ?? []);
      }
    } catch {
      setError("Unable to load roles and members.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, canAssignRoles]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function togglePermission(
    resource: ApplicationResource,
    action: string,
    checked: boolean,
  ) {
    setSelectedPermissions((previous) => {
      const current = previous[resource] ?? [];

      const updated = checked
        ? [...current, action]
        : current.filter((item) => item !== action);

      return {
        ...previous,
        [resource]: updated,
      };
    });
  }

  function getPermissionPayload(): Record<string, string[]> {
    return Object.fromEntries(
      Object.entries(selectedPermissions).filter(
        ([, actions]) => actions.length > 0,
      ),
    );
  }

  function resetEditor() {
    setRoleName("");
    setSelectedPermissions({});
    setEditingRole(null);
  }

  function editRole(role: DynamicRole) {
    setEditingRole(role);
    setRoleName(role.role);

    setSelectedPermissions(role.permission ?? {});

    setError("");
    setMessage("");
  }

  async function handleSaveRole() {
    setError("");
    setMessage("");

    const normalizedName = roleName.trim().toLowerCase().replace(/\s+/g, "_");

    if (!/^[a-z][a-z0-9_]{1,31}$/.test(normalizedName)) {
      setError(
        "Role name must be 2–32 characters and use lowercase letters, numbers and underscores.",
      );
      return;
    }

    if (!editingRole && reservedRoles.includes(normalizedName)) {
      setError("This is a reserved built-in role name.");
      return;
    }

    const permission = getPermissionPayload();

    if (Object.keys(permission).length === 0) {
      setError("Select at least one permission.");
      return;
    }

    setBusy(true);

    try {
      if (editingRole) {
        const { error } = await authClient.organization.updateRole({
          roleId: editingRole.id,
          organizationId,
          data: {
            permission,
          },
        });

        if (error) {
          setError(error.message || "Unable to update the role permissions.");
          return;
        }

        setMessage("Role permissions updated successfully.");
      } else {
        const { error } = await authClient.organization.createRole({
          role: normalizedName,
          organizationId,
          permission,
        });

        if (error) {
          setError(error.message || "Unable to create the role.");
          return;
        }

        setMessage("Custom role created successfully.");
      }

      resetEditor();

      await loadData();
    } catch {
      setError("Unable to save the role.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRole(role: DynamicRole) {
    const confirmed = window.confirm(`Delete the "${role.role}" role?`);

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.organization.deleteRole({
        roleId: role.id,
        organizationId,
      });

      if (error) {
        setError(error.message || "Unable to delete the role.");
        return;
      }

      if (editingRole?.id === role.id) {
        resetEditor();
      }

      setMessage("Role deleted successfully.");

      await loadData();
    } catch {
      setError("Unable to delete the role.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignRole() {
    if (!selectedMemberId || !selectedRole) {
      setError("Select a member and a role.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId: selectedMemberId,
        organizationId,
        role: selectedRole,
      });

      if (error) {
        setError(error.message || "Unable to assign the role.");
        return;
      }

      setMessage(`Member role updated to "${selectedRole}".`);

      await loadData();
    } catch {
      setError("Unable to assign the role.");
    } finally {
      setBusy(false);
    }
  }

  function handleMemberChange(memberId: string) {
    setSelectedMemberId(memberId);

    const member = members.find((item) => item.id === memberId);
    setSelectedRole(member?.role ?? "member");
  }

  if (loading) {
    return <p>Loading role management...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Built-in roles */}
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Built-in roles</h2>

        <p className="mt-2 text-sm text-gray-500">
          These roles are defined by TenantBoard and cannot be edited from the
          organization dashboard.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {builtInRoles.map((role) => (
            <div key={role.name} className="rounded-lg border p-4">
              <h3 className="font-medium capitalize">{role.name}</h3>

              <p className="mt-2 text-xs text-gray-500">{role.description}</p>

              <span className="mt-3 inline-block text-xs text-gray-400">
                System managed
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Role editor */}
      {(canCreate || canUpdate) && (
        <section className="rounded-xl border bg-white p-6">
          <div>
            <h2 className="font-semibold">
              {editingRole ? `Edit ${editingRole.role}` : "Create custom role"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Select the permissions that should belong to this organization
              role.
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">Role name</label>

            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={Boolean(editingRole)}
              placeholder="project_manager"
              className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
            />

            {editingRole && (
              <p className="mt-1 text-xs text-gray-500">
                Role names cannot be changed in this editor.
              </p>
            )}
          </div>

          <div className="mt-6 space-y-5">
            {(Object.keys(applicationPermissions) as ApplicationResource[]).map(
              (resource) => (
                <div key={resource} className="rounded-lg border p-4">
                  <h3 className="font-medium">{resourceLabels[resource]}</h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {applicationPermissions[resource].map((action) => {
                      const checked =
                        selectedPermissions[resource]?.includes(action) ??
                        false;

                      return (
                        <label
                          key={action}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              togglePermission(
                                resource,
                                action,
                                event.target.checked,
                              )
                            }
                          />

                          {actionLabels[action] ?? action}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSaveRole}
              disabled={
                busy ||
                (!editingRole && !canCreate) ||
                (Boolean(editingRole) && !canUpdate)
              }
              className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Saving..." : editingRole ? "Update role" : "Create role"}
            </button>

            <button
              onClick={resetEditor}
              disabled={busy}
              className="rounded-lg border px-5 py-2.5 text-sm"
            >
              {editingRole ? "Cancel editing" : "Reset"}
            </button>
          </div>
        </section>
      )}

      {/* Custom roles list */}
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Custom organization roles</h2>

            <p className="mt-1 text-sm text-gray-500">
              {roles.length} custom roles
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={busy}
            className="text-sm underline"
          >
            Refresh
          </button>
        </div>

        {roles.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No custom roles have been created.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{role.role}</h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    {canUpdate && (
                      <button
                        onClick={() => editRole(role)}
                        disabled={busy}
                        className="text-sm underline"
                      >
                        Edit permissions
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        disabled={busy}
                        className="text-sm text-red-600 underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(role.permission ?? {}).flatMap(
                    ([resource, actions]) =>
                      actions.map((action) => (
                        <span
                          key={`${resource}:${action}`}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                        >
                          {resource}:{action}
                        </span>
                      )),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Member role assignment */}
      {canAssignRoles && (
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Assign role to member</h2>

          <p className="mt-2 text-sm text-gray-500">
            Assign a built-in or custom organization role to an existing member.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Member</label>

              <select
                value={selectedMemberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select a member</option>

                {members
                  .filter((member) => member.userId !== currentUserId)
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.user.name} — {member.user.email}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">New role</label>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                {selectedRole !== "member" &&
                  selectedRole !== "admin" &&
                  !roles.some((role) => role.role === selectedRole) && (
                    <option value={selectedRole}>{selectedRole}</option>
                  )}

                <option value="member">Member</option>
                <option value="admin">Admin</option>

                {roles.map((role) => (
                  <option key={role.id} value={role.role}>
                    {role.role}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignRole}
              disabled={busy || !selectedMemberId}
              className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Updating..." : "Assign role"}
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}
    </div>
  );
}
