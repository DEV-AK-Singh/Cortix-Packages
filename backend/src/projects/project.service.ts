import { prisma } from "../config/prisma";
import { githubClient } from "../lib/github";

interface CreateProjectInput {
  userId: string;
  accessToken: string;
  repoOwner: string;
  repoName: string;
  repoBranch: string;
}

export async function createGithubProject({
  userId,
  accessToken,
  repoOwner,
  repoName,
  repoBranch,
}: CreateProjectInput) {
  const gh = githubClient(accessToken);

  // 1. Fetch repo metadata
  const { data: repo } = await gh.get(
    `/repos/${repoOwner}/${repoName}`
  );

  // 2. Create project (idempotent)
  const project = await prisma.project.upsert({
    where: {
      repoProvider_repoId_defaultBranch: {
        repoProvider: "GITHUB",
        repoId: String(repo.id),
        defaultBranch: repoBranch,
      },
    },
    update: {},
    create: {
      userId,
      name: repo.name,
      description: repo.description,
      repoProvider: "GITHUB",
      repoOwner: repo.owner.login,
      repoName: repo.name,
      repoId: String(repo.id),
      defaultBranch: repoBranch || repo.default_branch,
    },
  });

  // 3. Fetch branches
  const { data: branches } = await gh.get(
    `/repos/${repoOwner}/${repoName}/branches`
  );

  // 4. Store branches
  await prisma.branch.createMany({
    data: branches.map((b: any) => ({
      name: b.name,
      isDefault: b.name === repo.default_branch,
      projectId: project.id,
    })),
    skipDuplicates: true,
  });

  return project;
}

export async function getReposBranches(
  accessToken: string,
  repoOwner: string,
  repoName: string
) {
  const gh = githubClient(accessToken);
  const { data: branches } = await gh.get(
    `/repos/${repoOwner}/${repoName}/branches`
  );
  return branches.map((b: any) => ({
    name: b.name,
    isDefault: b.name === "main" || b.name === "master",
  }));
}
