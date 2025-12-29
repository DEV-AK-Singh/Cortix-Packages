import { useAuth } from "../context/AuthContext";
import { Repos } from "./Repos";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-12 max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Welcome, {user?.name || user?.email.split("@")[0]}!
          </h1> 
          <p className="text-sm">
            <b>Email: </b>
            {user?.email}
          </p>
        </div>
        <button onClick={logout} className="text-red-500 btn-primary">
          Logout
        </button>
      </div>

      {!user?.githubConnected ? (
        <div className="mt-6 p-4 border rounded">
          <p className="mb-2">GitHub not connected</p>
          <a href="http://localhost:5000/auth/github" className="text-blue-600">
            Connect GitHub
          </a>
        </div>
      ) : (
        <Repos />
      )}
    </div>
  );
}
