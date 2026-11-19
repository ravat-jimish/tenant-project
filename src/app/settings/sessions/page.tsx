import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SessionManager from "@/components/session-manager";

export const instant = false;

export default async function SessionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Active Sessions</h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage devices that are currently signed in to your account.
        </p>

        <div className="mt-8">
          <SessionManager currentSessionId={session.session.id} />
        </div>
      </div>
    </main>
  );
}
