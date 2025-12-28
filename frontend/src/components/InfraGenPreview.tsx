import { FileText, Layers, Terminal } from "lucide-react";

export function InfraGenPreview({ gen }: { gen: any }) {
  if (!gen) return null;

  const files = gen.files || {};

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Terminal className="text-green-500" />
          Generated Infrastructure
        </h2>
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
          {gen.strategy?.replace("_", " ") || "Docker"}
        </span>
      </div>

      {/* File List */}
      <div className="space-y-4">
        {Object.entries(files).map(([path, content]) => (
          <div
            key={path}
            className="border rounded-xl overflow-hidden bg-white shadow-sm"
          >
            {/* File Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
              <div className="flex items-center gap-2 text-sm font-mono text-gray-700">
                <FileText size={14} />
                {path}
              </div>
              <Layers size={14} className="text-gray-400" />
            </div>

            {/* File Content */}
            <pre className="p-4 text-xs bg-gray-900 text-gray-100 overflow-x-auto font-mono">
              {content as string}
            </pre>
          </div>
        ))}
      </div>

      {/* Footer Explanation */}
      <div className="bg-gray-900 rounded-xl p-4 text-gray-300 text-xs">
        <p className="font-bold text-white mb-1">
          Execution Strategy
        </p>
        <p>
          These files will be used to build Docker images and start containers
          in an isolated network. No proprietary runtime — pure Docker.
        </p>
      </div>
    </div>
  );
}
