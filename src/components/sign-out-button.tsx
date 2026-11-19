"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Sign-out failed:", error);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}