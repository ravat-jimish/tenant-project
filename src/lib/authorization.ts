
import "server-only";

import { auth } from "@/lib/auth";

import type {
  ProjectAction,
} from "@/lib/permissions";
import { applicationPermissions } from "@/lib/permission-catalog";
/**
 * Check the current authenticated user's permission
 * within their active organization.
 */
export async function hasProjectPermission(
  requestHeaders: Headers,
  action: ProjectAction
): Promise<boolean> {
  const result = await auth.api.hasPermission({
    headers: requestHeaders,

    body: {
      permissions: {
        project: [action],
      },
    },
  });

  return result.success;
}



/**
 * Reusable authorization failure response.
 */
export function forbiddenResponse() {
  return Response.json(
    {
      error: "FORBIDDEN",
      message: "You do not have permission to perform this operation.",
    },
    {
      status: 403,
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
