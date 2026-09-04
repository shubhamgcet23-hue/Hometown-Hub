import { Response } from "express";
import slugify from "slugify";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";
import { createNotification } from "../services/notification.service";
import { recordAudit } from "../services/audit.service";

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export const listCommunities = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q, city, category, page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where: any = { status: "ACTIVE" };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (category) where.category = category;

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true, posts: true } } },
    }),
    prisma.community.count({ where }),
  ]);

  return success(res, { communities, total, page: Number(page), limit: take });
});

export const getCommunity = asyncHandler(async (req: AuthedRequest, res: Response) => {
  // Accepts either the community's UUID or its human-readable slug so the
  // same endpoint serves both internal links (by id) and public URLs (by slug).
  const community = await prisma.community.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    include: {
      _count: { select: { members: true, posts: true, events: true } },
      createdBy: { select: { id: true, fullName: true, username: true, profileImage: true } },
    },
  });
  if (!community) throw new ApiError(404, "Unable to load community.");

  let membership = null;
  if (req.user) {
    membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: req.user.id } },
    });
  }

  return success(res, { community, membership });
});

// Users submit a request; new communities start PENDING until a platform admin approves them.
export const createCommunity = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { name, city, state, country, description, category, rules, privacy, coverImage, logoImage } = req.body;
  const slug = await uniqueSlug(name);

  const community = await prisma.community.create({
    data: {
      name,
      slug,
      city,
      state,
      country,
      description,
      category,
      rules,
      privacy,
      coverImage,
      logoImage,
      status: "PENDING",
      createdById: req.user!.id,
    },
  });

  await recordAudit({ actorId: req.user!.id, action: "COMMUNITY_REQUESTED", entity: "Community", entityId: community.id });
  return success(res, { community }, "Your community request has been submitted for review.", 201);
});

export const updateCommunity = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const community = await prisma.community.update({ where: { id: req.params.id }, data: req.body });
  return success(res, { community }, "Community updated successfully.");
});

export const deleteCommunity = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await prisma.community.delete({ where: { id: req.params.id } });
  return success(res, {}, "Community deleted.");
});

export const joinCommunity = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const community = await prisma.community.findUnique({ where: { id: req.params.id } });
  if (!community || community.status !== "ACTIVE") throw new ApiError(404, "This community is awaiting approval.");

  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: req.user!.id } },
  });
  if (existing) throw new ApiError(409, "You're already a member of this community.");

  if (community.privacy === "PUBLIC") {
    const member = await prisma.communityMember.create({
      data: { communityId: community.id, userId: req.user!.id, role: "MEMBER" },
    });
    return success(res, { member }, "You've joined the community.");
  }

  // Private community: create (or reuse) a pending join request instead.
  const existingRequest = await prisma.communityJoinRequest.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: req.user!.id } },
  });
  if (existingRequest && existingRequest.status === "PENDING") {
    throw new ApiError(409, "You already have a pending request for this community.");
  }

  const joinRequest = await prisma.communityJoinRequest.upsert({
    where: { communityId_userId: { communityId: community.id, userId: req.user!.id } },
    update: { status: "PENDING", resolvedAt: null },
    create: { communityId: community.id, userId: req.user!.id, status: "PENDING" },
  });
  return success(res, { joinRequest }, "Your request to join has been sent to the moderators.");
});

export const leaveCommunity = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: req.params.id, userId: req.user!.id } },
  });
  if (!membership) throw new ApiError(404, "You're not a member of this community.");

  await prisma.communityMember.delete({ where: { id: membership.id } });
  return success(res, {}, "You've left the community.");
});

export const listMembers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const community = await prisma.community.findUnique({ where: { id: req.params.id } });
  if (!community) throw new ApiError(404, "Unable to load community.");

  // Private community member lists are not publicly exposed.
  if (community.privacy === "PRIVATE") {
    const membership = req.user
      ? await prisma.communityMember.findUnique({
          where: { communityId_userId: { communityId: community.id, userId: req.user.id } },
        })
      : null;
    if (!membership && req.user?.platformRole !== "PLATFORM_ADMIN") {
      throw new ApiError(403, "You don't have permission to perform this action.");
    }
  }

  const members = await prisma.communityMember.findMany({
    where: { communityId: req.params.id },
    include: { user: { select: { id: true, fullName: true, username: true, profileImage: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return success(res, { members });
});

export const listJoinRequests = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const requests = await prisma.communityJoinRequest.findMany({
    where: { communityId: req.params.id, status: "PENDING" },
    include: { user: { select: { id: true, fullName: true, username: true, profileImage: true } } },
    orderBy: { createdAt: "asc" },
  });
  return success(res, { requests });
});

export const approveMember = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id: communityId, userId } = req.params;
  const joinRequest = await prisma.communityJoinRequest.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!joinRequest || joinRequest.status !== "PENDING") throw new ApiError(404, "No pending request found.");

  await prisma.$transaction([
    prisma.communityJoinRequest.update({
      where: { id: joinRequest.id },
      data: { status: "APPROVED", resolvedAt: new Date() },
    }),
    prisma.communityMember.create({ data: { communityId, userId, role: "MEMBER" } }),
  ]);

  await createNotification({
    userId,
    type: "MEMBERSHIP_APPROVED",
    title: "Membership approved",
    message: "Your request to join the community has been approved.",
    relatedEntity: communityId,
  });

  return success(res, {}, "Member request approved.");
});

export const rejectMember = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id: communityId, userId } = req.params;
  const joinRequest = await prisma.communityJoinRequest.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!joinRequest || joinRequest.status !== "PENDING") throw new ApiError(404, "No pending request found.");

  await prisma.communityJoinRequest.update({
    where: { id: joinRequest.id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });

  await createNotification({
    userId,
    type: "MEMBERSHIP_REJECTED",
    title: "Membership request declined",
    message: "Your request to join the community was not approved.",
    relatedEntity: communityId,
  });

  return success(res, {}, "Member request rejected.");
});

export const removeMember = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id: communityId, userId } = req.params;
  await prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } }).catch(() => {
    throw new ApiError(404, "Member not found.");
  });
  return success(res, {}, "Member removed from community.");
});

export const setModerator = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id: communityId, userId } = req.params;
  const { role } = req.body as { role: "MEMBER" | "MODERATOR" | "ADMIN" };

  const member = await prisma.communityMember.update({
    where: { communityId_userId: { communityId, userId } },
    data: { role },
  });

  await createNotification({
    userId,
    type: "MODERATOR_ACTION",
    title: "Your community role changed",
    message: `You are now a ${role.toLowerCase()} of this community.`,
    relatedEntity: communityId,
  });

  return success(res, { member }, "Member role updated.");
});
