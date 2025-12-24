import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, repos, logout } = useAuth();

  return (
    <div className="p-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Welcome, {user?.name || user?.email.split("@")[0]}!
          </h1>
          <p className="text-sm">
            <b>ID: </b>
            {user?.id}
          </p>
          <p className="text-sm">
            <b>Email: </b>
            {user?.email}
          </p>
        </div>
        <button onClick={logout} className="text-red-500">
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
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Your Repositories</h2>
          {repos.map((r) => (
            <div key={r.id} className="border p-2 rounded mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <a href={r.url} className="text-blue-600 font-medium" target="_blank" rel="noopener noreferrer">
                    {r.fullName}
                  </a>
                </div> 
                <div>
                  {r.private ? <b className="text-red-500 bg-black px-3 py-1 rounded-full text-xs">Private</b> : <b className="text-black bg-green-500 px-3 py-1 rounded-full text-xs">Public</b>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
