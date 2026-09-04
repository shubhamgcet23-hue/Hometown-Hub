import { Router } from "express";
import * as panditController from "../controllers/pandit.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import { requirePlatformAdmin } from "../middleware/rbac.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createPanditSchema, updatePanditSchema } from "../validators/pandit.validators";

const router = Router();

router.post("/", requireAuth, validateBody(createPanditSchema), panditController.createProfile);
router.get("/", optionalAuth, panditController.listProfiles);
router.get("/:id", optionalAuth, panditController.getProfile);
router.put("/:id", requireAuth, validateBody(updatePanditSchema), panditController.updateProfile);
router.put("/:id/verify", requireAuth, requirePlatformAdmin, panditController.verifyProfile);

export default router;
