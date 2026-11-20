
"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { appPath } from "@/lib/app-paths";

interface Props {
  currentEmail: string;
  emailVerified: boolean;
}

export default function EmailSettings({
  currentEmail,
  emailVerified,
}: Props) {
  const searchParams = useSearchParams();

  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const completed = searchParams.get("emailChanged") === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = newEmail.trim().toLowerCase();

    if (normalizedEmail === currentEmail.toLowerCase()) {
      setError("New email must be different from your current email.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.changeEmail({
        newEmail: normalizedEmail,
        callbackURL: appPath("/settings/email?emailChanged=true"),
      });

      if (error) {
        setError(error.message ?? "Unable to process the email change request.");
        return;
      }

      setSuccess(
        "A confirmation link has been sent to your current email address. Approve it first, then verify the new email address."
      );

      setNewEmail("");
    } catch {
      setError("Unable to process the email change request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Current email</h2>

        <p className="mt-3 text-sm">
          {currentEmail}
        </p>

        <p className="mt-2 text-sm">
          Verification status:{" "}
          {emailVerified ? (
            <span className="text-green-700">
              Verified
            </span>
          ) : (
            <span className="text-red-600">
              Not verified
            </span>
          )}
        </p>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Change email address</h2>

        <p className="mt-2 text-sm text-gray-500">
          You must approve the change using your current email
          and verify ownership of the new email.
        </p>

        {completed ? (
          <p className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Your email change process has completed.
            Please refresh the page to see your updated email.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                New email address
              </label>

              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new-email@example.com"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-green-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : "Request email change"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
