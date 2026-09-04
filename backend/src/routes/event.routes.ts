import { Router } from "express";
import * as eventController from "../controllers/event.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createEventSchema, updateEventSchema } from "../validators/event.validators";

const router = Router();

router.get("/", optionalAuth, eventController.listEvents);
router.post("/", requireAuth, validateBody(createEventSchema), eventController.createEvent);
router.get("/:id", optionalAuth, eventController.getEvent);
router.put("/:id", requireAuth, validateBody(updateEventSchema), eventController.updateEvent);
router.delete("/:id", requireAuth, eventController.deleteEvent);
router.post("/:id/join", requireAuth, eventController.joinEvent);
router.delete("/:id/join", requireAuth, eventController.leaveEvent);

export default router;
