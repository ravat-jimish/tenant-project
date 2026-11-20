"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import GoogleSignInButton from "@/components/google-sign-in-button";
import { appPath } from "@/lib/app-paths";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        callbackURL: appPath("/dashboard"),
      });

      if (error) {
        setError(error.message ?? "Unable to create your account.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Create your account</h1>

        <p className="mt-2 text-sm text-gray-500">
          Get started with TenantBoard.
        </p>

        {success ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Account registration submitted.
            <p className="mt-2">
              Open your Next.js terminal and follow the verification link
              printed there.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Full name
              </label>

              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Jimish Ravat"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>

              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>

              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleSignInButton />

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
