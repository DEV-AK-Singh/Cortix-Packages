import { Router } from "express";
import { triggerGenerator, getLatestInfraGen } from "./generator.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/projects/:id/gen",
    authMiddleware,
    triggerGenerator
);

router.get(
    "/projects/:id/gen",
    authMiddleware,
    getLatestInfraGen
);

router.get("/health", (_req, res) => {
    res.status(200).send("Infra Generator Service is healthy");
});

export default router;
