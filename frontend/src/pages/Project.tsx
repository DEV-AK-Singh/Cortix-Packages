import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = "http://localhost:5000";

export function Project() {
  const { id, branch } = useParams<{ id: string; branch: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token")!;

  useEffect(() => {
    async function fetchProject() {
      console.log("Fetching project", id, "on branch", branch);
      try {
        const res = await fetch(`${API_URL}/api/projects/${id}/branches/${branch}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [id, branch]);

  if (loading) {
    return <div className="p-6">Loading project...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500">
          {project.repoProvider.toUpperCase()} ·{" "}
          {project.repoOwner}/{project.repoName}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Branch" value={project.defaultBranch} />
        <InfoCard label="Status" value={project.status} />
      </div>

      {/* Progress */}
      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Setup Progress</h2>

        <ProgressItem done label="Project created" />
        <ProgressItem done label="Branch selected" />
        <ProgressItem label="Repository analysis" />
        <ProgressItem label="Infrastructure generation" />
        <ProgressItem label="Deployment" />
      </div>

      {/* Next CTA */}
      <div className="flex justify-end">
        <button
          disabled
          className="bg-black text-white px-6 py-2 rounded opacity-50"
        >
          Generating analysis...
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function ProgressItem({
  label,
  done,
}: {
  label: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`w-2 h-2 rounded-full ${
          done ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      <span className={done ? "text-black" : "text-gray-500"}>
        {label}
      </span>
    </div>
  );
}
