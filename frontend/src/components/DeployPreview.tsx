import { 
  Rocket, Terminal, Loader2, 
  ExternalLink, Server, Box
} from "lucide-react";

// 1. Define the Shape based on your Prisma Model
interface ServiceInfo {
  name: string;
  containerId: string;
  port: number;
  url: string;
  status: "running" | "stopped" | "failed";
}

interface DeploymentResult {
  id: string;
  provider: string; // "LOCAL_DOCKER"
  services: ServiceInfo[]; // Typed extraction from JSON
  logs: string[]; // Typed extraction from JSON
  createdAt: string;
}

export function DeployPreview({ deploy, stage }: { deploy: DeploymentResult | null, stage: string }) {
  // Fallback states
  const logs = Array.isArray(deploy?.logs) ? deploy.logs : [];
  const services = Array.isArray(deploy?.services) ? deploy.services : [];
  const provider = deploy?.provider || "LOCAL_DOCKER";
  
  // Determine overarching status based on the Project Stage + Data presence
  const isBuilding = stage === "DEPLOYING" || stage === "DEPLOYING_QUEUED";
  const isFailed = stage === "FAILED";
  const isHealthy = !isBuilding && !isFailed && services.length > 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Rocket className={isHealthy ? "text-green-500" : "text-blue-500"} />
          Deployment Pipeline
        </h2>
        
        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${
          isHealthy
            ? "bg-green-50 text-green-700 border-green-100" 
            : isFailed
            ? "bg-red-50 text-red-700 border-red-100"
            : "bg-blue-50 text-blue-700 border-blue-100"
        }`}>
          {isBuilding ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <div className={`w-2 h-2 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`} />
          )}
          {isBuilding ? "BUILDING & STARTING" : isHealthy ? "SYSTEM OPERATIONAL" : "DEPLOYMENT FAILED"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Live Terminal Logs */}
        <div className="md:col-span-2 border rounded-xl overflow-hidden bg-gray-900 shadow-lg flex flex-col h-80">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-gray-400" />
              <span className="text-xs font-mono text-gray-300">build_stream.log</span>
            </div>
            {isBuilding && <span className="text-[10px] text-green-400 animate-pulse">● LIVE</span>}
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1">
            {logs.length === 0 && (
              <span className="text-gray-500 italic opacity-50">Initializing build sequence...</span>
            )}
            {logs.map((log: string, i: number) => (
              <div key={i} className="text-gray-300 border-l-2 border-transparent hover:border-gray-700 pl-2 break-all">
                <span className="text-green-500 opacity-60 mr-2">➜</span>
                {log}
              </div>
            ))}
            {isBuilding && (
              <div className="animate-pulse text-green-500 pl-2">_</div>
            )}
          </div>
        </div>

        {/* 2. Infrastructure Status Sidebar */}
        <div className="space-y-4">
          
          {/* A. Provider Info */}
          <div className="border rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Environment</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Server size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {provider === "LOCAL_DOCKER" ? "Local Engine" : "Cloud VPS"}
                </p>
                <p className="text-xs text-gray-400">Docker Runtime</p>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded border border-gray-100 font-mono mt-2 truncate">
              ID: {deploy?.id || "waiting-for-allocation..."}
            </div>
          </div>

          {/* B. Active Services List */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Box size={12} /> Active Services
            </h3>

            <div className="space-y-2">
              {services.length > 0 ? (
                services.map((svc, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${svc.status === 'running' ? 'bg-green-500' : 'bg-red-400'}`} />
                      <div>
                        <p className="text-xs font-bold text-gray-700">{svc.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">:{svc.port}</p>
                      </div>
                    </div>
                    
                    {svc.url && (
                      <a 
                        href={svc.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-all"
                        title="Open Service"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 opacity-50 text-xs">
                  <Loader2 size={16} className="animate-spin mx-auto mb-1" />
                  Waiting for containers...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}