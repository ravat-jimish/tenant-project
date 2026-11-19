"use client";

import { useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

interface ProjectPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

const deniedPermissions: ProjectPermissions = {
  read: false,
  create: false,
  update: false,
  delete: false,
};

export function useProjectPermissions(organizationId?: string) {
  const [permissions, setPermissions] =
    useState<ProjectPermissions>(deniedPermissions);

  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!organizationId) {
      setPermissions(deniedPermissions);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPermissions(deniedPermissions);

    try {
      const actions = ["read", "create", "update", "delete"] as const;

      const results = await Promise.all(
        actions.map((action) =>
          authClient.organization.hasPermission({
            permissions: {
              project: [action],
            },
          }),
        ),
      );

      setPermissions({
        read: results[0].data?.success ?? false,
        create: results[1].data?.success ?? false,
        update: results[2].data?.success ?? false,
        delete: results[3].data?.success ?? false,
      });
    } catch {
      setPermissions(deniedPermissions);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  return {
    permissions,
    loading,
    refresh: loadPermissions,
  };
}
