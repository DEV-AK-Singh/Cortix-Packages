// 1. RepoMetadataDetector
// 2. LanguageCompositionDetector
// 3. RuntimeDetector
// 4. FrameworkDetector 
// 5. ApiStyleDetector
// 6. EntryPointDetector
// 7. DatabaseDetector
// 8. EnvVarDetector
// 9. ToolingDetector
// 10. ContainerizationDetector
// 11. CiCdDetector
// 12. DeploymentPlatformDetector
// 13. ProjectHealthDetector

import fs from "fs";
import { LanguageCompositionDetector } from "./languageComposition.detector";
import { RepoMetadataDetector } from "./repoMetadata.detector"
import { RuntimeDetector } from "./runtime.detector";
import { FrameworkDetector } from "./framework.detector";
import { APIStyleDetector } from "./apiStyle.detector";
import { EntryPointDetector } from "./entryPoint.detector";
import { DatabaseDetector } from "./database.detector";
import { ENVVarDetector } from "./envVar.detector";
import { ToolingDetector } from "./tooling.detector";

const TEST_REPO_PATH = "C:\\Users\\Abhishek\\Desktop\\Revise\\Projects\\Droppers-App"

const runTests = async () => {
    const finalResult = {} as any;

    console.log("Running RepoMetadataDetector tests...");
    const repoMetadataResult = await RepoMetadataDetector.detect(TEST_REPO_PATH);
    finalResult["RepoMetadataDetector"] = repoMetadataResult;

    console.log("Running LanguageCompositionDetector tests...");
    const languageCompositionResult = await LanguageCompositionDetector.detect(TEST_REPO_PATH);
    finalResult["LanguageCompositionDetector"] = languageCompositionResult;

    console.log("Running RuntimeDetector tests...");
    const runtimeResult = await RuntimeDetector.detect(TEST_REPO_PATH);
    finalResult["RuntimeDetector"] = runtimeResult;

    console.log("Running FrameworkDetector tests...");
    const frameworkResult = await FrameworkDetector.detect(TEST_REPO_PATH);
    finalResult["FrameworkDetector"] = frameworkResult;

    console.log("Running ApiStyleDetector tests...");
    const apiStyleResult = await APIStyleDetector.detect(TEST_REPO_PATH);
    finalResult["ApiStyleDetector"] = apiStyleResult;

    console.log("Running EntryPointDetector tests...");
    const entryPointResult = await EntryPointDetector.detect(TEST_REPO_PATH);
    finalResult["EntryPointDetector"] = entryPointResult;

    console.log("Running DatabaseDetector tests...");
    const databaseResult = await DatabaseDetector.detect(TEST_REPO_PATH);
    finalResult["DatabaseDetector"] = databaseResult;

    console.log("Running EnvVarDetector tests...");
    const envVarResult = await ENVVarDetector.detect(TEST_REPO_PATH);
    finalResult["EnvVarDetector"] = envVarResult;

    console.log("Running ToolingDetector tests...");
    const toolingResult = await ToolingDetector.detect(TEST_REPO_PATH);
    finalResult["ToolingDetector"] = toolingResult;

    await fs.promises.writeFile("testResults.json", JSON.stringify(finalResult, null, 2)); 
    console.log("All tests completed. Writing results to testResults.json");
};

runTests();