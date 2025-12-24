import { Router } from "express"; 
import { authMiddleware, AuthRequest } from "../../middleware/auth.middleware"; 
import { UserController } from "./user.controller";

const router = Router(); 

router.get("/me", authMiddleware, UserController.getMe);

export default router;
