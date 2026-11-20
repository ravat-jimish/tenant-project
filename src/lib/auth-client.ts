import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  twoFactorClient,
  organizationClient,
} from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";
import { ac, organizationRoles } from "@/lib/permissions";
import { appPath } from "@/lib/app-paths";

export const authClient = createAuthClient({
  basePath: appPath("/api/auth"),
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({
      twoFactorPage: appPath("/two-factor"),
    }),
    organizationClient({
      ac,
      roles: organizationRoles,
      dynamicAccessControl: {
        enabled: true,
      },
    }),
  ],
});
