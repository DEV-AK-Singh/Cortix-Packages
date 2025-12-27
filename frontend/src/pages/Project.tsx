import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import ProgressItem from "../components/ProgressItem";
import { AnalysisReport } from "../components/AnalysisReport";

const API_URL = "http://localhost:5000";

type Stage =
  | "CREATED"
  | "ANALYSIS_PENDING"
  | "ANALYZING"
  | "ANALYSIS_DONE"
  | "INFRA_GENERATED"
  | "DEPLOYED"
  | "FAILED"; 

export function Project() {
  const { id, branch } = useParams<{ id: string; branch: string }>();
  const [project, setProject] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("CREATED"); 

  const pollInterval = useRef<number | null>(null);
  const token = localStorage.getItem("token")!;

  // 1. Fetch Basic Project Info
  const fetchProject = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/projects/${id}/branches/${branch}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setProject(data);
      setStage(data.stage ?? "CREATED");

      // If finished, stop polling and get report
      if (data.stage === "ANALYSIS_DONE") {
        stopPolling();
        fetchAnalysisReport();
      } else if (data.stage === "FAILED") {
        stopPolling();
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // 2. Fetch the Cumulative Report Data
  const fetchAnalysisReport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/analyze/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log(data);
      setReport(data);
    } catch (err) {
      console.error("Report fetch error:", err);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) return;
    pollInterval.current = setInterval(fetchProject, 3000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  async function runAnalysis() {
    setStage("ANALYZING");
    await fetch(`${API_URL}/api/analyze/projects/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    startPolling();
  }

  useEffect(() => {
    fetchProject().finally(() => setLoading(false));

    // If we land on the page and it's already analyzing, start polling
    if (stage === "ANALYZING") startPolling();

    return () => stopPolling();
  }, [id, branch]);

  if (loading) return <div className="p-6">Loading project...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header & Overview (Existing) */}
      <section>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500">
          {project.repoOwner}/{project.repoName} · {branch}
        </p>
      </section>

      {/* Pipeline Status (Existing) */}
      <div className="border rounded-xl p-6 space-y-4 bg-white shadow-sm">
        <h2 className="font-semibold text-lg">Project Pipeline</h2>
        <ProgressItem
          label="Repository analysis"
          status={
            stage === "ANALYSIS_DONE" ||
            stage === "INFRA_GENERATED" ||
            stage === "DEPLOYED"
              ? "done"
              : stage === "ANALYZING"
              ? "active"
              : stage === "FAILED"
              ? "failed"
              : "pending"
          }
          subtext={
            stage === "ANALYZING"
              ? "Scanning for runtimes, frameworks, and infrastructure..."
              : ""
          }
        />
      </div>

      {/* --- CUMULATIVE REPORT SECTION --- */}
      {stage === "ANALYSIS_DONE" && report && (
        <section>
          <h2 className="font-semibold text-lg">Cumulative Report</h2>
          <AnalysisReport report={report} />
        </section>
      )}

      {/* Actions (Existing) */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        <button
          onClick={runAnalysis}
          disabled={stage !== "CREATED" && stage !== "FAILED"}
          className="px-5 py-2 rounded bg-black text-white disabled:opacity-40"
        >
          {stage === "FAILED" ? "Retry Analysis" : "Run Analysis"}
        </button>
      </div>
    </div>
  );
} 