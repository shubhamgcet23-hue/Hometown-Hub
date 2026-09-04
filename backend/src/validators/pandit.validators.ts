import { z } from "zod";

export const createPanditSchema = z.object({
  name: z.string().min(2, "Name is required."),
  communityId: z.string().uuid().optional(),
  location: z.string().min(1, "Location is required."),
  description: z.string().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  servicesOffered: z.array(z.string()).default([]),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  availability: z.string().optional(),
  profileImage: z.string().optional(),
});

export const updatePanditSchema = createPanditSchema.partial();
