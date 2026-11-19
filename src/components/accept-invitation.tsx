
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Link from "next/link";

import { authClient } from "@/lib/auth-client";

export default function AcceptInvitation() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invitationId = searchParams.get("invitationId");

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleAccept() {
    if (!invitationId) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } =
        await authClient.organization.acceptInvitation({
          invitationId,
        });

      if (error) {
        setError(error.message || "Unable to accept this invitation.");
        return;
      }

      setMessage("You have successfully joined the organization.");

      router.refresh();
    } catch {
      setError("Unable to accept this invitation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!invitationId) return;

    const confirmed = window.confirm(
      "Are you sure you want to reject this invitation?"
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } =
        await authClient.organization.rejectInvitation({
          invitationId,
        });

      if (error) {
        setError(error.message || "Unable to reject this invitation.");
        return;
      }

      setMessage("Invitation rejected successfully.");
    } catch {
      setError("Unable to reject this invitation.");
    } finally {
      setLoading(false);
    }
  }

  if (isPending) {
    return (
      <div className="w-full max-w-md rounded-xl border bg-white p-8">
        Loading your account...
      </div>
    );
  }

  if (!invitationId) {
    return (
      <div className="w-full max-w-md rounded-xl border bg-white p-8">
        <h1 className="text-xl font-semibold">
          Invalid invitation link
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          No invitation ID was provided.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full max-w-md rounded-xl border bg-white p-8">
        <h1 className="text-2xl font-semibold">
          Organization invitation
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          To accept this invitation, sign in using the
          email address to which the invitation was sent.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/sign-in"
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg bg-black p-3 text-center text-sm text-white"
          >
            Sign in
          </Link>

          <Link
            href="/sign-up"
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg border p-3 text-center text-sm"
          >
            Create an account
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          After signing in or verifying your new account,
          return to this tab and refresh the page.
        </p>
      </div>
    );
  }

  if (!session.user.emailVerified) {
    return (
      <div className="w-full max-w-md rounded-xl border bg-white p-8">
        <h1 className="text-xl font-semibold">
          Verify your email first
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          Your account email must be verified before you
          can accept this organization invitation.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-8">
      <h1 className="text-2xl font-semibold">
        Organization invitation
      </h1>

      <p className="mt-3 text-sm text-gray-500">
        You are signed in as:
      </p>

      <p className="mt-1 font-medium">
        {session.user.email}
      </p>

      <p className="mt-4 text-sm text-gray-500">
        Accept the invitation to become a member of
        the organization.
      </p>

      {message && (
        <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {message}

          <Link
            href="/organizations"
            className="mt-3 block underline"
          >
            View my organizations
          </Link>
        </div>
      )}

      {error && (
        <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {!message && (
        <div className="mt-6 space-y-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full rounded-lg bg-black p-3 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Processing..." : "Accept invitation"}
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className="w-full rounded-lg border p-3 text-sm disabled:opacity-50"
          >
            Reject invitation
          </button>
        </div>
      )}

    </div>
  );
}
