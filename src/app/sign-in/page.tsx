"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import GoogleSignInButton from "@/components/google-sign-in-button";
import { appPath } from "@/lib/app-paths";
export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    console.log("Signing in with email:", email);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
        callbackURL: appPath("/dashboard"),
      });

      if (error) {
        setError(
          error.status === 403
            ? "Please verify your email before signing in."
            : (error.message ?? "Unable to sign in."),
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome back</h1>

        <p className="mt-2 text-sm text-gray-500">Sign in to TenantBoard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Your password"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4"
            />
            Remember me on this device
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-600 underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <GoogleSignInButton />

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
