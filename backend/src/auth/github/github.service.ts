import { prisma } from "../../config/prisma";

import crypto from "crypto";
import { AuthRequest } from "../../middleware/auth.middleware";

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAIL_URL = "https://api.github.com/user/emails";

export class AuthService {
  static async getGithubAccessToken(code: string): Promise<string> {
    const res = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    });
    const data = await res.json() as { access_token?: string; error?: string };
    if (!data.access_token) throw new Error("GitHub token exchange failed");
    return data.access_token;
  }

  static async getGithubUser(token: string): Promise<{
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
  }> {
    const res = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return res.json() as Promise<{
      id: number;
      login: string;
      name: string | null;
      avatar_url: string;
    }>;
  }

  static async getGithubPrimaryEmail(token: string): Promise<string | null> {
    const res = await fetch(GITHUB_EMAIL_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const emails = (await res.json()) as Array<{ email: string; primary: boolean }>;
    return emails.find(e => e.primary)?.email ?? null;
  }

  static async findOrCreateGithubUser(
    githubUser: {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string;
    },
    email: string | null,
    accessToken: string
  ) {

    if (!email) {
      throw new Error("GitHub email not available");
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: githubUser.name,
          avatar: githubUser.avatar_url,
        },
      });
    }

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "GITHUB",
          providerAccountId: githubUser.id.toString(),
        },
      },
      update: {
        accessToken,
        refreshToken: crypto.randomBytes(64).toString("hex"),
      },
      create: {
        userId: user.id,
        provider: "GITHUB",
        providerAccountId: githubUser.id.toString(),
        accessToken,
        refreshToken: crypto.randomBytes(64).toString("hex"),
      },
    });

    return user;
  }

  static async fetchAndStoreRepositories(req: AuthRequest, token: string) {

    let page = 1;
    const perPage = 100;
    let allRepos: any[] = [];

    while (true) {
      const repos: any = await fetch(`https://api.github.com/user/repos?per_page=${perPage}&page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }).then(res => res.json()); 

      allRepos = allRepos.concat(repos);
      if (repos.length < perPage) break;
      page++;
    } 

    // const repos: any = await fetch("https://api.github.com/user/repos", {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     Accept: "application/json",
    //   },
    // }).then(res => res.json()); 

    for (const repo of allRepos) {
      await prisma.repository.upsert({
        where: {
          provider_repoId: {
            provider: "GITHUB",
            repoId: repo.id.toString(),
          },
        },
        update: {
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
        },
        create: {
          userId: req.userId!,
          provider: "GITHUB",
          repoId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          url: repo.html_url,
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
        },
      });
    }

    const userRepos = prisma.repository.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: "desc" },
    });

    return userRepos;
  }
}
