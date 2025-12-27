import path, { basename } from "path"; 
import { DetectorResult } from "./base";
import { CumulativeReport, ServiceManifest } from "./types";

import { LanguageCompositionDetector } from "./languageComposition.detector";
import { RepoMetadataDetector } from "./repoMetadata.detector"
import { RuntimeDetector } from "./runtime.detector";
import { FrameworkDetector } from "./framework.detector";
import { APIStyleDetector } from "./apiStyle.detector";
import { EntryPointDetector } from "./entryPoint.detector";
import { DatabaseDetector } from "./database.detector";
import { ENVVarDetector } from "./envVar.detector";
import { ToolingDetector } from "./tooling.detector";
import { ContainerizationDetector } from "./containerization.detector";
import { CICDDetector } from "./cicd.detector";
import { DeploymentDetector } from "./deployment.detector";
import { HealthDetector } from "./health.detector";

// Import all your detectors here
// import { RuntimeDetector } from "./detectors/runtime"; ...

export const ProjectAnalyzer = {
  async analyze(repoPath: string): Promise<CumulativeReport> {
    console.log(`🚀 Starting analysis for: ${repoPath}`);

    // 1. Run Global Detectors (Repo-wide context)
    const [metadata, languages, cicd, deployment, containers] = await Promise.all([
      RepoMetadataDetector.detect(repoPath),
      LanguageCompositionDetector.detect(repoPath),
      CICDDetector.detect(repoPath),
      DeploymentDetector.detect(repoPath),
      ContainerizationDetector.detect(repoPath),
    ]);

    // 2. Run Service-Level Detectors
    // We run these and then we will group them by their 'path' or 'relativePath'
    const [
      runtimes,
      frameworks,
      apiStyles,
      entries,
      databases,
      envVars,
      tooling,
      health
    ] = await Promise.all([
      RuntimeDetector.detect(repoPath),
      FrameworkDetector.detect(repoPath),
      APIStyleDetector.detect(repoPath),
      EntryPointDetector.detect(repoPath),
      DatabaseDetector.detect(repoPath),
      ENVVarDetector.detect(repoPath),
      ToolingDetector.detect(repoPath),
      HealthDetector.detect(repoPath),
    ]);

    // 3. Orchestrate and Merge (The "Aggregation" Phase)
    // We use a Map to group everything by service path
    const serviceMap = new Map<string, Partial<ServiceManifest>>();

    const getService = (p: string) => {
      if (!serviceMap.has(p)) {
        serviceMap.set(p, { 
          path: p, 
          name: path.basename(p) === "." ? "root" : path.basename(p),
          frameworks: [],
          apiStyles: [],
          databases: [],
          entryPoints: []
        });
      }
      return serviceMap.get(p)!;
    };

    // Mapping logic (Loop through results and assign to the correct service)
    runtimes.data?.forEach(d => getService(d.relativePath!).runtime = d);
    frameworks.data?.forEach(d => getService(d.relativePath!).frameworks?.push(d));
    apiStyles.data?.forEach(d => getService(d.relativePath!).apiStyles?.push(d));
    entries.data?.forEach(d => getService(d.relativePath!).entryPoints?.push(d));
    databases.data?.forEach(d => getService(d.relativePath!).databases?.push(d));
    envVars.data?.forEach(d => getService(d.relativePath!).envVars = { declared: d.declared, used: d.used });
    tooling.data?.forEach(d => getService(d.relativePath!).tooling = d);
    health.data?.forEach(d => getService(d.relativePath!).health = d);

    // 4. Final Assembly
    const report: CumulativeReport = {
      timestamp: new Date().toISOString(),
      repository: {
        name: basename(repoPath),
        path: repoPath, 
        metadata: metadata.data,
        languages: languages.data,
      },
      services: Array.from(serviceMap.values()) as ServiceManifest[],
      infrastructure: {
        ciCd: cicd.data || [],
        deployment: deployment.data || [],
        containerization: containers.data || [],
      },
      globalHealth: {
        averageScore: this.calculateAvgHealth(health.data || []),
        issues: this.extractGlobalWarnings([
          metadata, languages, cicd, deployment, containers, 
          runtimes, frameworks, apiStyles, databases
        ])
      }
    };

    return report;
  },

  calculateAvgHealth(healthData: any[]): number {
    if (healthData.length === 0) return 0;
    const sum = healthData.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round(sum / healthData.length);
  },

  extractGlobalWarnings(results: DetectorResult<any>[]): string[] {
    return results
      .filter(r => !r.success && r.warnings)
      .flatMap(r => r.warnings || []);
  }
};