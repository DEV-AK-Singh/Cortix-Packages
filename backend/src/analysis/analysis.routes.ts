import { Router } from "express";
import {
    triggerAnalysis,
    getLatestAnalysis,
} from "./analysis.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/projects/:id",
    authMiddleware,
    triggerAnalysis
);

router.get(
    "/projects/:id",
    authMiddleware,
    getLatestAnalysis
);

export default router;
