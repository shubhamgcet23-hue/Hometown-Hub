import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";

// Global search across communities, users, posts and events. Kept simple
// (ILIKE-based) so it works out of the box on plain PostgreSQL; swap for a
// dedicated search index (e.g. Postgres full-text or Meilisearch) as usage grows.
export const globalSearch = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q = "", type, city, category } = req.query as Record<string, string>;
  const query = q.trim();
  if (!query) return success(res, { communities: [], users: [], posts: [], events: [] });

  const wantsAll = !type;
  const [communities, users, posts, events] = await Promise.all([
    wantsAll || type === "communities"
      ? prisma.community.findMany({
          where: {
            status: "ACTIVE",
            name: { contains: query, mode: "insensitive" },
            ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
            ...(category ? { category } : {}),
          },
          take: 10,
        })
      : [],
    wantsAll || type === "users"
      ? prisma.user.findMany({
          where: {
            status: "ACTIVE",
            OR: [{ fullName: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }],
          },
          take: 10,
          select: { id: true, fullName: true, username: true, profileImage: true, city: true },
        })
      : [],
    wantsAll || type === "posts"
      ? prisma.post.findMany({
          where: { status: "PUBLISHED", content: { contains: query, mode: "insensitive" }, community: { privacy: "PUBLIC" } },
          take: 10,
          include: { author: { select: { username: true, fullName: true } }, community: { select: { slug: true, name: true } } },
        })
      : [],
    wantsAll || type === "events"
      ? prisma.event.findMany({
          where: { title: { contains: query, mode: "insensitive" } },
          take: 10,
          include: { community: { select: { slug: true, name: true } } },
        })
      : [],
  ]);

  return success(res, { communities, users, posts, events });
});
