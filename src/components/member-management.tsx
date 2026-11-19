"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface Props {
  organizationId: string;
  currentUserId: string;
  currentRole: string;
}

interface MemberRecord {
  id: string;
  userId: string;
  role: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface MemberListResponse {
  members: MemberRecord[];
  total: number;
}

function hasRole(role: string, expected: string) {
  return role
    .split(",")
    .map((value) => value.trim())
    .includes(expected);
}

function roleLabel(role: string) {
  return role
    .split(",")
    .map((value) => value.trim())
    .join(", ");
}

export default function MemberManagement({
  organizationId,
  currentUserId,
  currentRole,
}: Props) {
  const router = useRouter();

  const isOwner = hasRole(currentRole, "owner");
  const canManageMembers = isOwner || hasRole(currentRole, "admin");

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.organization.listMembers({
        query: {
          organizationId,
          limit: 50,
          offset: 0,
          sortBy: "createdAt",
          sortDirection: "asc",
        },
      });

      if (error) {
        setError(error.message || "Unable to load organization members.");
        return;
      }

      const result = data as unknown as MemberListResponse | null;

      setMembers(result?.members ?? []);
      setTotal(result?.total ?? 0);
    } catch {
      setError("Unable to load organization members.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleRoleChange(
    member: MemberRecord,
    newRole: "admin" | "member",
  ) {
    if (!canManageMembers) return;

    if (hasRole(member.role, "owner") && (!isOwner || ownerCount <= 1)) {
      setError(
        "Only another owner can change this role, and the last owner must be preserved.",
      );
      return;
    }

    if (hasRole(member.role, newRole)) return;

    const confirmed = window.confirm(
      `Change ${member.user.name}'s role to ${newRole}?`,
    );

    if (!confirmed) return;

    setBusyId(member.id);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId: member.id,
        organizationId,
        role: newRole,
      });

      if (error) {
        setError(error.message || "Unable to update member role.");
        return;
      }

      setMessage(`${member.user.name}'s role was updated to ${newRole}.`);

      await loadMembers();
    } catch {
      setError("Unable to update member role.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveMember(member: MemberRecord) {
    if (!canManageMembers) return;

    if (member.user.id === currentUserId) {
      setError("Use Leave Organization to remove yourself.");
      return;
    }

    if (hasRole(member.role, "owner") && !isOwner) {
      setError("An admin cannot remove an organization owner.");
      return;
    }

    if (hasRole(member.role, "owner") && (!isOwner || ownerCount <= 1)) {
      setError("An owner cannot be removed unless another owner remains.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.user.name} from this organization?`,
    );

    if (!confirmed) return;

    setBusyId(member.id);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: member.user.email,
        organizationId,
      });

      if (error) {
        setError(error.message || "Unable to remove member.");
        return;
      }

      setMessage(`${member.user.name} was removed from the organization.`);

      await loadMembers();
      router.refresh();
    } catch {
      setError("Unable to remove member.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleLeaveOrganization() {
    const confirmed = window.confirm(
      "Leave this organization? You will lose access to its projects and other resources.",
    );

    if (!confirmed) return;

    setBusyId("leave");
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.organization.leave({
        organizationId,
      });

      if (error) {
        setError(error.message || "Unable to leave this organization.");
        return;
      }

      // Clear the old organization context.
      await authClient.organization.setActive({
        organizationId: null,
      });

      setMessage("You have left the organization.");

      router.replace("/organizations");
      router.refresh();
    } catch {
      setError(
        "Unable to leave this organization. An owner may need to transfer ownership first.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handlePromoteToOwner(member: MemberRecord) {
    if (!isOwner) return;

    if (member.user.id === currentUserId) return;

    const confirmed = window.confirm(
      `Promote ${member.user.name} to Owner? Both of you will temporarily have the Owner role. The new owner must then demote the previous owner if this is a full ownership transfer.`,
    );

    if (!confirmed) return;

    setBusyId(member.id);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.organization.updateMemberRole({
        memberId: member.id,
        organizationId,
        role: "owner",
      });

      if (error) {
        setError(error.message || "Unable to promote member to owner.");
        return;
      }

      setMessage(
        `${member.user.name} is now an owner. Complete the transfer by having the new owner demote the previous owner.`,
      );

      await loadMembers();
    } catch {
      setError("Unable to promote member to owner.");
    } finally {
      setBusyId(null);
    }
  }

  const ownerCount = members.filter((member) =>
    hasRole(member.role, "owner"),
  ).length;

  const currentMember = members.find(
    (member) => member.user.id === currentUserId,
  );

  const isLastOwner = isOwner && ownerCount <= 1;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Members</h2>

            <p className="mt-1 text-sm text-gray-500">
              {total} organization members
            </p>
          </div>

          <button
            onClick={loadMembers}
            disabled={loading}
            className="text-sm underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">Loading members...</p>
        ) : (
          <div className="mt-5 space-y-3">
            {members.map((member) => {
              const isCurrent = member.user.id === currentUserId;

              const isMemberOwner = hasRole(member.role, "owner");

              const isBusy = busyId === member.id;

              return (
                <div key={member.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {member.user.name}
                        {isCurrent && (
                          <span className="ml-2 text-xs text-gray-400">
                            (You)
                          </span>
                        )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {member.user.email}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                        {roleLabel(member.role)}
                      </span>

                      {isMemberOwner && isCurrent && (
                        <span className="text-xs text-green-700">
                          Organization owner
                        </span>
                      )}
                    </div>
                  </div>

                  {canManageMembers &&
                    !isCurrent &&
                    (!isMemberOwner || (isOwner && ownerCount > 1)) && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
                        <select
                          defaultValue={
                            hasRole(member.role, "admin") ? "admin" : "member"
                          }
                          disabled={isBusy}
                          onChange={(event) => {
                            void handleRoleChange(
                              member,
                              event.target.value as "admin" | "member",
                            );
                          }}
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          <option value="member">Member</option>

                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => handleRemoveMember(member)}
                          disabled={isBusy}
                          className="text-sm text-red-600 underline disabled:opacity-50"
                        >
                          {isBusy ? "Processing..." : "Remove"}
                        </button>

                        {isOwner && (
                          <button
                            onClick={() => handlePromoteToOwner(member)}
                            disabled={isBusy}
                            className="text-sm underline disabled:opacity-50"
                          >
                            Transfer ownership
                          </button>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Leave organization</h2>

        <p className="mt-2 text-sm text-gray-500">
          Leaving removes your membership, not your TenantBoard user account.
        </p>

        {isLastOwner && (
          <p className="mt-3 text-sm text-amber-700">
            You are the last owner. Transfer ownership before leaving.
          </p>
        )}

        <button
          onClick={handleLeaveOrganization}
          disabled={isLastOwner || busyId !== null}
          className="mt-5 rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busyId === "leave" ? "Leaving..." : "Leave organization"}
        </button>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {message}
        </p>
      )}

      {currentMember && isOwner && (
        <p className="text-xs text-gray-500">
          You are managing this organization as Owner.
        </p>
      )}
    </div>
  );
}
