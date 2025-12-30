import { useEffect, useState } from "react";
import { RepoCard } from "../components/RepoCard";
import { createProject } from "../api/projects";
import { useNavigate } from "react-router-dom";

const LoadingRepoPlaceholder = () => {
  return (
    <div className="animate-pulse flex space-x-4 mt-8">
      <div className="rounded-full bg-slate-200 h-10 w-10"></div>
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-slate-200 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-slate-200 rounded col-span-2"></div>
            <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Select a Repository</h1>

      {repos.length ? (
        <div className="grid grid-cols-1 gap-4">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              token={token}
              loading={loadingRepo === repo.id}
              onCreate={handleCreate}
            />
          ))}
        </div>
      ) : (
        <div>
          {[...Array(10)].map((_, idx) => (
            <LoadingRepoPlaceholder key={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
