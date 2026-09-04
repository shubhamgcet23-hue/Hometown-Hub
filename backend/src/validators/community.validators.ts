import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters."),
  city: z.string().min(1, "City/Village is required."),
  state: z.string().min(1, "State is required."),
  country: z.string().min(1, "Country is required."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string().optional(),
  rules: z.string().optional(),
  privacy: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  coverImage: z.string().optional(),
  logoImage: z.string().optional(),
});

export const updateCommunitySchema = createCommunitySchema.partial();
