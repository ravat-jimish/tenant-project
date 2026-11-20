"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { appPath } from "@/lib/app-paths";

interface Props {
  email: string;
}

export default function PasswordSettings({ email }: Props) {
  const [hasCredential, setHasCredential] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setError("");

    try {
      const { data, error } = await authClient.listAccounts();

      if (error) {
        setError(error.message ?? "Unable to retrieve login methods.");
        return;
      }

      const credentialExists =
        data?.some((account) => account.providerId === "credential") ?? false;

      setHasCredential(credentialExists);
    } catch {
      setError("Unable to retrieve login methods.");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 8 || newPassword.length > 128) {
      setError("Password must contain between 8 and 128 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Choose a password different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setError(error.message ?? "Unable to update password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Password updated. All other active sessions have been revoked.",
      );
    } catch {
      setError("Unable to update password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPassword() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}${appPath("/reset-password")}`,
      });

      if (error) {
        setError(error.message ?? "Unable to request password setup.");
        return;
      }

      setSuccess(
        "Password setup instructions have been sent to your registered email. Check your development terminal for the link.",
      );
    } catch {
      setError("Unable to request password setup.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingAccounts) {
    return <p>Loading authentication methods...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Authentication methods</h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Email and password</span>

            <span className="text-sm">
              {hasCredential ? "Enabled" : "Not configured"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Account email</span>
            <span className="text-sm text-gray-500">{email}</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">
          {hasCredential ? "Change password" : "Add a password"}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {hasCredential
            ? "Enter your current password and choose a new password."
            : "Your account currently does not have a password. Verify your email to add one."}
        </p>

        {hasCredential ? (
          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Current password
              </label>

              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                New password
              </label>

              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm new password
              </label>

              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={handleAddPassword}
            disabled={loading}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send password setup link"}
          </button>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {success && <p className="mt-4 text-sm text-green-700">{success}</p>}
      </section>
    </div>
  );
}
