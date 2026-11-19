"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (error) {
        setError(error.message ?? "Google authentication failed.");
      }
    } catch {
      setError("Google authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        <span className="font-bold text-lg">G</span>

        {loading ? "Connecting to Google..." : "Continue with Google"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
