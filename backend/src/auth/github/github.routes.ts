import { Router } from "express";
import { AuthController } from "./github.controller"; 
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/health", (_req, res) => { res.status(200).send("Github Auth Service is healthy"); });
router.get("/", AuthController.githubRedirect);
router.get("/callback", AuthController.githubCallback); 
router.get("/repos", authMiddleware, AuthController.githubRepos);

export default router;
