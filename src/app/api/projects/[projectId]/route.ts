import { prisma } from "@/lib/prisma";

import {
  isSameOriginRequest,
  resolveTenantContext,
  tenantErrorResponse,
} from "@/lib/tenant-context";
import { canManageProjects } from "@/lib/project-access";
import { hasProjectPermission, forbiddenResponse } from "@/lib/authorization";
const responseHeaders = {
  "Cache-Control": "private, no-store",
};

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await resolveTenantContext(request.headers);

    if (!context.ok) {
      return tenantErrorResponse(context);
    }
    const allowed = await hasProjectPermission(request.headers, "read");

    if (!allowed) {
      return forbiddenResponse();
    }

    // const canReadAny = await hasProjectPermission(request.headers, "readAny");

    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: context.organizationId,
      },
    });

    if (!project) {
      return Response.json(
        { error: "PROJECT_NOT_FOUND" },
        { status: 404, headers: responseHeaders },
      );
    }

    return Response.json({ data: project }, { headers: responseHeaders });
  } catch {
    return Response.json(
      { error: "INTERNAL_ERROR" },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
    const allowed = await hasProjectPermission(request.headers, "update");

    if (!allowed) {
      return forbiddenResponse();
    }
    const { projectId } = await params;

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { error: "INVALID_REQUEST" },
        { status: 400, headers: responseHeaders },
      );
    }

    const payload = body as Record<string, unknown>;

    const updateData: {
      name?: string;
      description?: string | null;
    } = {};

    if ("name" in payload) {
      if (typeof payload.name !== "string") {
        return Response.json(
          { error: "INVALID_NAME" },
          { status: 400, headers: responseHeaders },
        );
      }

      const name = payload.name.trim();

      if (name.length < 2 || name.length > 100) {
        return Response.json(
          { error: "INVALID_NAME" },
          { status: 400, headers: responseHeaders },
        );
      }

      updateData.name = name;
    }

    if ("description" in payload) {
      if (
        payload.description !== null &&
        typeof payload.description !== "string"
      ) {
        return Response.json(
          { error: "INVALID_DESCRIPTION" },
          { status: 400, headers: responseHeaders },
        );
      }

      const description =
        typeof payload.description === "string"
          ? payload.description.trim()
          : null;

      if (description && description.length > 1000) {
        return Response.json(
          { error: "INVALID_DESCRIPTION" },
          { status: 400, headers: responseHeaders },
        );
      }

      updateData.description = description || null;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "NO_VALID_FIELDS" },
        { status: 400, headers: responseHeaders },
      );
    }

    // Both the project ID and tenant ID are part of the update filter.
    const result = await prisma.project.updateMany({
      where: {
        id: projectId,
        organizationId: context.organizationId,
      },
      data: updateData,
    });

    if (result.count === 0) {
      return Response.json(
        { error: "PROJECT_NOT_FOUND" },
        { status: 404, headers: responseHeaders },
      );
    }

    const updatedProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: context.organizationId,
      },
    });

    if (!updatedProject) {
      return Response.json(
        { error: "PROJECT_NOT_FOUND" },
        { status: 404, headers: responseHeaders },
      );
    }

    return Response.json(
      { data: updatedProject },
      { headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { error: "INTERNAL_ERROR" },
      { status: 500, headers: responseHeaders },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
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
    const allowed = await hasProjectPermission(request.headers, "delete");

    if (!allowed) {
      return forbiddenResponse();
    }
    const { projectId } = await params;

    const result = await prisma.project.deleteMany({
      where: {
        id: projectId,
        organizationId: context.organizationId,
      },
    });

    if (result.count === 0) {
      return Response.json(
        { error: "PROJECT_NOT_FOUND" },
        { status: 404, headers: responseHeaders },
      );
    }

    return Response.json(
      { message: "Project deleted successfully." },
      { headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { error: "INTERNAL_ERROR" },
      { status: 500, headers: responseHeaders },
    );
  }
}
