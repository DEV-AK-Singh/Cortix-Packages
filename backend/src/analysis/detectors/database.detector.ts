import fg from "fast-glob"
import path from "path"
import fs from "fs/promises"
import { Detector, DetectorResult } from "./base"
import { DatabaseInfo, DatabaseType } from "./types"
import { ANALYSIS_IGNORE } from "./constants"

export const DatabaseDetector: Detector<DatabaseInfo[]> = {
  name: "DatabaseDetector",

  async detect(repoPath: string): Promise<DetectorResult<DatabaseInfo[]>> {
    try {
      const results: DatabaseInfo[] = []
      const normalizedRepoPath = repoPath.split(path.sep).join("/")

      const serviceFiles = await fg(
        [
          "**/package.json",
          "**/requirements.txt",
          "**/pyproject.toml",
          "**/go.mod",
          "**/pom.xml",
          "**/build.gradle",
        ],
        {
          cwd: normalizedRepoPath,
          deep: 5,
          ignore: ANALYSIS_IGNORE,
          absolute: true,
        }
      )

      if (serviceFiles.length === 0) {
        return {
          success: false,
          warnings: ["No service roots found for database detection"],
        }
      }

      const serviceRoots = new Set(serviceFiles.map((f) => path.dirname(f)))

      for (const servicePath of serviceRoots) {
        const relativePath = path.relative(repoPath, servicePath) || "."
        let dbFoundInDir = false

        // ---------- NODE (package.json) ----------
        const pkgPath = path.join(servicePath, "package.json")
        if (await exists(pkgPath)) {
          const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"))
          const deps = { ...pkg.dependencies, ...pkg.devDependencies }

          if (deps["pg"] || deps["pg-promise"] || deps["@prisma/client"]) {
            results.push(db("postgres", servicePath, relativePath, ["pg/prisma"], 0.9))
            dbFoundInDir = true
          }
          if (deps["mysql"] || deps["mysql2"] || deps["sequelize"]) {
            results.push(db("mysql", servicePath, relativePath, ["mysql/sequelize"], 0.9))
            dbFoundInDir = true
          }
          if (deps["mongoose"] || deps["mongodb"]) {
            results.push(db("mongodb", servicePath, relativePath, ["mongodb"], 0.9))
            dbFoundInDir = true
          }
          if (deps["ioredis"] || deps["redis"]) {
            results.push(db("redis", servicePath, relativePath, ["redis"], 0.9))
            dbFoundInDir = true
          }
          if (deps["sqlite3"] || deps["better-sqlite3"]) {
            results.push(db("sqlite", servicePath, relativePath, ["sqlite"], 0.9))
            dbFoundInDir = true
          }
          if (deps["@aws-sdk/client-dynamodb"] || deps["aws-sdk"]) {
            results.push(db("dynamodb", servicePath, relativePath, ["aws-sdk"], 0.8))
            dbFoundInDir = true
          }
        }

        // ---------- PYTHON (requirements.txt / pyproject.toml) ----------
        const pyDepsFiles = ["requirements.txt", "pyproject.toml"]
        for (const file of pyDepsFiles) {
          const fullPath = path.join(servicePath, file)
          if (await exists(fullPath)) {
            const content = (await fs.readFile(fullPath, "utf-8")).toLowerCase()
            if (content.includes("psycopg2") || content.includes("sqlalchemy")) {
              results.push(db("postgres", servicePath, relativePath, [file], 0.9))
              dbFoundInDir = true
            }
            if (content.includes("pymongo") || content.includes("motor")) {
              results.push(db("mongodb", servicePath, relativePath, [file], 0.9))
              dbFoundInDir = true
            }
            if (content.includes("redis")) {
              results.push(db("redis", servicePath, relativePath, [file], 0.9))
              dbFoundInDir = true
            }
            if (content.includes("mysql-connector") || content.includes("pymysql")) {
              results.push(db("mysql", servicePath, relativePath, [file], 0.9))
              dbFoundInDir = true
            }
          }
        }

        // ---------- GO (go.mod) ----------
        const goModPath = path.join(servicePath, "go.mod")
        if (await exists(goModPath)) {
          const content = await fs.readFile(goModPath, "utf-8")
          if (content.includes("lib/pq") || content.includes("jackc/pgx")) {
            results.push(db("postgres", servicePath, relativePath, ["go.mod"], 0.9))
            dbFoundInDir = true
          }
          if (content.includes("go-sql-driver/mysql")) {
            results.push(db("mysql", servicePath, relativePath, ["go.mod"], 0.9))
            dbFoundInDir = true
          }
          if (content.includes("go-redis/redis")) {
            results.push(db("redis", servicePath, relativePath, ["go.mod"], 0.9))
            dbFoundInDir = true
          }
        }

        // ---------- JAVA (pom.xml) ----------
        const pomPath = path.join(servicePath, "pom.xml")
        if (await exists(pomPath)) {
          const content = await fs.readFile(pomPath, "utf-8")
          if (content.includes("postgresql")) {
            results.push(db("postgres", servicePath, relativePath, ["pom.xml"], 0.9))
            dbFoundInDir = true
          }
          if (content.includes("mysql-connector")) {
            results.push(db("mysql", servicePath, relativePath, ["pom.xml"], 0.9))
            dbFoundInDir = true
          }
          if (content.includes("spring-boot-starter-data-mongodb")) {
            results.push(db("mongodb", servicePath, relativePath, ["pom.xml"], 0.9))
            dbFoundInDir = true
          }
        }

        // ---------- FALLBACK (If nothing found in service folder) ----------
        if (!dbFoundInDir) {
          results.push(db("unknown", servicePath, relativePath, [], 0.5))
        }
      }

      return { success: true, data: results }
    } catch (err: any) {
      return { success: false, warnings: [`Database detection failed: ${err.message}`] }
    }
  },
}

// ---------- helpers ----------
function db(
  type: DatabaseType,
  pathAbs: string,
  relativePath: string,
  indicators: string[],
  confidence: number
): DatabaseInfo {
  return { type, path: pathAbs, relativePath, indicators, confidence }
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}