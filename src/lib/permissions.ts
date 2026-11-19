import { createAccessControl } from "better-auth/plugins/access";

import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";
import { applicationPermissions } from "@/lib/permission-catalog";
/**
 * Central permission vocabulary.
 *
 * Every resource/action that can be assigned to a role
 * must be declared here.
 */
export const statement = {
  ...defaultStatements,

  ac: ["create", "read", "update", "delete"],

  ...applicationPermissions,
} as const;

export const ac = createAccessControl(statement);

/**
 * Owner: Full access to the application resources
 * and dynamic role management.
 */
export const owner = ac.newRole({
  ...ownerAc.statements,

  ac: ["create", "read", "update", "delete"],

  ...applicationPermissions,
});

/**
 * Admin: Full operational access and role management,
 * but no ownership-only organization privileges.
 */
export const admin = ac.newRole({
  ...adminAc.statements,

  ac: ["create", "read", "update", "delete"],

  ...applicationPermissions,
});

/**
 * Member: Read-only application access.
 * No permission to manage dynamic roles.
 */
export const member = ac.newRole({
  ...memberAc.statements,

  project: ["read"],

  invoice: ["read"],

  report: ["read"],
});

export const organizationRoles = {
  owner,
  admin,
  member,
};

export type ProjectAction = "create" | "read" | "update" | "delete";

// type RequestHeaders = Awaited<
//   ReturnType<typeof import("next/headers").headers>
// >;

// export type ProjectAction = (typeof applicationPermissions.project)[number];
