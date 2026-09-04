import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";
import { createNotification } from "../services/notification.service";
import { recordAudit } from "../services/audit.service";

// Generic report creation for any target type (post-specific reporting also
// exists at POST /api/posts/:id/report for convenience).
export const createReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { targetType, targetId, reason, description } = req.body;

  const data: any = { reporterId: req.user!.id, targetType, reason, description };
  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post) throw new ApiError(404, "Reported content not found.");
    data.postId = targetId;
    data.communityId = post.communityId;
  } else if (targetType === "COMMENT") {
    const comment = await prisma.comment.findUnique({ where: { id: targetId }, include: { post: true } });
    if (!comment) throw new ApiError(404, "Reported content not found.");
    data.commentId = targetId;
    data.communityId = comment.post.communityId;
  } else if (targetType === "COMMUNITY") {
    const community = await prisma.community.findUnique({ where: { id: targetId } });
    if (!community) throw new ApiError(404, "Reported content not found.");
    data.communityId = targetId;
  }
  // USER reports are stored without a direct FK target beyond reporter metadata.

  const report = await prisma.report.create({ data });
  return success(res, { report }, "Thanks — this has been reported for review.", 201);
});

export const listReports = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status, communityId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where: any = {};
  if (status) where.status = status;

  // Platform admins see everything (optionally filtered); community
  // moderators only see reports scoped to communities they moderate.
  if (req.user!.platformRole !== "PLATFORM_ADMIN") {
    const moderated = await prisma.communityMember.findMany({
      where: { userId: req.user!.id, role: { in: ["MODERATOR", "ADMIN"] } },
      select: { communityId: true },
    });
    where.communityId = { in: moderated.map((m) => m.communityId) };
  } else if (communityId) {
    where.communityId = communityId;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, fullName: true, username: true } },
        post: { select: { id: true, content: true } },
        comment: { select: { id: true, content: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return success(res, { reports, total, page: Number(page), limit: take });
});

export const resolveReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status, resolutionNote } = req.body as { status: "UNDER_REVIEW" | "RESOLVED" | "DISMISSED"; resolutionNote?: string };
  const existing = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Report not found.");

  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status, resolutionNote, resolvedById: req.user!.id, resolvedAt: new Date() },
  });

  await createNotification({
    userId: existing.reporterId,
    type: "REPORT_RESOLUTION",
    title: "Your report has been reviewed",
    message: resolutionNote || `Your report is now marked as ${status.toLowerCase().replace("_", " ")}.`,
    relatedEntity: report.id,
  });

  await recordAudit({ actorId: req.user!.id, action: "REPORT_RESOLVED", entity: "Report", entityId: report.id, metadata: { status } });

  return success(res, { report }, "Report updated.");
});
