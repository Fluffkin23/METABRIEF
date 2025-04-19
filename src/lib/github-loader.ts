import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "langchain/document";
// import { summariseCode } from "./gemini";
import { generateEmbeddingOllama, summariseCode } from "./ollama";
import { db } from "~/server/db";

/**
 * Loads and processes a GitHub repository using LangChain's GithubRepoLoader
 * 
 * This function fetches the contents of a GitHub repository and converts them into
 * Document objects that can be used for further processing. It:
 * - Initializes a GithubRepoLoader with the repository URL and configuration
 * - Ignores common lock files to avoid processing unnecessary files
 * - Recursively loads all files in the repository
 * - Handles authentication using an optional GitHub token
 * - Processes files concurrently with a maximum of 5 concurrent operations
 * 
 * @param githubUrl - The URL of the GitHub repository to load
 * @param githubToken - Optional GitHub access token for authentication
 * @returns A Promise that resolves to an array of Document objects containing the repository contents
 */
export const loadGithubRepo = async(githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || process.env.GITHUB_TOKEN,
        branch: "main",
        ignoreFiles: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"],
        recursive: true,
        unknown: "warn",
        maxConcurrency: 5,
    });

    const docs = await loader.load();
    return docs;
}

/**
 * Indexes a GitHub repository by creating embeddings for its source code
 * 
 * This function processes a GitHub repository by:
 * - Loading the repository contents using loadGithubRepo
 * - Generating embeddings and summaries for each file using generateEmbeddings
 * - Storing the processed data in the database with:
 *   - Textual summary of the code
 *   - Original source code content
 *   - File name
 *   - Project ID
 *   - Vector embeddings for semantic search
 * 
 * The function handles the process asynchronously and in parallel, with progress logging
 * for each file being processed. It uses Promise.allSettled to ensure all files are
 * processed even if some fail.
 * 
 * @param projectId - The ID of the project to associate the embeddings with
 * @param githubUrl - The URL of the GitHub repository to index
 * @param githubToken - Optional GitHub access token for authentication
 */
export const indexGithubRepo = async(projectId: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    const allEmbeddings = await generateEmbeddings(docs);
    await Promise.allSettled(allEmbeddings.map(async (embedding,index) => {
        console.log(`processing ${index} of ${allEmbeddings.length}`)
        if (!embedding) return;

        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data:{
                summary: embedding.summary,
                sourceCode: embedding.sourceCode,
                fileName: embedding.fileName,
                projectId: projectId,
            }
        })
        await db.$executeRaw `
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding} :: vector
        WHERE "id" = ${sourceCodeEmbedding.id}
        `
    }))
    console.log("Embeddings project stored successfully!");
}

/**
 * Generates embeddings and summaries for a collection of documents
 * 
 * This function processes an array of documents by:
 * - Generating a concise summary for each document using summariseCode
 * - Creating vector embeddings from the summaries using generateEmbeddingOllama
 * - Preserving the original source code content and file metadata
 * 
 * The function processes all documents in parallel using Promise.all for efficiency.
 * Each processed document returns an object containing:
 * - summary: AI-generated summary of the code
 * - embedding: Vector representation of the summary
 * - sourceCode: Original code content
 * - fileName: Source file name from document metadata
 * 
 * @param docs - Array of Document objects to process
 * @returns Promise that resolves to an array of processed document objects
 */
const generateEmbeddings = async(docs: Document[]) => {
    const total = docs.length;
    let completedCount = 0;

    console.log(`📦 Starting embedding for ${total} documents...\n`);

    const updateProgress = () => {
        completedCount++;
        const percent = ((completedCount / total) * 100).toFixed(1);
        const barLength = 20;
        const filledLength = Math.round((completedCount / total) * barLength);
        const bar = "█".repeat(filledLength) + "-".repeat(barLength - filledLength);
        process.stdout.write(`\r📊 Progress: [${bar}] ${completedCount}/${total} (${percent}%)`);
    };

    return await Promise.all(docs.map(async (doc,index) => {
        const fileName = doc.metadata.source ?? "unknown file";
        console.log(`🚀 [${index + 1}/${docs.length}] Generating embedding for: ${fileName}`);
        try{
            const summary = await summariseCode(doc);
            const embedding = await generateEmbeddingOllama(summary);
            updateProgress();
            return {
                summary,
                embedding,
                sourceCode : JSON.parse(JSON.stringify(doc.pageContent)),
                fileName : doc.metadata.source,
            }
        }catch (error) {
            console.error(`❌ [${index + 1}/${docs.length}] Failed: ${fileName}`, error);
            return null; // You can also throw here if you want to fail-fast
        }
    }));
}

// const docs = await loadGithubRepo("https://github.com/Fluffkin23/MauiStellarCThreading");
// console.log(docs);