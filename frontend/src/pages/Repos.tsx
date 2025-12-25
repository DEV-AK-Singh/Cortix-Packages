import { useEffect, useState } from "react";
import { RepoCard } from "../components/RepoCard";
import { createProject } from "../api/projects";
import { useNavigate } from "react-router-dom";

export function Repos() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepo, setLoadingRepo] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token")!;

  useEffect(() => {
    fetch("http://localhost:5000/auth/github/repos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setRepos);
  }, []);

  async function handleCreate(repo: any, branch: string = "master") {
    console.log("Creating project for", repo, "on branch", branch);
    try {
      setLoadingRepo(repo.id);
      const project = await createProject(repo.owner, repo.name, branch, token);
      navigate(`/projects/${project.id}/branches/${branch}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    } finally {
      setLoadingRepo(null);
    }
  } 

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Select a Repository</h1>

      {repos.map((repo) => (
        <RepoCard
          key={repo.id}
          repo={repo}
          token={token}
          onCreate={handleCreate}
          loading={loadingRepo === repo.id}
        />
      ))}
    </div>
  );
}
