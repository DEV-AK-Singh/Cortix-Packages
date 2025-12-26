import fs from "fs";
import { LanguageCompositionDetector } from "./languageComposition.detector";
import { RepoMetadataDetector } from "./repoMetadata.detector"
import { RuntimeDetector } from "./runtime.detector";

const TEST_REPO_PATH = "C:\\Users\\Abhishek\\Desktop\\Revise\\Projects\\Droppers-App"

const runTests = async () => {
    const finalResult = {} as any;

    console.log("Running RepoMetadataDetector tests...");
    const repoMetadataResult = await RepoMetadataDetector.detect(TEST_REPO_PATH)
    finalResult["RepoMetadataDetector"] = repoMetadataResult;

    console.log("Running LanguageCompositionDetector tests...")
    const languageCompositionResult = await LanguageCompositionDetector.detect(TEST_REPO_PATH)
    finalResult["LanguageCompositionDetector"] = languageCompositionResult;

    console.log("Running RuntimeDetector tests...")
    const runtimeResult = await RuntimeDetector.detect(TEST_REPO_PATH)
    finalResult["RuntimeDetector"] = runtimeResult;

    await fs.promises.writeFile("testResults.json", JSON.stringify(finalResult, null, 2)); 
    console.log("All tests completed. Writing results to testResults.json");
};

runTests();