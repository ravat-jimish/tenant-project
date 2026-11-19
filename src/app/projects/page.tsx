import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import ProjectManager from "@/components/project-manager";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Projects</h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage projects belonging to your active workspace.
        </p>

        <Suspense fallback={<ProjectsLoading />}>
          <AuthenticatedProjects />
        </Suspense>
      </div>
    </main>
  );
}

async function AuthenticatedProjects() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="mt-8">
      <ProjectManager />
    </div>
  );
}

function ProjectsLoading() {
  return (
    <div className="mt-8 space-y-8" aria-busy="true">
      <div className="h-64 animate-pulse rounded-xl border bg-white" />
      <div className="h-48 animate-pulse rounded-xl border bg-white" />
    </div>
  );
}
