import { Router } from "express";
import { triggerDeploy, getLatestDeployment } from "../deploy/deploy.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/projects/:id/deploy",
    authMiddleware,
    triggerDeploy
);

router.get(
    "/projects/:id/deploy",
    authMiddleware,
    getLatestDeployment
);

export default router;
