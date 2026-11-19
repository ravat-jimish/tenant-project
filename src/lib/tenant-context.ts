
import "server-only";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type TenantContextResult =
  | {
      ok: true;
      userId: string;
      organizationId: string;
      membershipId: string;
      role: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 409;
      code: string;
      message: string;
    };

export async function resolveTenantContext(
  requestHeaders: Headers
): Promise<TenantContextResult> {
  // 1. Validate authenticated session.
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    };
  }

  // 2. Retrieve active organization from session.
  const organizationId =
    session.session.activeOrganizationId;

  if (!organizationId) {
    return {
      ok: false,
      status: 409,
      code: "ACTIVE_ORGANIZATION_REQUIRED",
      message: "Select an active organization first.",
    };
  }

  // 3. Verify that the user is actually a member.
  const membership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
    },
  });

  if (!membership) {
    return {
      ok: false,
      status: 403,
      code: "ORGANIZATION_ACCESS_DENIED",
      message: "You are not a member of this organization.",
    };
  }

  // 4. Return trusted tenant context.
  return {
    ok: true,
    userId: session.user.id,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
  };
}

export function isSameOriginRequest(
  request: Request
): boolean {
  const origin = request.headers.get("origin");
  const baseURL = process.env.BETTER_AUTH_URL;

  if (!origin || !baseURL) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
}

export function tenantErrorResponse(
  result: Extract<TenantContextResult, { ok: false }>
) {
  return Response.json(
    {
      error: result.code,
      message: result.message,
    },
    {
      status: result.status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
