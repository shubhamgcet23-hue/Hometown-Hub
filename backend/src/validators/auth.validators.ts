import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters."),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters.")
      .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, dots and underscores."),
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/\d/, "Password must include a number.")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character."),
    confirmPassword: z.string(),
    hometown: z.string().optional(),
    city: z.string().min(1, "City/Village is required."),
    state: z.string().min(1, "State is required."),
    country: z.string().min(1, "Country is required."),
    profileImage: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/\d/, "Password must include a number.")
      .regex(/[^A-Za-z0-9]/, "Password must include a special character."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
