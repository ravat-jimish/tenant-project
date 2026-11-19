"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function GoogleAccountSettings() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await authClient.listAccounts();

      if (error) {
        setError(error.message ?? "Unable to load linked accounts.");
        return;
      }

      setConnected(
        data?.some((account) => account.providerId === "google") ??
          false
      );
    } catch {
      setError("Unable to load linked accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function connectGoogle() {
    setError("");

    try {
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (error) {
        setError(error.message ?? "Unable to link Google account.");
      }
    } catch {
      setError("Unable to link Google account.");
    }
  }

  if (loading) {
    return <p>Loading connected accounts...</p>;
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">Connected accounts</h2>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Google</p>

          <p className="text-sm text-gray-500">
            {connected
              ? "Your Google account is connected."
              : "Your Google account is not connected."}
          </p>
        </div>

        {connected ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
            Connected
          </span>
        ) : (
          <button
            onClick={connectGoogle}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Connect Google
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}