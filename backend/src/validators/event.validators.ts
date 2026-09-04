import { z } from "zod";

export const createEventSchema = z
  .object({
    communityId: z.string().uuid("Invalid community."),
    title: z.string().min(3, "Title must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    coverImage: z.string().optional(),
    location: z.string().min(1, "Location is required."),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    maxAttendees: z.number().int().positive().optional(),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "End time must be after start time.",
    path: ["endAt"],
  });

export const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  coverImage: z.string().optional(),
  location: z.string().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  maxAttendees: z.number().int().positive().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});
