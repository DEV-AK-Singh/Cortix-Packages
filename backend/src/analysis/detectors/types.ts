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
};

export interface FrameworkInfo {
  name: string
  confidence: number
  indicators: string[],
  path?: string  // relative path from repo root
  relativePath?: string // from repo root
};

export type APIStyle = "graphql" | "grpc" | "rest" | "rpc" | "none";

export interface APIStyleInfo {
  style: APIStyle;
  confidence: number;
  indicators: string[];
  path: string;
  relativePath: string;
};

export interface EntryPointInfo {
  runtime: RuntimeType
  entryType: "script" | "binary" | "framework" | "unknown"
  command?: string
  file?: string
  path: string
  relativePath: string
  confidence: number
};

export type DatabaseType = "postgres" | "mysql" | "mongodb" | "redis" | "sqlite" | "dynamodb" | "unknown"

export interface DatabaseInfo {
  type: DatabaseType
  version?: string
  path: string          // absolute service path
  relativePath: string  // from repo root
  indicators: string[]
  confidence: number
};

export interface EnvVarInfo {
  name: string
  source: "env-file" | "code"
  confidence: number
};

export interface EnvServiceInfo {
  declared: EnvVarInfo[]
  used: EnvVarInfo[]
  path: string
  relativePath: string
};

export interface ToolingInfo {
  linter?: string
  formatter?: string
  compiler?: string
  testFrameworks?: string[]
  indicators: string[]
  path?: string
  relativePath?: string
};

export interface ContainerizationInfo {
  containerized: boolean
  strategy: "existing" | "generated" | "partial"
  dockerfiles?: string[]
  composeFiles?: string[]
  services?: string[]
  path?: string
  relativePath?: string
  indicators: string[]
  confidence: number
};

export type CICDType = "github-actions" | "gitlab-ci" | "circleci" | "azure-pipelines" | "unknown";

export interface CICDInfo {
  provider: CICDType
  configFiles: string[]
  indicators: string[]
  path?: string
  relativePath?: string
  confidence: number
};

export type DeploymentType = "vercel" | "netlify" | "railway" | "render" | "flyio" | "aws" | "gcp" | "azure" | "unknown";

export interface DeploymentInfo {
  provider: DeploymentType
  indicators: string[]
  configFiles?: string[]
  path?: string
  relativePath?: string
  confidence: number
}

export interface HealthInfo {
  hasReadme: boolean
  hasLicense: boolean | string
  hasTests: boolean
  testIndicators?: string[]
  outdatedDependencies?: number
  securityVulnerabilities?: number
  indicators: string[]
  score: number        // 0 → 100
  path?: string
  relativePath?: string
}
