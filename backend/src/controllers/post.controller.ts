import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";
import { createNotification, notifyMany } from "../services/notification.service";

const POST_INCLUDE = {
  author: { select: { id: true, fullName: true, username: true, profileImage: true } },
  community: { select: { id: true, name: true, slug: true } },
  images: true,
  _count: { select: { likes: true, comments: true, shares: true } },
} as const;

async function assertCanAccessCommunity(userId: string | undefined, communityId: string) {
  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community || community.status !== "ACTIVE") throw new ApiError(404, "Unable to load community.");

  if (community.privacy === "PRIVATE") {
    const membership = userId
      ? await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } })
      : null;
    if (!membership) throw new ApiError(403, "You don't have permission to perform this action.");
  }
  return community;
}

export const listPosts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { communityId, page = "1", limit = "10" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 10, 30);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  let where: any = { status: "PUBLISHED" };

  if (communityId) {
    await assertCanAccessCommunity(req.user?.id, communityId);
    where.communityId = communityId;
  } else if (req.user) {
    // Home feed: posts from communities the current user has joined.
    const memberships = await prisma.communityMember.findMany({ where: { userId: req.user.id }, select: { communityId: true } });
    where.communityId = { in: memberships.map((m) => m.communityId) };
  } else {
    where.community = { privacy: "PUBLIC" };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      take,
      skip,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: POST_INCLUDE,
    }),
    prisma.post.count({ where }),
  ]);

  let likedPostIds = new Set<string>();
  if (req.user) {
    const likes = await prisma.like.findMany({
      where: { userId: req.user.id, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    likedPostIds = new Set(likes.map((l) => l.postId));
  }

  const enriched = posts.map((p) => ({ ...p, likedByMe: likedPostIds.has(p.id) }));
  return success(res, { posts: enriched, total, page: Number(page), limit: take });
});

export const getPost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: POST_INCLUDE });
  if (!post || post.status !== "PUBLISHED") throw new ApiError(404, "This post is no longer available.");
  return success(res, { post });
});

export const createPost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { communityId, content, type, images } = req.body;
  const community = await assertCanAccessCommunity(req.user!.id, communityId);

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: req.user!.id } },
  });
  if (!membership) throw new ApiError(403, "You must join this community before posting.");

  const isAnnouncement = type === "ANNOUNCEMENT";
  if (isAnnouncement && membership.role === "MEMBER") {
    throw new ApiError(403, "Only community admins or moderators can post announcements.");
  }

  const post = await prisma.post.create({
    data: {
      communityId,
      authorId: req.user!.id,
      content,
      type: type || "GENERAL",
      images: images?.length ? { create: images.map((url: string, order: number) => ({ url, order })) } : undefined,
    },
    include: POST_INCLUDE,
  });

  // Notify other members of the community about the new post.
  const members = await prisma.communityMember.findMany({
    where: { communityId, userId: { not: req.user!.id } },
    select: { userId: true },
  });
  await notifyMany(members.map((m) => m.userId), {
    type: "NEW_POST",
    title: `New post in ${community.name}`,
    message: content.slice(0, 120),
    relatedEntity: post.id,
  });

  return success(res, { post }, "Post created successfully.", 201);
});

export const updatePost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "This post is no longer available.");
  if (existing.authorId !== req.user!.id) throw new ApiError(403, "You don't have permission to perform this action.");

  const post = await prisma.post.update({ where: { id: req.params.id }, data: { content: req.body.content }, include: POST_INCLUDE });
  return success(res, { post }, "Post updated successfully.");
});

async function canModerate(userId: string, communityId: string, platformRole: string) {
  if (platformRole === "PLATFORM_ADMIN") return true;
  const membership = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
  return membership && membership.role !== "MEMBER";
}

export const deletePost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "This post is no longer available.");

  const isOwner = existing.authorId === req.user!.id;
  const isModerator = await canModerate(req.user!.id, existing.communityId, req.user!.platformRole);
  if (!isOwner && !isModerator) throw new ApiError(403, "You don't have permission to perform this action.");

  await prisma.post.delete({ where: { id: req.params.id } });
  return success(res, {}, "Post deleted.");
});

export const togglePin = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "This post is no longer available.");

  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { isPinned: !existing.isPinned },
    include: POST_INCLUDE,
  });
  return success(res, { post }, post.isPinned ? "Post pinned." : "Post unpinned.");
});

export const likePost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new ApiError(404, "This post is no longer available.");

  await prisma.like.upsert({
    where: { postId_userId: { postId: post.id, userId: req.user!.id } },
    update: {},
    create: { postId: post.id, userId: req.user!.id },
  });

  if (post.authorId !== req.user!.id) {
    await createNotification({
      userId: post.authorId,
      type: "NEW_LIKE",
      title: "Someone liked your post",
      message: "Your post received a new like.",
      relatedEntity: post.id,
    });
  }

  return success(res, {}, "Post liked.");
});

export const unlikePost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await prisma.like.deleteMany({ where: { postId: req.params.id, userId: req.user!.id } });
  return success(res, {}, "Like removed.");
});

export const sharePost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new ApiError(404, "This post is no longer available.");
  await prisma.share.create({ data: { postId: post.id, userId: req.user!.id } });
  return success(res, {}, "Post shared.");
});

export const listComments = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: req.params.id },
      take,
      skip,
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, fullName: true, username: true, profileImage: true } } },
    }),
    prisma.comment.count({ where: { postId: req.params.id } }),
  ]);

  return success(res, { comments, total, page: Number(page), limit: take });
});

export const createComment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new ApiError(404, "This post is no longer available.");

  const comment = await prisma.comment.create({
    data: { postId: post.id, authorId: req.user!.id, content: req.body.content },
    include: { author: { select: { id: true, fullName: true, username: true, profileImage: true } } },
  });

  if (post.authorId !== req.user!.id) {
    await createNotification({
      userId: post.authorId,
      type: "NEW_COMMENT",
      title: "New comment on your post",
      message: req.body.content.slice(0, 120),
      relatedEntity: post.id,
    });
  }

  return success(res, { comment }, "Comment added.", 201);
});

export const deleteComment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId }, include: { post: true } });
  if (!comment) throw new ApiError(404, "Comment not found.");

  const isOwner = comment.authorId === req.user!.id;
  const isModerator = await canModerate(req.user!.id, comment.post.communityId, req.user!.platformRole);
  if (!isOwner && !isModerator) throw new ApiError(403, "You don't have permission to perform this action.");

  await prisma.comment.delete({ where: { id: comment.id } });
  return success(res, {}, "Comment deleted.");
});

export const reportPost = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new ApiError(404, "This post is no longer available.");

  const report = await prisma.report.create({
    data: {
      reporterId: req.user!.id,
      targetType: "POST",
      postId: post.id,
      communityId: post.communityId,
      reason: req.body.reason,
      description: req.body.description,
    },
  });
  return success(res, { report }, "Thanks — this post has been reported for review.", 201);
});
