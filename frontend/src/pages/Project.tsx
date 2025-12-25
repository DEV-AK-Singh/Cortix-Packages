import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = "http://localhost:5000";

type Stage =
  | "CREATED"
  | "ANALYSIS_PENDING"
  | "ANALYZING"
  | "ANALYSIS_DONE"
  | "INFRA_GENERATED"
  | "DEPLOYED";

export function Project() {
  const { id, branch } = useParams<{ id: string; branch: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("CREATED");

  const token = localStorage.getItem("token")!;

  async function runAnalysis() {
    await fetch(`${API_URL}/api/analyze/projects/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setStage("ANALYZING");
  }

  async function generateInfra() {
    // future API
    console.log("Generate infra");
  }

  async function deployProject() {
    // future API
    console.log("Deploy project");
  }

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(
          `${API_URL}/api/projects/${id}/branches/${branch}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setProject(data);

        // temporary stage mapping (backend will control later)
        setStage(data.stage ?? "CREATED");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [id, branch]);

  if (loading) return <div className="p-6">Loading project...</div>;
  if (!project) return <div className="p-6">Project not found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500">
          {project.repoProvider.toUpperCase()} · {project.repoOwner}/
          {project.repoName} · branch: {branch}
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Branch" value={branch!} />
        <InfoCard label="Status" value={stage.replace("_", " ")} />
        <InfoCard label="Project ID" value={project.id} />
      </div>

      {/* Pipeline */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Project Pipeline</h2>

        <ProgressItem label="Project created" done />
        <ProgressItem
          label="Repository analysis"
          done={stage === "ANALYSIS_DONE"}
          active={stage === "ANALYZING"}
        />
        <ProgressItem
          label="Infrastructure generation"
          done={stage === "INFRA_GENERATED"}
        />
        <ProgressItem label="Deployment" done={stage === "DEPLOYED"} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={runAnalysis}
          disabled={stage !== "CREATED"}
          className="px-5 py-2 rounded bg-black text-white disabled:opacity-40"
        >
          Run Analysis
        </button>

        <button
          onClick={generateInfra}
          disabled={stage !== "ANALYSIS_DONE"}
          className="px-5 py-2 rounded border disabled:opacity-40"
        >
          Generate Infrastructure
        </button>

        <button
          onClick={deployProject}
          disabled={stage !== "INFRA_GENERATED"}
          className="px-5 py-2 rounded border disabled:opacity-40"
        >
          Deploy
        </button>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold truncate">{value}</p>
    </div>
  );
}

function ProgressItem({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span
        className={`w-3 h-3 rounded-full ${
          done
            ? "bg-green-500"
            : active
            ? "bg-yellow-400 animate-pulse"
            : "bg-gray-300"
        }`}
      />
      <span
        className={
          done
            ? "text-black"
            : active
            ? "text-yellow-700"
            : "text-gray-500"
        }
      >
        {label}
      </span>
    </div>
  );
}
