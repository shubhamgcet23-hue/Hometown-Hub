import { NextFunction, Response } from "express";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { AuthedRequest } from "./auth.middleware";

// Restricts a route to platform admins only.
export function requirePlatformAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return next(new ApiError(401, "Authentication required."));
  if (req.user.platformRole !== "PLATFORM_ADMIN") {
    return next(new ApiError(403, "You don't have permission to perform this action."));
  }
  next();
}

// Restricts a route to a community's moderators/admins (or platform admins,
// who have platform-wide access). Expects :communityId or :id (community) in params,
// or resolves the community from a post/event when communityIdResolver is given.
export function requireCommunityRole(minRole: "MODERATOR" | "ADMIN" = "MODERATOR") {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, "Authentication required.");
      if (req.user.platformRole === "PLATFORM_ADMIN") return next();

      const communityId = req.params.communityId || req.params.id;
      if (!communityId) throw new ApiError(400, "Community context missing.");

      const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: req.user.id } },
      });

      const rank = { MEMBER: 0, MODERATOR: 1, ADMIN: 2 } as const;
      if (!membership || rank[membership.role] < rank[minRole]) {
        throw new ApiError(403, "You don't have permission to perform this action.");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
