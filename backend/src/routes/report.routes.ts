import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createReportSchema } from "../validators/post.validators";

const router = Router();

router.get("/", requireAuth, reportController.listReports);
router.post("/", requireAuth, validateBody(createReportSchema), reportController.createReport);
router.put("/:id", requireAuth, reportController.resolveReport);

export default router;
