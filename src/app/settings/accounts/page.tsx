import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AccountConnections from "@/components/account-connections";

export const instant = false;

export default async function AccountsSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">
          Connected Accounts
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage the authentication methods connected
          to your TenantBoard identity.
        </p>

        <div className="mt-8">
          <AccountConnections />
        </div>
      </div>
    </main>
  );
}