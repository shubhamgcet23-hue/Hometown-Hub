import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/apiError";

// Validates req.body against a Zod schema and replaces it with the parsed
// (and type-coerced) result, so downstream handlers get trusted input.
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(" ");
      return next(new ApiError(400, message || "Invalid input."));
    }
    req.body = result.data;
    next();
  };
}
