import { prisma } from "@/lib/prisma";

import {
  isSameOriginRequest,
  resolveTenantContext,
  tenantErrorResponse,
} from "@/lib/tenant-context";
import { canManageProjects } from "@/lib/project-access";
const responseHeaders = {
  "Cache-Control": "private, no-store",
};
import { hasProjectPermission, forbiddenResponse } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const context = await resolveTenantContext(request.headers);

    if (!context.ok) {
      return tenantErrorResponse(context);
    }
    const allowed = await hasProjectPermission(request.headers, "read");

    if (!allowed) {
      return forbiddenResponse();
    }

    const projects = await prisma.project.findMany({
      where: {
        organizationId: context.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        organizationId: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(
      { data: projects },
      {
        headers: responseHeaders,
      },
    );
  } catch {
    return Response.json(
      { error: "INTERNAL_ERROR", message: "Unable to retrieve projects." },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "INVALID_ORIGIN" },
      { status: 403, headers: responseHeaders },
    );
  }

  try {
    const context = await resolveTenantContext(request.headers);

    if (!context.ok) {
      return tenantErrorResponse(context);
    }

    const allowed = await hasProjectPermission(request.headers, "create");

    if (!allowed) {
      return forbiddenResponse();
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { error: "INVALID_REQUEST" },
        { status: 400, headers: responseHeaders },
      );
    }

    const payload = body as Record<string, unknown>;

    const name = typeof payload.name === "string" ? payload.name.trim() : "";

    const description =
      typeof payload.description === "string" ? payload.description.trim() : "";

    if (name.length < 2 || name.length > 100) {
      return Response.json(
        {
          error: "INVALID_NAME",
          message: "Project name must contain 2–100 characters.",
        },
        { status: 400, headers: responseHeaders },
      );
    }

    if (description.length > 1000) {
      return Response.json(
        {
          error: "INVALID_DESCRIPTION",
          message: "Description cannot exceed 1000 characters.",
        },
        { status: 400, headers: responseHeaders },
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,

        // Always obtained from trusted server context.
        organizationId: context.organizationId,
        createdById: context.userId,
      },
    });

    return Response.json(
      { data: project },
      {
        status: 201,
        headers: responseHeaders,
      },
    );
  } catch {
    return Response.json(
      { error: "INTERNAL_ERROR", message: "Unable to create project." },
      { status: 500, headers: responseHeaders },
    );
  }
}
