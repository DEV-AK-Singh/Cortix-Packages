interface ProgressItemProps {
  label: string;
  status: "done" | "active" | "failed" | "pending";
  subtext?: string;
}

function ProgressItem({ label, status, subtext }: ProgressItemProps) {
  // Map status to colors and icons
  const config = {
    done: {
      dot: "bg-green-500",
      text: "text-gray-900",
      icon: "✓"
    },
    active: {
      dot: "bg-yellow-400 animate-pulse",
      text: "text-yellow-700 font-medium",
      icon: "●"
    },
    failed: {
      dot: "bg-red-500",
      text: "text-red-600",
      icon: "✕"
    },
    pending: {
      dot: "bg-gray-200",
      text: "text-gray-400",
      icon: ""
    }
  };

  const current = config[status];

  return (
    <div className="flex items-start gap-4 py-2 group">
      {/* Icon / Line Column */}
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold transition-colors ${current.dot}`}>
          {current.icon}
        </div>
        {/* Decorative connecting line for the list */}
        <div className="w-px h-full bg-gray-100 min-h-4 group-last:hidden" />
      </div>

      {/* Label Column */}
      <div className="flex-1 pt-0.5">
        <div className={`text-sm transition-colors ${current.text}`}>
          {label}
        </div>
        {subtext && (
          <p className="text-xs text-gray-400 mt-1 italic">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProgressItem;