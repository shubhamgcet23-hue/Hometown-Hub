import { Response } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { success } from "../utils/response";
import { AuthedRequest } from "../middleware/auth.middleware";
import { notifyMany, createNotification } from "../services/notification.service";

const EVENT_INCLUDE = {
  organizer: { select: { id: true, fullName: true, username: true, profileImage: true } },
  community: { select: { id: true, name: true, slug: true } },
  _count: { select: { attendees: true } },
} as const;

export const listEvents = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { communityId, mine, page = "1", limit = "10" } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit, 10) || 10, 30);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where: any = {};
  if (communityId) where.communityId = communityId;
  if (mine && req.user) {
    where.OR = [{ organizerId: req.user.id }, { attendees: { some: { userId: req.user.id } } }];
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({ where, take, skip, orderBy: { startAt: "asc" }, include: EVENT_INCLUDE }),
    prisma.event.count({ where }),
  ]);
  return success(res, { events, total, page: Number(page), limit: take });
});

export const getEvent = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      ...EVENT_INCLUDE,
      attendees: { include: { user: { select: { id: true, fullName: true, username: true, profileImage: true } } } },
    },
  });
  if (!event) throw new ApiError(404, "Unable to load event.");
  return success(res, { event });
});

export const createEvent = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { communityId, title, description, coverImage, location, startAt, endAt, maxAttendees } = req.body;

  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: req.user!.id } },
  });
  if (!membership) throw new ApiError(403, "You must join this community to create events here.");

  const event = await prisma.event.create({
    data: { communityId, organizerId: req.user!.id, title, description, coverImage, location, startAt, endAt, maxAttendees },
    include: EVENT_INCLUDE,
  });

  const members = await prisma.communityMember.findMany({
    where: { communityId, userId: { not: req.user!.id } },
    select: { userId: true },
  });
  await notifyMany(members.map((m) => m.userId), {
    type: "EVENT_REMINDER",
    title: `New event: ${title}`,
    message: `A new event was created in your community.`,
    relatedEntity: event.id,
  });

  return success(res, { event }, "Event created successfully.", 201);
});

async function assertOrganizerOrModerator(userId: string, platformRole: string, event: { organizerId: string; communityId: string }) {
  if (event.organizerId === userId || platformRole === "PLATFORM_ADMIN") return;
  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: event.communityId, userId } },
  });
  if (!membership || membership.role === "MEMBER") throw new ApiError(403, "You don't have permission to perform this action.");
}

export const updateEvent = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Unable to load event.");
  await assertOrganizerOrModerator(req.user!.id, req.user!.platformRole, existing);

  const event = await prisma.event.update({ where: { id: req.params.id }, data: req.body, include: EVENT_INCLUDE });
  return success(res, { event }, "Event updated successfully.");
});

export const deleteEvent = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Unable to load event.");
  await assertOrganizerOrModerator(req.user!.id, req.user!.platformRole, existing);

  await prisma.event.delete({ where: { id: req.params.id } });
  return success(res, {}, "Event deleted.");
});

export const joinEvent = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id }, include: { _count: { select: { attendees: true } } } });
  if (!event) throw new ApiError(404, "Unable to load event.");
  if (event.status === "CANCELLED" || event.status === "COMPLETED") {
    throw new ApiError(400, "This event is no longer accepting registrations.");
  }

  const existing = await prisma.eventAttendee.findUnique({ where: { eventId_userId: { eventId: event.id, userId: req.user!.id } } });
  if (existing) throw new ApiError(409, "You've already joined this event.");

  if (event.maxAttendees && event._count.attendees >= event.maxAttendees) {
    throw new ApiError(400, "This event has reached its capacity.");
  }

  await prisma.eventAttendee.create({ data: { eventId: event.id, userId: req.user!.id } });

  await createNotification({
    userId: event.organizerId,
    type: "EVENT_REGISTRATION",
    title: "New event registration",
    message: `Someone joined your event "${event.title}".`,
    relatedEntity: event.id,
  });

  return success(res, {}, "You've joined the event.");
});

export const leaveEvent = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await prisma.eventAttendee.deleteMany({ where: { eventId: req.params.id, userId: req.user!.id } });
  return success(res, {}, "You've left the event.");
});
