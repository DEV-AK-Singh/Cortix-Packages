import { Box, Network, Cpu, ArrowRight } from "lucide-react";

export function InfraPlanPreview({ plan }: { plan: any }) {
  if (!plan) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Box className="text-blue-500" /> Infrastructure Plan
        </h2>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
          {plan.deploymentStrategy.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.services.map((service: any, idx: number) => (
          <div key={idx} className="border rounded-xl p-5 bg-white shadow-sm relative overflow-hidden">
            {/* Visual Indicator for Strategy */}
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Cpu size={48} />
            </div>

            <div className="space-y-3 relative">
              <div>
                <h3 className="font-bold text-gray-800">{service.name}</h3>
                <p className="text-xs text-gray-400 font-mono">Build: {service.build.strategy}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase">Internal Port</span>
                  <span className="font-mono font-bold text-gray-700">{service.run.port}</span>
                </div>
                <ArrowRight size={14} className="text-gray-300" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase">Public Path</span>
                  <span className="font-mono font-bold text-blue-600">{service.proxy.publicPath}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed flex flex-wrap gap-1">
                {service.run.envVars.map((env: string) => (
                  <span key={env} className="text-[9px] bg-gray-50 border rounded px-1.5 py-0.5 text-gray-500">
                    {env}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Network Logic Explanation */}
      <div className="bg-gray-900 rounded-xl p-4 text-white flex items-center gap-4">
        <div className="p-2 bg-gray-800 rounded-lg">
          <Network size={20} className="text-green-400" />
        </div>
        <div className="text-xs">
          <p className="font-bold">Edge Gateway (Nginx)</p>
          <p className="text-gray-400">
            Routing traffic through port <span className="text-green-400 font-mono">80</span> to 
            internal domain <span className="text-green-400 font-mono">{plan.network.internalDomain}</span>
          </p>
        </div>
      </div>
    </div>
  );
}