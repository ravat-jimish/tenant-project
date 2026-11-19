/**
 * Application permission catalogue.
 *
 * This is the single source of truth for all
 * application-level resources and actions.
 *
 * Do not add Better Auth's internal "ac" resource here.
 */

export const applicationPermissions = {
  project: [
    "create",
    "read",
    "update",
    "delete",
    "archive",
    "restore",
    "assign",
    // "readAny",
    // "updateAny",
  ],

  invoice: [
    "create",
    "read",
    "update",
    "delete",
    "approve",
    "reject",
    "void",
    "export",
  ],

  report: ["read", "export", "share", "publish"],
} as const;

export const resourceLabels = {
  project: "Projects",
  invoice: "Invoices",
  report: "Reports",
} as const;

export const actionLabels: Record<string, string> = {
  create: "Create",
  read: "View",
  readAny: "Read all projects",
  update: "Update",
  updateAny: "Update any project",
  delete: "Delete",
  archive: "Archive",
  restore: "Restore",
  assign: "Assign",
  approve: "Approve",
  reject: "Reject",
  void: "Void",
  export: "Export",
  share: "Share",
  publish: "Publish",
};

export type ApplicationResource = keyof typeof applicationPermissions;
