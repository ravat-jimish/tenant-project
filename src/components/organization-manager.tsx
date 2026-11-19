"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";

interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OrganizationManager() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.organization.list();

      if (error) {
        setError(error.message || "Unable to load organizations.");
        return;
      }

      setOrganizations(
        (data ?? []).map((organization) => ({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        })),
      );
    } catch {
      setError("Unable to load organizations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanSlug = slugify(slug);

    if (cleanName.length < 2) {
      setError("Organization name must contain at least 2 characters.");
      return;
    }

    if (cleanName.length > 100) {
      setError("Organization name is too long.");
      return;
    }

    if (!cleanSlug || cleanSlug.length < 2) {
      setError("Please enter a valid organization slug.");
      return;
    }

    setCreating(true);

    try {
      const { error } = await authClient.organization.create({
        name: cleanName,
        slug: cleanSlug,
        keepCurrentActiveOrganization: false,
      });

      if (error) {
        setError(error.message || "Unable to create organization.");
        return;
      }

      setMessage("Organization created successfully.");

      setName("");
      setSlug("");
      setSlugEdited(false);

      await loadOrganizations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create organization.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">Create organization</h2>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Organization name
            </label>

            <input
              required
              value={name}
              maxLength={100}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Technologies"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Organization slug
            </label>

            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="acme-technologies"
              className="w-full rounded-lg border px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Unique workspace identifier.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create organization"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your organizations</h2>

          <button
            onClick={loadOrganizations}
            disabled={loading}
            className="text-sm underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">Loading organizations...</p>
        ) : organizations.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            You haven't joined any organizations yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {organizations.map((organization) => (
              <div key={organization.id} className="rounded-lg border p-4">
                <h3 className="font-medium">{organization.name}</h3>

                <p className="mt-1 text-sm text-gray-500">
                  Slug: {organization.slug}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  ID: {organization.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
