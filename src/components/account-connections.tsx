"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import ReauthenticateButton from "@/components/reauthenticate-button";
type AccountsResponse = Awaited<ReturnType<typeof authClient.listAccounts>>;

type LinkedAccount = NonNullable<AccountsResponse["data"]>[number];

function getProviderName(providerId: string) {
  switch (providerId) {
    case "credential":
      return "Email and Password";

    case "google":
      return "Google";

    default:
      return providerId;
  }
}

export default function AccountConnections() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [needsReauthentication, setNeedsReauthentication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.listAccounts();

      if (error) {
        setError(error.message ?? "Unable to load connected accounts.");
        return;
      }

      setAccounts(data ?? []);
    } catch {
      setError("Unable to load connected accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function connectGoogle() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/settings/accounts",
      });

      if (error) {
        setError(error.message ?? "Unable to connect Google account.");
      }
    } catch {
      setError("Unable to connect Google account.");
      setBusy(false);
    }
  }

  async function unlinkAccount(target: LinkedAccount) {
    if (accounts.length <= 1) {
      setError("You cannot remove your only login method.");
      return;
    }

    const confirmed = window.confirm(
      `Disconnect ${getProviderName(target.providerId)} from TenantBoard?`,
    );

    if (!confirmed) return;

    setBusyAccountId(target.id);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.unlinkAccount({
        accountId: target.id,
      });

      if (error) {
        const code = (error as { code?: string }).code;

        if (code === "SESSION_NOT_FRESH") {
          setNeedsReauthentication(true);
          return;
        }
        setError(
          error.message ??
            "Unable to disconnect the account. You may need to sign in again.",
        );
        return;
      }

      setMessage(
        `${getProviderName(target.providerId)} disconnected successfully.`,
      );

      await loadAccounts();
    } catch {
      setError(
        "Unable to disconnect the account. You may need to sign in again.",
      );
    } finally {
      setBusyAccountId(null);
    }
  }

  if (loading) {
    return <p>Loading linked accounts...</p>;
  }

  const googleConnected = accounts.some(
    (account) => account.providerId === "google",
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Authentication methods</h2>

          <span className="text-sm text-gray-500">
            {accounts.length} connected
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {accounts.map((account) => {
            const isOnlyAccount = accounts.length === 1;
            const isBusy = busyAccountId === account.id;

            return (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {getProviderName(account.providerId)}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Account ID: {account.accountId}
                  </p>

                  <p className="text-xs text-gray-500">
                    Added: {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {isOnlyAccount && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                      Only login method
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={isOnlyAccount || busy || isBusy}
                    onClick={() => unlinkAccount(account)}
                    className="text-sm text-red-600 underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isBusy ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            );
          })}

          {accounts.length === 0 && (
            <p className="text-sm text-gray-500">
              No linked authentication methods found.
            </p>
          )}
        </div>
      </section>

      {!googleConnected && (
        <section className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Connect another account</h2>

          <p className="mt-2 text-sm text-gray-500">
            Connect your Google identity to sign in using your Google account.
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={connectGoogle}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Connecting..." : "Connect Google"}
          </button>
        </section>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
          <p className="mt-2 text-xs">
            For sensitive operations, confirm that your login session is still
            fresh. Sign out and sign in again if required.
          </p>
        </div>
      )}

      {needsReauthentication && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">
            Additional authentication required
          </h3>

          <p className="mt-2 text-sm text-amber-800">
            Your session is still valid, but it is too old for this
            security-sensitive operation. Sign in again to continue.
          </p>

          <div className="mt-4">
            <ReauthenticateButton />
          </div>
        </div>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      )}

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Security notice:</strong> TenantBoard requires at least one
        connected authentication method. This is also enforced by Better Auth on
        the server.
      </div>
    </div>
  );
}
