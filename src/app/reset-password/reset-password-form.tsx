
"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const invalidToken = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("The password reset link is invalid or expired.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setError(error.message ?? "Unable to reset your password.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-xl border bg-white p-8">
          <h1 className="text-xl font-semibold">
            Password updated
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            Your password has been changed. Please sign in again.
          </p>

          <button
            onClick={() => router.replace("/sign-in")}
            className="mt-6 w-full rounded-lg bg-black px-4 py-2 text-white"
          >
            Go to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8">
        <h1 className="text-2xl font-semibold">
          Reset password
        </h1>

        {(!token || invalidToken) ? (
          <p className="mt-4 text-sm text-red-600">
            This password reset link is invalid or has expired.
            Please request a new link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-lg border px-3 py-2"
            />

            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border px-3 py-2"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
