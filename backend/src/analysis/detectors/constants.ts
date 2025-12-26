export const ANALYSIS_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.github/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/.cache/**",
  "**/venv/**",
  "**/__pycache__/**",
  "**/env/**"
];

export const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".java": "Java",
  ".rb": "Ruby",
  ".php": "PHP",
  ".rs": "Rust",
  ".cs": "C#",
  ".cpp": "C++",
  ".c": "C",
  ".sh": "Shell",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".json": "JSON",
  ".dockerfile": "Dockerfiles"
};
