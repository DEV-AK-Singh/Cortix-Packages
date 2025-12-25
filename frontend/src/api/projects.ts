export const API_URL = "http://localhost:5000";

export async function createProject(
  repoOwner: string,
  repoName: string,
  repoBranch: string,
  token: string
) {
  const res = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ repoOwner, repoName, repoBranch }),
  });

  if (!res.ok) {
    throw new Error("Failed to create project");
  }

  return res.json();
}
