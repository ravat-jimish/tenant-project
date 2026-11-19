
"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function DynamicRoleTest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createProjectManagerRole() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error } =
        await authClient.organization.createRole({
          role: "project_manager",

          permission: {
            project: [
              "create",
              "read",
              "update",
            ],

            invoice: [
              "read",
            ],

            report: [
              "read",
              "export",
            ],
          },
        });

      if (error) {
        setError(error.message || "Unable to create role.");
        return;
      }

      setMessage(
        `Role created successfully: ${JSON.stringify(data)}`
      );
    } catch {
      setError("Unable to create role.");
    } finally {
      setLoading(false);
    }
  }

  async function listRoles() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error } =
        await authClient.organization.listRoles();

      if (error) {
        setError(error.message || "Unable to list organization roles.");
        return;
      }

      setMessage(JSON.stringify(data, null, 2));
    } catch {
      setError("Unable to list organization roles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 space-y-5">
      <div>
        <h2 className="font-semibold">
          Project Manager
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Create a custom role with project, invoice
          and report permissions.
        </p>
      </div>

      <button
        onClick={createProjectManagerRole}
        disabled={loading}
        className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
      >
        Create Project Manager role
      </button>

      <button
        onClick={listRoles}
        disabled={loading}
        className="ml-3 rounded-lg border px-5 py-2.5 text-sm disabled:opacity-50"
      >
        List organization roles
      </button>

      {loading && (
        <p className="text-sm text-gray-500">
          Processing...
        </p>
      )}

      {error && (
        <pre className="whitespace-pre-wrap rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </pre>
      )}

      {message && (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm">
          {message}
        </pre>
      )}
    </div>
  );
}
