import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  twoFactorClient,
  organizationClient,
} from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";
import { ac, organizationRoles } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient({
      twoFactorPage: "/two-factor",
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
