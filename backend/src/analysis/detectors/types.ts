export interface RepoMetadata {
    repoName: string
    scanTimestamp: string
    totalFiles: number
    directories: string[]
};

export interface LanguageComposition {
    primaryLanguage: string
    languages: {
        name: string
        percentage: number
    }[]
};

export type RuntimeType = "node" | "python" | "go" | "java" | "unknown"

export interface RuntimeInfo {
  runtime: RuntimeType
  version?: string
  packageManager?: string
  startCommand?: string
  path?: string          // absolute path
  relativePath?: string  // from repo root
}

