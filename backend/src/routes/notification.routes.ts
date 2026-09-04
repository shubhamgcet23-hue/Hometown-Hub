import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, notificationController.listNotifications);
router.put("/:id/read", requireAuth, notificationController.markAsRead);
router.put("/read-all", requireAuth, notificationController.markAllAsRead);

export default router;
