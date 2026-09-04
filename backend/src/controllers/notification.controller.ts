import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";

export const listNotifications = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page = "1", limit = "20" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: req.user!.id }, take, skip, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where: { userId: req.user!.id } }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  return success(res, { notifications, total, unreadCount, page: Number(page), limit: take });
});

export const markAsRead = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { isRead: true } });
  return success(res, {}, "Notification marked as read.");
});

export const markAllAsRead = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
  return success(res, {}, "All notifications marked as read.");
});
