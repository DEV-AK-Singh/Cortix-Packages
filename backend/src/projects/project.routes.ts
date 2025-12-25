import { Router } from "express";
import { createProject, getBranches } from "./project.controller"; 
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/projects", authMiddleware, createProject);
router.get("/repos/:repoOwner/:repoName/branches", authMiddleware, getBranches);

export default router;
