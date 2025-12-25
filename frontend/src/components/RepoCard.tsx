import { useState } from "react";

interface RepoCardProps {
  repo: {
    id: string;
    name: string;
    owner: string;
    description?: string;
  };
  token: string;
  onCreate: (repo: RepoCardProps["repo"], branch: string) => void;
  loading: boolean;
}

export function RepoCard({
  repo,
  token,
  onCreate,
  loading,
}: RepoCardProps) {
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [branchLoading, setBranchLoading] = useState(false);

  async function fetchBranches() {
    try {
      setBranchLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/repos/${repo.owner}/${repo.name}/branches`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setBranches(data.map((b: any) => b.name));
    } catch (err) {
      alert("Failed to fetch branches");
    } finally {
      setBranchLoading(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{repo.name}</h3>
          <p className="text-sm text-gray-500">{repo.description}</p>
        </div>

        {branches.length === 0 && (
          <button
            onClick={fetchBranches}
            disabled={branchLoading}
            className="text-sm underline"
          >
            {branchLoading ? "Loading..." : "Select Branch"}
          </button>
        )}
      </div>

      {branches.length > 0 && (
        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          >
            <option value="">Choose branch</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <button
            onClick={() => onCreate(repo, selectedBranch)}
            disabled={!selectedBranch || loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      )}
    </div>
  );
}
