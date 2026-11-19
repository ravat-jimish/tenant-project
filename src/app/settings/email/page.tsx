import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import EmailSettings from "@/components/email-settings";

export const instant = false;

export default async function EmailSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Email Settings</h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage your registered email address.
        </p>

        <div className="mt-8">
          <EmailSettings
            currentEmail={session.user.email}
            emailVerified={session.user.emailVerified}
          />
        </div>
      </div>
    </main>
  );
}
