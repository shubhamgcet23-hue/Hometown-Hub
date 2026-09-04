import { Router } from "express";
import * as communityController from "../controllers/community.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import { requireCommunityRole } from "../middleware/rbac.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createCommunitySchema, updateCommunitySchema } from "../validators/community.validators";

const router = Router();

router.get("/", optionalAuth, communityController.listCommunities);
router.get("/:id", optionalAuth, communityController.getCommunity);
router.post("/", requireAuth, validateBody(createCommunitySchema), communityController.createCommunity);
router.put("/:id", requireAuth, requireCommunityRole("ADMIN"), validateBody(updateCommunitySchema), communityController.updateCommunity);
router.delete("/:id", requireAuth, requireCommunityRole("ADMIN"), communityController.deleteCommunity);

router.post("/:id/join", requireAuth, communityController.joinCommunity);
router.post("/:id/leave", requireAuth, communityController.leaveCommunity);

router.get("/:id/members", optionalAuth, communityController.listMembers);
router.get("/:id/join-requests", requireAuth, requireCommunityRole("MODERATOR"), communityController.listJoinRequests);
router.post("/:id/members/:userId/approve", requireAuth, requireCommunityRole("MODERATOR"), communityController.approveMember);
router.post("/:id/members/:userId/reject", requireAuth, requireCommunityRole("MODERATOR"), communityController.rejectMember);
router.delete("/:id/members/:userId", requireAuth, requireCommunityRole("MODERATOR"), communityController.removeMember);
router.put("/:id/members/:userId/role", requireAuth, requireCommunityRole("ADMIN"), communityController.setModerator);

export default router;
