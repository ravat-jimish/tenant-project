"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ReauthenticateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReauthentication() {
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setError(error.message ?? "Unable to sign out.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError("Unable to restart authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={handleReauthentication}
        className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Signing out..." : "Sign in again"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
