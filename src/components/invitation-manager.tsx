
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { authClient } from "@/lib/auth-client";

interface Props {
  organizationId: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string | Date;
  expiresAt: string | Date;
}

export default function InvitationManager({
  organizationId,
}: Props) {
  const [email, setEmail] = useState("");

  const [invitations, setInvitations] =
    useState<PendingInvitation[]>([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } =
        await authClient.organization.listInvitations({
          query: {
            organizationId,
          },
        });

      if (error) {
        setError(error.message || "Unable to retrieve pending invitations.");
        return;
      }

      // Normalize the API response for this UI.
      const result = data as unknown as
        | PendingInvitation[]
        | { invitations?: PendingInvitation[] }
        | null;

      const records = Array.isArray(result)
        ? result
        : result?.invitations ?? [];

      setInvitations(records);
    } catch {
      setError("Unable to retrieve pending invitations.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) return;

    setSending(true);
    setError("");
    setMessage("");

    try {
      const { error } =
        await authClient.organization.inviteMember({
          email: normalizedEmail,
          role: "member",
          organizationId,
          resend: false,
        });

      if (error) {
        setError(error.message || "Unable to send the invitation.");
        return;
      }

      setEmail("");

      setMessage(
        "Invitation created. Check the development terminal for the invitation link."
      );

      await loadInvitations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send invitation."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(invitationId: string) {
    const confirmed = window.confirm(
      "Cancel this organization invitation?"
    );

    if (!confirmed) return;

    setCancelingId(invitationId);
    setError("");
    setMessage("");

    try {
      const { error } =
        await authClient.organization.cancelInvitation({
          invitationId,
        });

      if (error) {
        setError(error.message || "Unable to cancel the invitation.");
        return;
      }

      setMessage("Invitation cancelled successfully.");

      await loadInvitations();
    } catch {
      setError("Unable to cancel the invitation.");
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="space-y-6">

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">
          Invite a member
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Invite someone to join this organization.
          They will receive the Member role.
        </p>

        <form
          onSubmit={handleInvite}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Assigned role
            </label>

            <input
              readOnly
              value="Member"
              className="w-full rounded-lg border bg-gray-50 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send invitation"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Pending invitations
          </h2>

          <button
            onClick={loadInvitations}
            disabled={loading}
            className="text-sm underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">
            Loading invitations...
          </p>
        ) : invitations.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No pending invitations.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {invitations
              .filter((invitation) => invitation.status === "pending")
              .map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {invitation.email}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Role: {invitation.role}
                      </p>

                      <p className="text-xs text-gray-500">
                        Expires:{" "}
                        {new Date(
                          invitation.expiresAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-800">
                        Pending
                      </span>

                      <button
                        onClick={() =>
                          handleCancel(invitation.id)
                        }
                        disabled={cancelingId === invitation.id}
                        className="text-sm text-red-600 underline disabled:opacity-50"
                      >
                        {cancelingId === invitation.id
                          ? "Cancelling..."
                          : "Cancel"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {message}
        </p>
      )}

    </div>
  );
}
