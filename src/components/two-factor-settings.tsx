
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

import { authClient } from "@/lib/auth-client";

interface Props {
  enabled: boolean;
  userEmail: string;
}

export default function TwoFactorSettings({
  enabled,
  userEmail,
}: Props) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [code, setCode] = useState("");

  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [isSetupStarted, setIsSetupStarted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function startEnrollment() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        method: "totp",
        issuer: "TenantBoard",
      });

      if (error) {
        setError(error.message ?? "Unable to initialize two-factor authentication.");
        return;
      }

      if (!data || data.method !== "totp") {
        setError("Unable to initialize TOTP enrollment.");
        return;
      }

      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes);

      setIsSetupStarted(true);
      setMessage("Scan the QR code using your authenticator app.");
    } catch {
      setError("Unable to start two-factor enrollment.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEnrollment() {
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
        trustDevice: false,
      });

      if (error) {
        setError(error.message ?? "Unable to verify authenticator code.");
        return;
      }

      setIsVerified(true);
      setIsSetupStarted(false);
      setPassword("");
      setCode("");

      setMessage("Two-factor authentication enabled successfully.");

      router.refresh();
    } catch {
      setError("Unable to verify authenticator code.");
    } finally {
      setLoading(false);
    }
  }

  async function disableTwoFactor() {
    const confirmed = window.confirm(
      "Are you sure you want to disable two-factor authentication?"
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await authClient.twoFactor.disable({
        password,
      });

      if (error) {
        setError(error.message ?? "Unable to disable two-factor authentication.");
        return;
      }

      setPassword("");
      setBackupCodes([]);
      setIsVerified(false);

      setMessage("Two-factor authentication disabled.");

      router.refresh();
    } catch {
      setError("Unable to disable two-factor authentication.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateBackupCodes() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error } =
        await authClient.twoFactor.generateBackupCodes({
          password,
        });

      if (error) {
        setError(error.message ?? "Unable to generate backup codes.");
        return;
      }

      if (!data?.backupCodes) {
        setError("Unable to generate backup codes.");
        return;
      }

      setBackupCodes(data.backupCodes);

      setMessage(
        "New backup codes generated. Your previous codes are no longer valid."
      );
    } catch {
      setError("Unable to generate backup codes.");
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    const text = backupCodes.join("\n");

    navigator.clipboard.writeText(text).then(
      () => setMessage("Backup codes copied."),
      () => setError("Unable to copy backup codes.")
    );
  }

  return (
    <div className="space-y-6">

      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              Two-factor authentication
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {enabled || isVerified
                ? "Your account has an additional authentication factor."
                : "Add an additional layer of security."}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs ${
              enabled || isVerified
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {enabled || isVerified ? "Enabled" : "Disabled"}
          </span>
        </div>

        {!enabled && !isVerified && !isSetupStarted && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Current password
              </label>

              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <button
              onClick={startEnrollment}
              disabled={loading || !password}
              className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Starting..." : "Enable 2FA"}
            </button>
          </div>
        )}

        {isSetupStarted && (
          <div className="mt-6 space-y-5">

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium">
                Step 1 — Scan QR code
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Open your authenticator app and scan this QR code.
              </p>

              <div className="mt-5 flex justify-center rounded-lg bg-white p-5">
                {totpURI && (
                  <QRCode
                    value={totpURI}
                    size={200}
                  />
                )}
              </div>

              <p className="mt-3 break-all text-xs text-gray-500">
                Keep the setup URI private. Do not share it.
              </p>
            </div>

            <div>
              <h3 className="font-medium">
                Step 2 — Verify authenticator
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Enter the six-digit code shown in your app.
              </p>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="mt-3 w-full rounded-lg border px-3 py-2"
              />

              <button
                onClick={verifyEnrollment}
                disabled={loading || code.length !== 6}
                className="mt-4 w-full rounded-lg bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify and enable"}
              </button>
            </div>
          </div>
        )}

        {(enabled || isVerified) && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Current password
              </label>

              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <button
              onClick={regenerateBackupCodes}
              disabled={loading || !password}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
            >
              Regenerate backup codes
            </button>

            <button
              onClick={disableTwoFactor}
              disabled={loading || !password}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Disable 2FA
            </button>
          </div>
        )}
      </section>

      {backupCodes.length > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900">
            Save your backup codes
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Store these somewhere secure. Each code can be used
            once to recover access if you lose your authenticator.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {backupCodes.map((item, index) => (
              <div
                key={index}
                className="rounded-md border bg-white p-2 text-center font-mono text-sm"
              >
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={copyBackupCodes}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Copy backup codes
          </button>
        </section>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
