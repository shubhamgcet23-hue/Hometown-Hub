import crypto from "crypto";
import { Response } from "express";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { AuthedRequest } from "../middleware/auth.middleware";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function publicUser(user: any) {
  const { passwordHash, resetToken, resetTokenExpiry, ...rest } = user;
  return rest;
}

export const register = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { fullName, username, email, password, hometown, city, state, country, profileImage } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw new ApiError(409, existing.email === email ? "An account with this email already exists." : "This username is already taken.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { fullName, username, email, passwordHash, hometown, city, state, country, profileImage },
  });

  const token = signToken({ userId: user.id, platformRole: user.platformRole });
  res.cookie("token", token, COOKIE_OPTIONS);
  return success(res, { user: publicUser(user), token }, "Account created successfully.", 201);
});

export const login = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid email or password.");

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) throw new ApiError(401, "Invalid email or password.");
  if (user.status === "SUSPENDED") throw new ApiError(403, "Your account has been suspended.");

  const token = signToken({ userId: user.id, platformRole: user.platformRole });
  res.cookie("token", token, COOKIE_OPTIONS);
  return success(res, { user: publicUser(user), token }, "Logged in successfully.");
});

export const logout = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  res.clearCookie("token");
  return success(res, {}, "Logged out successfully.");
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new ApiError(404, "User not found.");
  return success(res, { user: publicUser(user) });
});

export const forgotPassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond with success to avoid leaking which emails are registered.
  if (!user) return success(res, {}, "If that email exists, a reset link has been sent.");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });

  // In production this token is emailed via a transactional email provider.
  // For local development we return it directly so the flow is testable end-to-end.
  const payload: Record<string, unknown> = { message: "If that email exists, a reset link has been sent." };
  if (env.nodeEnv !== "production") payload.devResetToken = resetToken;
  return success(res, payload, "If that email exists, a reset link has been sent.");
});

export const resetPassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { token, password } = req.body;
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw new ApiError(400, "This reset link is invalid or has expired.");

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });
  return success(res, {}, "Password reset successfully. You can now log in.");
});
