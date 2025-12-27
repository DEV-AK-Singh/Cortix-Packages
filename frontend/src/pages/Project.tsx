import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { 
  Rocket,
  Shield,
  HardDrive,
  Search,
  Terminal,
} from "lucide-react";
import ProgressItem from "../components/ProgressItem";
import { AnalysisReport } from "../components/AnalysisReport";
import { InfraPlanPreview } from "../components/InfraPlanPreview";

const API_URL = "http://localhost:5000";

type Stage =
  | "CREATED"
  | "ANALYSIS_PENDING"
  | "ANALYZING"
  | "ANALYSIS_DONE"
  | "INFRA_PLANNING"
  | "INFRA_PLANNED"
  | "INFRA_QUEUED"
  | "INFRA_GENERATING"
  | "INFRA_GENERATED"
  | "DEPLOY_QUEUED"
  | "DEPLOYING"
  | "DEPLOYED"
  | "FAILED";

export function Project() {
  const { id, branch } = useParams<{ id: string; branch: string }>();
  const [project, setProject] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("CREATED");
  const [plan, setPlan] = useState<any>(null);

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

  async function planInfra() {
    setLoading(true);
    setStage("INFRA_PLANNING");
    try {
      const res = await fetch(`${API_URL}/api/infra-plan/projects/${id}/plan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlan(data.plan);
      setStage("INFRA_PLANNED"); // Update based on your ProjectStage enum
    } catch (err) {
      setStage("FAILED");
      console.error("Planning failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function deployInfra() {
    setLoading(true);
    setStage("DEPLOYING");
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setStage("DEPLOYED"); // Update based on your ProjectStage enum
    } catch (err) {
      setStage("FAILED");
      console.error("Deployment failed", err);
    } finally {
      setLoading(false);
    }
  }

  const getPillarStatus = (pillar: "analysis" | "infra" | "deploy") => {
    if (pillar === "analysis") {
      if (
        [
          "ANALYSIS_DONE",
          "INFRA_PLANNING",
          "INFRA_PLANNED",
          "DEPLOYING",
          "DEPLOYED",
        ].includes(stage)
      )
        return "done";
      if (stage === "ANALYZING") return "active";
      if (stage === "FAILED") return "failed";
      return "pending";
    }
    if (pillar === "infra") {
      if (["INFRA_PLANNED", "DEPLOYING", "DEPLOYED"].includes(stage))
        return "done";
      if (stage === "INFRA_PLANNING") return "active";
      return "pending";
    }
    if (pillar === "deploy") {
      if (stage === "DEPLOYED") return "done";
      if (stage === "DEPLOYING") return "active";
      return "pending";
    }
    return "pending";
  };

  useEffect(() => {
    if (stage === "INFRA_PLANNED" || stage === "DEPLOYED") {
      fetch(`${API_URL}/api/infra-plan/projects/${id}/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setPlan(data));
    }
  }, [stage, id]);

  useEffect(() => {
    fetchProject().finally(() => setLoading(false));
    if (stage === "ANALYZING") startPolling();
    return () => stopPolling();
  }, [id, branch]);

  if (loading) return <div className="p-6">Loading project...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 1. Systematic Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Shield size={14} />
              <span>Cortix Deployment Engine</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {project?.name || "Loading..."}
            </h1>
            <p className="text-xs font-mono text-gray-400">
              {project?.repoOwner}/{project?.repoName} • {branch}
            </p>
          </div>

          {/* Compact Pipeline Visualizer */}
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg border">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  getPillarStatus("analysis") === "done"
                    ? "bg-green-500"
                    : "bg-blue-500 animate-pulse"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                Analysis
              </span>
            </div>
            <div className="w-4 h-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  getPillarStatus("infra") === "done"
                    ? "bg-green-500"
                    : getPillarStatus("infra") === "active"
                    ? "bg-blue-500 animate-pulse"
                    : "bg-gray-200"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                Plan
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* 2. The Pipeline Stepper Card */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
            <Terminal size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-600">
              Deployment Lifecycle
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProgressItem
              label="Source Analysis"
              status={getPillarStatus("analysis")}
              subtext={
                stage === "ANALYZING"
                  ? "Scanning 13 detectors..."
                  : "Repo scanned successfully"
              }
            />
            <ProgressItem
              label="Infra Strategy"
              status={getPillarStatus("infra")}
              subtext={
                stage === "INFRA_PLANNING"
                  ? "Optimizing resources..."
                  : "Plan generated"
              }
            />
            <ProgressItem
              label="Cloud Delivery"
              status={getPillarStatus("deploy")}
              subtext={stage === "DEPLOYING" ? "Provisioning..." : "Live"}
            />
          </div>
        </div>

        {/* 3. The Dynamic Content Area (The "Meat" of the page) */}
        <div className="space-y-6">
          {/* Analysis View */}
          {stage === "ANALYSIS_DONE" && report && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-4">
                <Search size={18} className="text-blue-500" />
                <h3 className="font-bold text-lg text-gray-800">
                  Intelligence Report
                </h3>
              </div>
              <AnalysisReport report={report} />
            </div>
          )}

          {/* Planning View */}
          {(stage === "INFRA_PLANNED" ||
            stage === "DEPLOYING" ||
            stage === "DEPLOYED") && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-4">
                <HardDrive size={18} className="text-purple-500" />
                <h3 className="font-bold text-lg text-gray-800">
                  Infrastructure Design
                </h3>
              </div>
              <InfraPlanPreview plan={plan} />
            </div>
          )}

          {/* Loading States for active transitions */}
          {(stage === "ANALYZING" ||
            stage === "INFRA_PLANNING" ||
            stage === "DEPLOYING") && (
            <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-medium animate-pulse">
                Cortix is working on the next stage...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 4. Fixed Action Bar (The "Bottom Action") */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 z-20">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full bg-green-500 ${
                stage === "DEPLOYED" ? "" : "animate-pulse"
              }`}
            />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Stage: {stage.replace("_", " ")}
            </span>
          </div>

          <div className="flex gap-3">
            {stage === "CREATED" && (
              <button onClick={runAnalysis} className="btn-primary">
                Run Engine Analysis
              </button>
            )}
            {stage === "ANALYSIS_DONE" && (
              <button
                onClick={planInfra}
                className="btn-primary flex items-center gap-2"
              >
                <HardDrive size={18} />
                Generate Infrastructure Plan
              </button>
            )}
            {stage === "INFRA_PLANNED" && (
              <button
                onClick={deployInfra}
                className="btn-success flex items-center gap-2"
              >
                <Rocket size={18} />
                Confirm & Launch Project
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Tailwind Component Styles */}
      <style>{`
        .btn-primary {
          @apply px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95;
        }
        .btn-success {
          @apply px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95;
        }
      `}</style>
    </div>
  );
}
