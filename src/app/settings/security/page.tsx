import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import TwoFactorSettings from "@/components/two-factor-settings";
export const instant = false;

export default async function SecuritySettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Security Settings</h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage your account security and two-factor authentication.
        </p>

        <div className="mt-8">
          <TwoFactorSettings
            enabled={session.user.twoFactorEnabled ?? false}
            userEmail={session.user.email}
          />
        </div>
      </div>
    </main>
  );
}
