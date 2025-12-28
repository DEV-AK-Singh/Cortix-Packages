import { Router } from "express";
import { triggerPlanner, getLatestInfraPlan } from "./planner.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/projects/:id/plan",
    authMiddleware,
    triggerPlanner
);

router.get(
    "/projects/:id/plan",
    authMiddleware,
    getLatestInfraPlan
);

router.get("/health", (_req, res) => {
    res.status(200).send("Infra Planner Service is healthy");
});

export default router;
