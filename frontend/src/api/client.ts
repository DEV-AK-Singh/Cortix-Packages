export const API_URL = "http://localhost:5000";

export async function fetchMe(token: string) {
    const res = await fetch(`${API_URL}/auth/user/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
}

export async function fetchGithubRepos(token: string) {
    const res = await fetch(`${API_URL}/auth/github/repos`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
}