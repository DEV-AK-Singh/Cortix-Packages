import { createContext, useContext, useEffect, useState } from "react";
import { fetchGithubRepos, fetchMe } from "../api/client";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  githubConnected: boolean;
}

interface AuthContextType {
  user: User | null;
  repos: Array<any>;
  envVars: Record<string, string>;
  setEnvVars: (envs: Record<string, string>) => void;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch user info
    fetchMe(token)
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));

    // Fetch GitHub repos if user is connected
    fetchGithubRepos(token)
      .then((data) => { 
        setRepos(data);
      })
      .catch(() => setRepos([])); 
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, repos, envVars, setEnvVars, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
