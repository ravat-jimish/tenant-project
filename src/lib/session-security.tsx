import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { SESSION_FRESH_AGE_SECONDS } from "@/lib/auth-config";

export async function getFreshSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "UNAUTHENTICATED" as const,
    };
  }

  const createdAt = session.session.createdAt.getTime();

  const ageInSeconds = (Date.now() - createdAt) / 1000;

  if (
    !Number.isFinite(ageInSeconds) ||
    ageInSeconds < 0 ||
    ageInSeconds >= SESSION_FRESH_AGE_SECONDS
  ) {
    return {
      status: "SESSION_NOT_FRESH" as const,
    };
  }

  return {
    status: "OK" as const,
    session,
  };
}
