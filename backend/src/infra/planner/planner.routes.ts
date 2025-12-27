import { Router } from "express";
import { InfraController } from "./planner.controller"; 
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
const controller = new InfraController();

// Generate the plan
router.post("/projects/:id/plan", authMiddleware, controller.planInfrastructure);

// Fetch existing plan
router.get("/projects/:id/plan", authMiddleware, controller.getPlan);

export default router;