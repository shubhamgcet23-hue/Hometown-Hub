import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { verifyToken } from "../utils/jwt";

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    platformRole: string;
    status: string;
  };
}

// Reads the JWT from the Authorization header (Bearer) or an httpOnly cookie,
// verifies it, and attaches the current user to the request.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token = bearer || req.cookies?.token;

    if (!token) throw new ApiError(401, "Authentication required.");

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) throw new ApiError(401, "Invalid session. Please log in again.");
    if (user.status === "SUSPENDED") throw new ApiError(403, "Your account has been suspended.");

    req.user = { id: user.id, platformRole: user.platformRole, status: user.status };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Invalid or expired session. Please log in again."));
  }
}

// Attaches the user if a valid token is present, but never rejects the
// request. Useful for public endpoints that personalize output when logged in.
export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token = bearer || req.cookies?.token;
    if (!token) return next();

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (user && user.status !== "SUSPENDED") {
      req.user = { id: user.id, platformRole: user.platformRole, status: user.status };
    }
    next();
  } catch {
    next();
  }
}
