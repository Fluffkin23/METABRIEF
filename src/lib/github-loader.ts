import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";

export const loadGithubRepo = async(githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || "",
        branch: "main",
        ignoreFiles: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"],
        recursive: true,
        unknown: "warn",
        maxConcurrency: 5,
    });

    const docs = await loader.load();
    return docs;
}

const docs = await loadGithubRepo("https://github.com/Fluffkin23/MauiStellarCThreading");
console.log(docs);