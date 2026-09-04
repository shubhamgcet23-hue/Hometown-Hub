import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";

function publicUser(user: any) {
  const { passwordHash, resetToken, resetTokenExpiry, email, ...rest } = user;
  return rest;
}

export const listUsers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { q, page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, take, skip, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);

  return success(res, { users: users.map(publicUser), total, page: Number(page), limit: take });
});

export const getUserByUsername = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    include: {
      communities: { include: { community: true } },
      _count: { select: { posts: true, createdEvents: true, eventAttendance: true } },
    },
  });
  if (!user) throw new ApiError(404, "User not found.");
  return success(res, { user: publicUser(user) });
});

export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (req.user!.id !== req.params.id) throw new ApiError(403, "You don't have permission to perform this action.");

  const { fullName, bio, hometown, city, state, country, profileImage } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { fullName, bio, hometown, city, state, country, profileImage },
  });
  return success(res, { user: publicUser(user) }, "Profile updated successfully.");
});

export const deleteAccount = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (req.user!.id !== req.params.id && req.user!.platformRole !== "PLATFORM_ADMIN") {
    throw new ApiError(403, "You don't have permission to perform this action.");
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  return success(res, {}, "Account deleted.");
});
