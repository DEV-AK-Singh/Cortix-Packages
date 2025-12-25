import { useParams } from "react-router-dom";

export function Project() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Project Created 🎉</h1>
      <p className="text-gray-500">Project ID: {id}</p>

      <p className="mt-4">
        Branch fetching & repo analysis in progress...
      </p>
    </div>
  );
}
