import "server-only";

import type { TenantContextResult } from "@/lib/tenant-context";

export function canManageProjects(
  context: Extract<TenantContextResult, { ok: true }>,
): boolean {
  return context.role === "owner" || context.role === "admin";
}
