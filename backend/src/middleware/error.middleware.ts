import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError";

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found", data: null });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, message: err.message, data: null });
  }

  console.error(err);
  const message =
    process.env.NODE_ENV === "production" ? "Something went wrong. Please try again." : (err as Error)?.message || "Unknown error";
  return res.status(500).json({ success: false, message, data: null });
}
