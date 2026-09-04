import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import communityRoutes from "./community.routes";
import postRoutes from "./post.routes";
import eventRoutes from "./event.routes";
import notificationRoutes from "./notification.routes";
import reportRoutes from "./report.routes";
import adminRoutes from "./admin.routes";
import panditRoutes from "./pandit.routes";
import searchRoutes from "./search.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/communities", communityRoutes);
router.use("/posts", postRoutes);
router.use("/events", eventRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/admin", adminRoutes);
router.use("/pandit", panditRoutes);
router.use("/search", searchRoutes);
router.use("/upload", uploadRoutes);

export default router;
