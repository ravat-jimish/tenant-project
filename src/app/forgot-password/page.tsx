
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { appPath } from "@/lib/app-paths";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitted(false);
    setLoading(true);

    try {
      const { error } =
        await authClient.requestPasswordReset({
          email: email.trim().toLowerCase(),
          redirectTo: `${window.location.origin}${appPath("/reset-password")}`,
        });

      if (error) {
        setError(error.message ?? "Unable to process your request.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Unable to process your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">
          Forgot password?
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Enter your registered email address.
        </p>

        {submitted ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            If an account exists with this email, a password
            reset link will be sent.
            Check your development terminal for the link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border px-3 py-2"
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Processing..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link
          href="/sign-in"
          className="mt-6 block text-center text-sm underline"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
