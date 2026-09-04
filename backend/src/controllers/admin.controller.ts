import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";
import { createNotification } from "../services/notification.service";
import { recordAudit } from "../services/audit.service";

export const dashboard = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const [
    totalUsers,
    activeUsers,
    totalCommunities,
    pendingCommunities,
    totalPosts,
    totalEvents,
    pendingReports,
    activeModerators,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.community.count({ where: { status: "ACTIVE" } }),
    prisma.community.count({ where: { status: "PENDING" } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.event.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.communityMember.count({ where: { role: { in: ["MODERATOR", "ADMIN"] } } }),
  ]);

  // Simple day-bucketed growth series for the last 14 days (for admin charts).
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const [newUsers, newCommunities, newPosts] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.community.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.post.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  function bucketByDay(rows: { createdAt: Date }[]) {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const key = r.createdAt.toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }

  return success(res, {
    cards: {
      totalUsers,
      activeUsers,
      totalCommunities,
      pendingCommunities,
      totalPosts,
      totalEvents,
      pendingReports,
      activeModerators,
    },
    charts: {
      userGrowth: bucketByDay(newUsers),
      communityGrowth: bucketByDay(newCommunities),
      postsPerDay: bucketByDay(newPosts),
    },
  });
});

export const listAllUsers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where: any = {};
  if (status) where.status = status;
  if (q) where.OR = [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, take, skip, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);

  return success(res, {
    users: users.map(({ passwordHash, resetToken, resetTokenExpiry, ...u }) => u),
    total,
    page: Number(page),
    limit: take,
  });
});

export const updateUserStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" };
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });

  await recordAudit({
    actorId: req.user!.id,
    action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
    entity: "User",
    entityId: user.id,
  });

  return success(res, {}, status === "SUSPENDED" ? "User suspended." : "User activated.");
});

export const listAllCommunities = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where: any = {};
  if (status) where.status = status;

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, fullName: true, username: true } }, _count: { select: { members: true } } },
    }),
    prisma.community.count({ where }),
  ]);

  return success(res, { communities, total, page: Number(page), limit: take });
});

export const updateCommunityStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = req.body as { status: "ACTIVE" | "REJECTED" | "SUSPENDED" };
  const community = await prisma.community.findUnique({ where: { id: req.params.id } });
  if (!community) throw new ApiError(404, "Community not found.");

  const updated = await prisma.community.update({ where: { id: req.params.id }, data: { status } });

  // Approving a community makes its creator the first community admin.
  if (status === "ACTIVE" && community.status === "PENDING") {
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId: community.id, userId: community.createdById } },
      update: { role: "ADMIN" },
      create: { communityId: community.id, userId: community.createdById, role: "ADMIN" },
    });
  }

  await createNotification({
    userId: community.createdById,
    type: "MODERATOR_ACTION",
    title: `Community ${status.toLowerCase()}`,
    message: `Your community "${community.name}" is now ${status.toLowerCase()}.`,
    relatedEntity: community.id,
  });

  await recordAudit({
    actorId: req.user!.id,
    action: `COMMUNITY_${status}`,
    entity: "Community",
    entityId: community.id,
  });

  return success(res, { community: updated }, "Community status updated.");
});
