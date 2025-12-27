import { 
  Server, Layout, ShieldAlert, Terminal, 
  Globe, Container, Activity, AlertCircle 
} from "lucide-react";

export function AnalysisReport({ report }: { report: any }) {
  // Safe extraction with fallbacks
  const services = report?.result?.services || [];
  const languages = report?.result?.repository?.languages?.languages || [];
  const issues = report?.result?.globalHealth?.issues || [];
  const containers = report?.result?.infrastructure?.containerization || []; 
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Global Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Health Score"
          value={report?.result?.globalHealth?.averageScore !== undefined ? `${report.result.globalHealth.averageScore}%` : "—"}
          sub={issues[0] || "No critical issues detected"}
          color="text-yellow-500"
          icon={<Activity size={20} />}
        />
        <StatCard
          label="Primary Language"
          value={report?.result?.repository?.languages?.primaryLanguage || "Unknown"}
          sub={`${report?.result?.repository?.metadata?.totalFiles || 0} files scanned`}
          color="text-blue-500"
          icon={<Globe size={20} />}
        />
        <StatCard
          label="Services"
          value={services.length}
          sub={services.length > 1 ? "Monorepo structure" : "Standalone service"}
          color="text-purple-500"
          icon={<Server size={20} />}
        />
        <StatCard
          label="CI/CD Status"
          value={report?.result?.infrastructure?.ciCd?.length > 0 ? "Active" : "Not Found"}
          sub={report?.result?.infrastructure?.ciCd?.[0]?.provider?.replace('-', ' ') || "No pipeline detected"}
          color={report?.result?.infrastructure?.ciCd?.length > 0 ? "text-green-500" : "text-gray-400"}
          icon={<ShieldAlert size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Service Explorer */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal size={24} className="text-gray-400" /> Detected Services
          </h2>
          
          {services.length > 0 ? (
            services.map((service: any, idx: number) => (
              <DetailedServiceCard key={idx} service={service} />
            ))
          ) : (
            <EmptyState message="No services identified in this repository." />
          )}
        </div>

        {/* 3. Infrastructure & Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Infrastructure</h2>
          <ContainerSection containers={containers} />
          <LanguageBreakdown languages={languages} />

          {/* Action Alerts */}
          {issues.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <h4 className="text-red-800 font-bold text-sm flex items-center gap-2">
                <ShieldAlert size={16} /> Improvements Needed
              </h4>
              <ul className="mt-2 space-y-1">
                {issues.map((issue: string, i: number) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                    <span className="mt-1 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- UI Helper Components ---------- */

function DetailedServiceCard({ service }: { service: any }) {
  const isServer = service?.name?.toLowerCase().includes("server") || service?.apiStyles?.length > 0;

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isServer ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
            {isServer ? <Server size={20} /> : <Layout size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-lg">{service?.name || "Unnamed Service"}</h3>
            <p className="text-xs text-gray-400 font-mono">
              {service?.relativePath ? `./${service.relativePath}` : "Root Directory"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Score</span>
          <p className={`font-black text-xl ${service?.health?.score > 70 ? "text-green-500" : "text-yellow-500"}`}>
            {service?.health?.score ?? "—"}
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <ServiceMeta label="Framework" value={service?.frameworks?.[0]?.name} />
        <ServiceMeta label="Runtime" value={service?.runtime?.runtime} />
        <ServiceMeta label="Build Tool" value={service?.tooling?.compiler} />
        <ServiceMeta label="API Style" value={service?.apiStyles?.[0]?.style} />
      </div>

      <div className="px-6 pb-6 flex flex-wrap gap-2">
        {service?.envVars?.used?.length > 0 ? (
          service.envVars.used.map((env: any, i: number) => (
            <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-mono">
              ${env.name}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-gray-300 italic">No environment variables detected</span>
        )}
      </div>
    </div>
  );
};

function ServiceMeta({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{label}</p>
      <p className={`text-sm font-semibold truncate ${!value ? 'text-gray-400 italic' : 'text-gray-700'}`}>
        {value || "Not Detected"}
      </p>
    </div>
  );
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-gray-50 text-gray-400">
      <AlertCircle size={32} className="mb-2 opacity-20" />
      <p className="text-sm italic">{message}</p>
    </div>
  );
};

function LanguageBreakdown({ languages }: { languages: any[] }) {
  const hasLanguages = languages && languages.length > 0;

  return (
    <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-600">Language Mix</h3>
      
      {hasLanguages ? (
        <>
          <div className="h-2 w-full flex rounded-full overflow-hidden bg-gray-100">
            {languages.map((l, i) => (
              <div
                key={i}
                style={{ width: `${l.percentage}%` }}
                className={`${
                  i === 0 ? "bg-blue-500" : i === 1 ? "bg-yellow-400" : "bg-purple-400"
                } transition-all duration-1000`}
              />
            ))}
          </div>
          <ul className="space-y-2">
            {languages.map((l, i) => (
              <li key={i} className="flex justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    i === 0 ? "bg-blue-500" : i === 1 ? "bg-yellow-400" : "bg-purple-400"
                  }`} />
                  {l.name}
                </span>
                <span className="font-mono text-gray-400">{l.percentage}%</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs italic text-gray-400 text-center py-4">
          No language data available
        </p>
      )}
    </div>
  );
};

function ContainerSection({ containers }: { containers: any[] }) {
  const hasContainers = containers && containers.length > 0;

  return (
    <div className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-sm text-gray-600">
        <Container size={18} /> Containerization
      </div>
      
      {hasContainers ? (
        <div className="space-y-3">
          {containers.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 border-gray-50">
              <span className="text-gray-500 truncate max-w-30">
                {c.relativePath === "." ? "Root Project" : c.relativePath}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                c.composeFiles ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-700"
              }`}>
                {c.composeFiles ? "DOCKER COMPOSE" : "DOCKERFILE"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-xs italic text-gray-400">No Docker config found</p>
        </div>
      )}
    </div>
  );
};

function StatCard({ label, value, sub, color, icon }: any) {
  // Determine if value is valid or just empty/zero
  const isEmpty = value === undefined || value === null || value === "0%" || value === 0;

  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm hover:border-gray-300 transition-colors">
      <div className={`mb-3 ${color} opacity-80`}>{icon}</div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-black mt-1 ${isEmpty ? 'text-gray-300' : color}`}>
        {value || "—"}
      </p>
      <p className="text-[10px] text-gray-400 mt-1 truncate max-w-full italic">
        {sub || "Calculating..."}
      </p>
    </div>
  );
};