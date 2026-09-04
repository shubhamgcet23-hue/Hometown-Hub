import { NotificationType } from "@prisma/client";
import { prisma } from "../config/db";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

export async function notifyMany(userIds: string[], input: Omit<CreateNotificationInput, "userId">) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ ...input, userId })),
  });
}
