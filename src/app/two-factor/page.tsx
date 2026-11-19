"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type VerificationMethod = "totp" | "backup";

export default function TwoFactorChallengePage() {
  const router = useRouter();

  const [method, setMethod] = useState<VerificationMethod>("totp");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (method === "totp") {
        const { error } = await authClient.twoFactor.verifyTotp({
          code: code.trim(),
          trustDevice: false,
        });

        if (error) {
          setError(error.message ?? "Verification failed. Please try again.");
          return;
        }
      } else {
        const { error } = await authClient.twoFactor.verifyBackupCode({
          code: code.trim(),
          trustDevice: false,
        });

        if (error) {
          setError(error.message ?? "Verification failed. Please try again.");
          return;
        }
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8">
        <h1 className="text-2xl font-semibold">Two-factor verification</h1>

        <p className="mt-2 text-sm text-gray-500">
          Complete the second authentication step to access TenantBoard.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMethod("totp");
              setCode("");
              setError("");
            }}
            className={`flex-1 rounded-lg border p-2 text-sm ${
              method === "totp" ? "bg-black text-white" : "bg-white"
            }`}
          >
            Authenticator
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod("backup");
              setCode("");
              setError("");
            }}
            className={`flex-1 rounded-lg border p-2 text-sm ${
              method === "backup" ? "bg-black text-white" : "bg-white"
            }`}
          >
            Backup code
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {method === "totp" ? "Authenticator code" : "Recovery code"}
            </label>

            <input
              type="text"
              required
              autoComplete="one-time-code"
              inputMode="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={
                method === "totp" ? "Enter 6-digit code" : "Enter backup code"
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-white disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify and continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
