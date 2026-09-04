import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Global API rate limit; auth endpoints get a stricter limit below.
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);

// Serve locally uploaded images. Swap for S3/Cloudinary URLs in production
// by changing the multer storage engine in upload.middleware.ts.
app.use(`/${env.uploadDir}`, express.static(path.join(process.cwd(), env.uploadDir)));

app.get("/api/health", (_req, res) => res.json({ success: true, message: "Hometown Hub API is running.", data: null }));

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
