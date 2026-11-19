import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";
import GoogleAccountSettings from "@/components/google-account-settings";
import OrganizationSwitcher from "@/components/organization-switcher";
import ActiveOrganizationInfo from "@/components/active-organization-info";
export const instant = false;

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl rounded-xl border bg-white p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">TenantBoard Dashboard</h1>

          <SignOutButton />
        </div>

        <Link href="/settings/sessions" className="text-sm underline">
          Manage active sessions
        </Link>
        <br></br>
        <Link href="/settings/profile" className="text-sm underline">
          Manage profile
        </Link>
        <br></br>
        <Link href="/settings/password" className="text-sm underline">
          Password & Login Settings
        </Link>
        <br></br>
        <Link href="/settings/email" className="text-sm underline">
          Manage email address
        </Link>
        <br></br>
        <Link href="/settings/accounts" className="text-sm underline">
          Manage connected accounts
        </Link>
        <br></br>
        <Link href="/settings/security" className="text-sm underline">
          Security & Two-Factor Authentication
        </Link>
        <br></br>
        <Link href="/organizations" className="text-sm underline">
          Manage organizations
        </Link>
        <br></br>
        <Link href="/organizations/members" className="text-sm underline">
          View organization members
        </Link>
        <br></br>
        <Link href="/projects" className="text-sm underline">
          Manage projects
        </Link>
        <br></br>
        <Link href="/settings/roles" className="text-sm underline">
          Manage Roles & Permissions
        </Link>
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-medium">Welcome, {session.user.name}</h2>

          <div className="rounded-lg bg-gray-50 p-5">
            <p>
              <strong>User ID:</strong> {session.user.id}
            </p>

            <p>
              <strong>Email:</strong> {session.user.email}
            </p>

            <p>
              <strong>Email Verified:</strong>{" "}
              {session.user.emailVerified ? "Yes" : "No"}
            </p>

            <p>
              <strong>Session Expires:</strong>{" "}
              {session.session.expiresAt.toLocaleString()}
            </p>
          </div>

          <p className="text-sm text-green-700">
            You are successfully authenticated.
          </p>
        </div>
        <div className="mt-8">
          <OrganizationSwitcher />
        </div>
        <div className="mt-6">
          <ActiveOrganizationInfo />
        </div>
        <div className="mt-8">
          <GoogleAccountSettings />
        </div>
      </div>
    </main>
  );
}
