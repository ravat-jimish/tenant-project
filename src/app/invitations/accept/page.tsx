import { Suspense } from "react";
import AcceptInvitation from "@/components/accept-invitation";

export default function AcceptInvitationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Suspense fallback={<p>Loading invitation...</p>}>
        <AcceptInvitation />
      </Suspense>
    </main>
  );
}
