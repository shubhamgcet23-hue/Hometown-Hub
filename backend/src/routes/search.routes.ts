import { Router } from "express";
import { globalSearch } from "../controllers/search.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();
router.get("/", optionalAuth, globalSearch);
export default router;
