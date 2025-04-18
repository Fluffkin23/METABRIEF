import { Gitlab } from "@gitbeaker/node";
import { db } from "~/server/db";
import { generateEmbeddingOllama, summariseCode } from "./ollama";
import pLimit from "p-limit";

type Document = {
  metadata: {
    source: string;
    repository: string;
    branch: string;
  };
  pageContent: string;
};

function parseProjectPathFromGitlabUrl(gitlabUrl: string): string {
  const urlPattern = /^https?:\/\/[^/]+\/(.+?)(?:\.git)?$/;
  const match = gitlabUrl.match(urlPattern);
  if (!match) {
    throw new Error("Not a valid GitLab URL");
  }
  return match[1] || "";
}

class GitlabRepoLoader {
  private projectPath: string;
  private branch: string;
  private api: InstanceType<typeof Gitlab>;
  private repositoryUrl: string;

  constructor(gitlabUrl: string, projectPath: string, token?: string, branch: string = "main") {
    this.projectPath = projectPath;
    this.branch = branch;
    this.repositoryUrl = `${gitlabUrl}/${projectPath}`;
    this.api = new Gitlab({host: gitlabUrl, token: process.env.GITLAB_TOKEN || "",});}

  async load(): Promise<Document[]> {
    const fetchFiles = async (dirPath = ""): Promise<Document[]> => {
      const files: Document[] = [];
      const tree = await this.api.Repositories.tree(this.projectPath, {
        ref: this.branch,
        path: dirPath,
        recursive: true,
      });
      for (const item of tree) {
        if (item.type === "blob") {
          const fileContent = await this.api.RepositoryFiles.showRaw(this.projectPath, item.path, { ref: this.branch });
          files.push({metadata: {source: item.path, repository: this.repositoryUrl, branch: this.branch,}, pageContent: fileContent});
        }
      }
      return files;
    };
    return await fetchFiles();
  }
}

export const loadGitlabRepo = async (gitlabUrl: string, gitlabToken?: string,): Promise<Document[]> => {
  const gitlabOrigin = new URL(gitlabUrl).origin;
  const projectPath = parseProjectPathFromGitlabUrl(gitlabUrl);
  const loader = new GitlabRepoLoader(gitlabOrigin, projectPath, gitlabToken, "main");

  return await loader.load();
};

export const indexGitlabRepo = async (projectId: string, gitlabUrl: string, gitlabToken?: string,): Promise<void> => {
  const docs = await loadGitlabRepo(gitlabUrl, gitlabToken);

  console.log(`Processing ${docs.length} documents for embeddings`);
  const limit = pLimit(1); // Limit concurrency for embeddings
  const allEmbeddings = await Promise.allSettled(
    docs.map((doc) =>
      limit(async () => {
        try {
          const summary = await summariseCode(doc);
          const embedding = await generateEmbeddingOllama(summary);

          console.log(`Generated embedding for ${doc.metadata.source}`);

          return {summary, embedding, sourceCode: JSON.stringify(doc.pageContent), filename: doc.metadata.source,};
        } catch (error) {
          console.error(`Error generating embedding for ${doc.metadata.source}:`, error,);
          return null;
        }
      }),
    ),
  );

  console.log("Storing embeddings in the database...");
  await Promise.allSettled(allEmbeddings.map(async (embeddingResult, index) => {
      if (embeddingResult.status === "fulfilled" && embeddingResult.value) {
        const embedding = embeddingResult.value;

        console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);

        try {
          const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {summary: embedding.summary, sourceCode: embedding.sourceCode, fileName: embedding.filename, projectId,},
          });

          await db.$executeRaw `
            UPDATE "SourceCodeEmbedding"
            SET "summaryEmbedding" = ${embedding.embedding} :: vector
            WHERE "id" = ${sourceCodeEmbedding.id}
          `
        } catch (error) {
          console.error(`Error storing embedding ${index + 1}:`, error);
        }
      } else {
        console.error(`Failed to process embedding at index ${index}:`, embeddingResult);
      }
    }),
  );
};
