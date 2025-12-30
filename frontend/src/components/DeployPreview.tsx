import { 
  Rocket, Terminal, Loader2, 
  ExternalLink, Server, Box
} from "lucide-react";

// 1. Match the Backend JSON structure
interface ServiceInfo {
  name: string;
  url: string;
  port: number;
  image: string;
  container: string;
  status?: "running" | "stopped" | "failed"; // Added optional status
}

interface DeploymentResult {
  id: string;
  projectId: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result: {
    services: ServiceInfo[];
  } | null;
  error: string | null;
  startedAt: string;
  endedAt: string;
  createdAt: string;
  logs?: string[]; // Assuming logs might be sent separately or added to this object
}

export function DeployPreview({ deploy, stage }: { deploy: DeploymentResult | null, stage: string }) {
  
  // Safeguard: Extract services from the nested result object
  const services = deploy?.result?.services || [];
  const logs = deploy?.logs || [];
  
  // Logic based on the 'status' field from your JSON
  const isBuilding = deploy?.status === "IN_PROGRESS" || stage === "DEPLOYING";
  const isFailed = deploy?.status === "FAILED" || stage === "FAILED";
  const isHealthy = deploy?.status === "COMPLETED" && services.length > 0;

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
          {deploy?.status || "INITIALIZING"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Terminal Logs */}
        <div className="md:col-span-2 border rounded-xl overflow-hidden bg-gray-900 shadow-lg flex flex-col h-80">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-gray-400" />
              <span className="text-xs font-mono text-gray-300">deploy_output.log</span>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1">
            {logs.length === 0 && !isHealthy && (
              <div className="text-gray-500 italic opacity-50">
                {isBuilding ? "Provisioning resources..." : "No logs available for this session."}
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300 border-l-2 border-transparent hover:border-gray-700 pl-2">
                <span className="text-blue-500 opacity-60 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
            {isHealthy && (
              <div className="text-green-400 font-bold mt-2">✓ Deployment finished successfully.</div>
            )}
          </div>
        </div>

        {/* 2. Infrastructure Status Sidebar */}
        <div className="space-y-4">
          
          {/* A. Deployment Meta */}
          <div className="border rounded-xl p-5 bg-white shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Environment</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Server size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Docker Instance</p>
                <p className="text-xs text-gray-400">Localhost Engine</p>
              </div>
            </div>
            
            <div className="space-y-2 border-t pt-4">
               <div className="flex justify-between text-[10px]">
                 <span className="text-gray-500">Deployment ID</span>
                 <span className="font-mono text-gray-800">{deploy?.id.slice(0, 8)}...</span>
               </div>
               <div className="flex justify-between text-[10px]">
                 <span className="text-gray-500">Started</span>
                 <span className="text-gray-800">{deploy?.startedAt ? new Date(deploy.startedAt).toLocaleTimeString() : '-'}</span>
               </div>
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
                  <div key={idx} className="bg-white p-3 rounded-lg border shadow-sm group hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-xs font-bold text-gray-700 capitalize">{svc.name}</p>
                      </div>
                      <a 
                        href={svc.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono truncate bg-gray-50 p-1 rounded">
                      ID: {svc.container?.slice(0, 12)}...
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-[10px] text-gray-400 italic">No services active</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}