import { Router } from "express";
import passport from "passport";
import { GoogleController } from "./google.controller";

const router = Router();

router.get("/health", (_req, res) => { res.status(200).send("Google Auth Service is healthy"); });
router.get("/", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/callback", passport.authenticate("google", { session: false }), GoogleController.GoogleCallback);

export default router;
