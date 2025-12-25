import { safeExists } from "../../utils/fs-safe";

export function detectLanguages(repo: string): string[] {
  const langs = new Set<string>();

  if (safeExists(`${repo}/package.json`)) langs.add("node");
  if (safeExists(`${repo}/tsconfig.json`)) langs.add("typescript");
  if (safeExists(`${repo}/requirements.txt`)) langs.add("python");
  if (safeExists(`${repo}/pyproject.toml`)) langs.add("python");
  if (safeExists(`${repo}/go.mod`)) langs.add("go");
  if (safeExists(`${repo}/pom.xml`)) langs.add("java");  

  return [...langs];
}
