
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type SessionsResponse = Awaited<
  ReturnType<typeof authClient.listSessions>
>;

type SessionRecord = NonNullable<
  SessionsResponse["data"]
>[number];

interface Props {
  currentSessionId: string;
}

export default function SessionManager({
  currentSessionId,
}: Props) {
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.listSessions();

      if (error) {
        setError(error.message ?? "Unable to load sessions.");
        return;
      }

      setSessions(data ?? []);
    } catch {
      setError("Unable to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function revokeDevice(target: SessionRecord) {
    if (target.id === currentSessionId) return;

    const confirmed = window.confirm(
      "Are you sure you want to sign out this device?"
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.revokeSession({
        token: target.token,
      });

      if (error) {
        setError(error.message ?? "Unable to revoke this session.");
        return;
      }

      setMessage("Device session revoked successfully.");
      await loadSessions();
    } catch {
      setError("Unable to revoke this session.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeOtherDevices() {
    const confirmed = window.confirm(
      "Sign out from every other device?"
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.revokeOtherSessions();

      if (error) {
        setError(error.message ?? "Unable to revoke other sessions.");
        return;
      }

      setMessage("All other sessions have been revoked.");
      await loadSessions();
    } catch {
      setError("Unable to revoke other sessions.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeAllDevices() {
    const confirmed = window.confirm(
      "This will sign you out everywhere, including this device. Continue?"
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const { error } = await authClient.revokeSessions();

      if (error) {
        setError(error.message ?? "Unable to revoke all sessions.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError("Unable to revoke all sessions.");
      setBusy(false);
    }
  }

  if (loading) {
    return <p>Loading sessions...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={revokeOtherDevices}
          disabled={busy || sessions.length <= 1}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Sign out other devices
        </button>

        <button
          onClick={revokeAllDevices}
          disabled={busy}
          className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
        >
          Sign out everywhere
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {message && (
        <p className="text-sm text-green-700">{message}</p>
      )}

      <div className="space-y-3">
        {sessions.map((session) => {
          const isCurrent =
            session.id === currentSessionId;

          return (
            <div
              key={session.id}
              className="rounded-xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    {isCurrent ? "Current device" : "Other device"}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Browser: {session.userAgent || "Unknown"}
                  </p>

                  <p className="text-sm text-gray-500">
                    IP: {session.ipAddress || "Unknown"}
                  </p>

                  <p className="text-sm text-gray-500">
                    Created:{" "}
                    {new Date(session.createdAt).toLocaleString()}
                  </p>

                  <p className="text-sm text-gray-500">
                    Expires:{" "}
                    {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>

                {isCurrent ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                    Active now
                  </span>
                ) : (
                  <button
                    onClick={() => revokeDevice(session)}
                    disabled={busy}
                    className="text-sm text-red-600 underline disabled:opacity-50"
                  >
                    Revoke session
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <p className="text-sm text-gray-500">
            No active sessions found.
          </p>
        )}
      </div>
    </div>
  );
}
