import { Router } from "express";
import { createProject, getBranches, getProjectById, getProjects } from "./project.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/projects", authMiddleware, createProject);
router.get("/projects", authMiddleware, getProjects);
router.get("/projects/:repoId/branches/:repoBranch", authMiddleware, getProjectById);
router.get("/repos/:repoOwner/:repoName/branches", authMiddleware, getBranches);

export default router;
