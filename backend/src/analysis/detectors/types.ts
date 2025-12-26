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

export interface FrameworkInfo {
  name: string
  confidence: number
  indicators: string[],
  path?: string  // relative path from repo root
  relativePath?: string // from repo root
}

export type APIStyle = "graphql" | "grpc" | "rest" | "rpc" | "none";

export interface APIStyleInfo {
  style: APIStyle;
  confidence: number;
  indicators: string[];
  path: string;
  relativePath: string;
}

export interface EntryPointInfo {
  runtime: RuntimeType
  entryType: "script" | "binary" | "framework" | "unknown"
  command?: string
  file?: string
  path: string
  relativePath: string
  confidence: number
}

export type DatabaseType = "postgres" | "mysql" | "mongodb" | "redis" | "sqlite" | "dynamodb" | "unknown"

export interface DatabaseInfo {
  type: DatabaseType
  version?: string
  path: string          // absolute service path
  relativePath: string  // from repo root
  indicators: string[]
  confidence: number
}

export interface EnvVarInfo {
  name: string
  source: "env-file" | "code"
  confidence: number
}

export interface EnvServiceInfo {
  path: string
  relativePath: string
  declared: EnvVarInfo[]
  used: EnvVarInfo[]
}
