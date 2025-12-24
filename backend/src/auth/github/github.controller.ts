import jwt from "jsonwebtoken";

import { Request, Response } from "express";
import { AuthService } from "./github.service";
import { prisma } from "../../config/prisma";

export class AuthController {
  static githubRedirect(_req: Request, res: Response) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: process.env.GITHUB_CALLBACK_URL!,
      scope: "read:user user:email repo",
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  static async githubCallback(req: Request, res: Response) {
    try {
      const code = req.query.code as string;
      if (!code) throw new Error("Missing GitHub code");
      const githubToken = await AuthService.getGithubAccessToken(code);
      const githubUser = await AuthService.getGithubUser(githubToken);
      const email = await AuthService.getGithubPrimaryEmail(githubToken);
      const user = await AuthService.findOrCreateGithubUser(
        githubUser,
        email,
        githubToken
      ); 
      const jwtToken = jwt.sign(
        { id: user?.id, email: user?.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      ); 
      console.log("Generated JWT Token for user:", jwtToken);
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${jwtToken}`);
    } catch (error) {
      console.error("GitHub OAuth failed:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  static async githubRepos(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new Error("Missing Authorization header");
      const token = authHeader.split(" ")[1];
      const verified = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
      if (!verified) throw new Error("Invalid token");
      const accessToken = await prisma.account.findFirst({
        where: {
          userId: verified.id,
          provider: "GITHUB",
        },
      }).then(acc => acc?.accessToken);
      if (!accessToken) throw new Error("GitHub account not linked");
      const repos = await AuthService.fetchAndStoreRepositories(req, accessToken);
      res.json(repos);
    } catch (error) {
      console.error("Failed to fetch GitHub repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  }
}
