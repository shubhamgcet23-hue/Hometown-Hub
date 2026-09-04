import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, userController.listUsers);
router.get("/:username", userController.getUserByUsername);
router.put("/:id", requireAuth, userController.updateProfile);
router.delete("/:id", requireAuth, userController.deleteAccount);

export default router;
