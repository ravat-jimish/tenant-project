"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { useProjectPermissions } from "@/hooks/use-project-permissions";
import { appPath } from "@/lib/app-paths";
interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export default function ProjectManager() {
  const { data: activeOrganization, isPending: organizationLoading } =
    authClient.useActiveOrganization();
  const { permissions, loading: permissionsLoading } = useProjectPermissions(
    activeOrganization?.id,
  );
  const [projects, setProjects] = useState<Project[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProjects = useCallback(async () => {
    if (!activeOrganization?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(appPath("/api/projects"), {
        method: "GET",
        cache: "no-store",
      });

      const result: ApiResponse<Project[]> = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? result.error ?? "Unable to load projects.",
        );
      }

      setProjects(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(appPath("/api/projects"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const result: ApiResponse<Project> = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? result.error ?? "Unable to create project.",
        );
      }

      setName("");
      setDescription("");

      setMessage("Project created successfully.");

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create project.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(project: Project) {
    const newName = window.prompt("Enter the new project name:", project.name);

    if (newName === null || !newName.trim()) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        appPath(`/api/projects/${encodeURIComponent(project.id)}`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName,
          }),
        },
      );

      const result: ApiResponse<Project> = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? result.error ?? "Unable to update project.",
        );
      }

      setMessage("Project updated successfully.");

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update project.",
      );
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(`Delete project "${project.name}"?`);

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        appPath(`/api/projects/${encodeURIComponent(project.id)}`),
        {
          method: "DELETE",
        },
      );

      const result: ApiResponse<never> = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ?? result.error ?? "Unable to delete project.",
        );
      }

      setMessage("Project deleted successfully.");

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete project.",
      );
    }
  }

  if (organizationLoading) {
    return <p>Loading active workspace...</p>;
  }

  if (!activeOrganization) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h2 className="font-semibold">No active organization</h2>

        <p className="mt-2 text-sm text-gray-500">
          Select a workspace before managing projects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-6">
        <p className="text-xs text-gray-500">Active workspace</p>

        <h2 className="mt-1 text-lg font-semibold">
          {activeOrganization.name}
        </h2>
      </section>

      {permissionsLoading ? (
        <p>Checking permissions...</p>
      ) : permissions.create ? (
        <section className="rounded-xl border bg-white p-6">
          {/* Existing Create Project form */}

          <section className="rounded-xl border bg-white p-6">
            <h2 className="font-semibold">Create project</h2>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Project name
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Website Revamp"
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project description..."
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create project"}
              </button>
            </form>
          </section>
        </section>
      ) : null}
      <section className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Projects ({projects.length})</h2>

          <button
            onClick={loadProjects}
            disabled={loading}
            className="text-sm underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No projects found in this workspace.
          </p>
        ) : (
          <>
            {!permissionsLoading && !permissions.read ? (
              <p className="text-sm text-red-600">
                You don't have permission to view projects.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {project.description || "No description"}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          Created:{" "}
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        {permissions.update && (
                          <button
                            onClick={() => handleUpdate(project)}
                            className="text-sm underline"
                          >
                            Edit
                          </button>
                        )}

                        {permissions.delete && (
                          <button
                            onClick={() => handleDelete(project)}
                            className="text-sm text-red-600 underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {message && (
        <p className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {message}
        </p>
      )}
    </div>
  );
}
