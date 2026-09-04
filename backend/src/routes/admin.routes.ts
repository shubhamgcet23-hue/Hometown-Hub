import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requirePlatformAdmin } from "../middleware/rbac.middleware";

const router = Router();

router.use(requireAuth, requirePlatformAdmin);

router.get("/dashboard", adminController.dashboard);
router.get("/users", adminController.listAllUsers);
router.put("/users/:id/status", adminController.updateUserStatus);
router.get("/communities", adminController.listAllCommunities);
router.put("/communities/:id/status", adminController.updateCommunityStatus);

export default router;
