import { z } from "zod";

export const createPostSchema = z.object({
  communityId: z.string().uuid("Invalid community."),
  content: z.string().min(1, "Post content cannot be empty."),
  type: z.enum(["GENERAL", "ANNOUNCEMENT", "DISCUSSION", "EVENT", "POLL"]).default("GENERAL"),
  images: z.array(z.string()).optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1, "Post content cannot be empty."),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty."),
});

export const createReportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER", "COMMUNITY"]),
  targetId: z.string().min(1, "Target is required."),
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "HATE_SPEECH",
    "INAPPROPRIATE_CONTENT",
    "FAKE_INFORMATION",
    "FRAUD_SCAM",
    "OTHER",
  ]),
  description: z.string().optional(),
});
