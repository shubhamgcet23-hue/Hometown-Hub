import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";

// Local community service-provider onboarding. Kept generic ("Pandit" is the
// v1 label) so it can later expand into a broader local-services directory
// without schema changes: the model already supports arbitrary services,
// availability text, and per-community scoping.
export const createProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.panditProfile.findUnique({ where: { userId: req.user!.id } });
  if (existing) throw new ApiError(409, "You already have a profile submitted.");

  const profile = await prisma.panditProfile.create({
    data: { ...req.body, userId: req.user!.id, verificationStatus: "PENDING" },
  });
  return success(res, { profile }, "Your profile has been submitted for verification.", 201);
});

export const listProfiles = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { communityId, status } = req.query as Record<string, string>;
  const where: any = {};
  if (communityId) where.communityId = communityId;
  if (status) where.verificationStatus = status;
  else where.verificationStatus = "VERIFIED"; // public listing defaults to verified only

  const profiles = await prisma.panditProfile.findMany({
    where,
    include: { user: { select: { id: true, fullName: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });
  return success(res, { profiles });
});

export const getProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const profile = await prisma.panditProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, fullName: true, username: true } }, community: true },
  });
  if (!profile) throw new ApiError(404, "Profile not found.");
  return success(res, { profile });
});

export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.panditProfile.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Profile not found.");
  if (existing.userId !== req.user!.id && req.user!.platformRole !== "PLATFORM_ADMIN") {
    throw new ApiError(403, "You don't have permission to perform this action.");
  }

  const profile = await prisma.panditProfile.update({ where: { id: req.params.id }, data: req.body });
  return success(res, { profile }, "Profile updated.");
});

export const verifyProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = req.body as { status: "VERIFIED" | "REJECTED" };
  const profile = await prisma.panditProfile.update({
    where: { id: req.params.id },
    data: { verificationStatus: status },
  });
  return success(res, { profile }, `Profile ${status.toLowerCase()}.`);
});
