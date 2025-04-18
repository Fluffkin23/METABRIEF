import { Gitlab } from "@gitbeaker/node";
import { generateEmbeddingOllama, summariseCode } from "./ollama";
import { db } from "~/server/db";

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
  if (!match) throw new Error("Not a valid GitLab URL");
  return match[1] || "";
}

/**
 * Loads and processes a GitLab repository.
 *
 * This function fetches the contents of a GitLab repository and converts them into
 * Document objects that can be used for further processing. It:
 * - Authenticates using a GitLab token (optional)
 * - Uses GitLab’s API to recursively load all files from the default branch
 *
 * @param gitlabUrl - Full URL to the GitLab project (e.g. https://gitlab.com/user/project)
 * @param gitlabToken - Optional GitLab access token for authentication
 */
export const loadGitlabRepo = async (gitlabUrl: string, gitlabToken?: string): Promise<Document[]> => {
  const gitlabOrigin = new URL(gitlabUrl).origin;
  const projectPath = parseProjectPathFromGitlabUrl(gitlabUrl);
  const branch = "main";

  const api = new Gitlab({
    host: gitlabOrigin,
    token: gitlabToken || process.env.GITLAB_TOKEN ,
  });

  const tree = await api.Repositories.tree(projectPath, {
    ref: branch,
    recursive: true,
  });

  const docs: Document[] = [];

  for (const item of tree) {
    if (item.type === "blob") {
      const fileContent = await api.RepositoryFiles.showRaw(projectPath, item.path, { ref: branch });
      docs.push({
        metadata: {
          source: item.path,
          repository: `${gitlabUrl}`,
          branch: branch,
        },
        pageContent: fileContent,
      });
    }
  }

  return docs;
};

/**
 * Generates embeddings and summaries for GitLab documents.
 *
 * @param docs - Array of Document objects to process
 * @returns Array of processed embeddings with summary, vector, source code and file name
 */
const generateEmbeddings = async (docs: Document[]) => {
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

  return await Promise.all(docs.map(async (doc, index) => {
    const fileName = doc.metadata.source ?? "unknown file";
    console.log(`🚀 [${index + 1}/${docs.length}] Generating embedding for: ${fileName}`);

    try {
      const summary = await summariseCode(doc);
      const embedding = await generateEmbeddingOllama(summary);
      updateProgress();

      return {
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      };
    } catch (error) {
      console.error(`❌ [${index + 1}/${docs.length}] Failed: ${fileName}`, error);
      return null;
    }
  }));
};

/**
 * Indexes a GitLab repository by generating embeddings and storing them in the database.
 *
 * @param projectId - ID of the project to associate the embeddings with
 * @param gitlabUrl - GitLab repository URL
 * @param gitlabToken - Optional token for authentication
 */
export const indexGitlabRepo = async (
    projectId: string,
    gitlabUrl: string,
    gitlabToken?: string
) => {
  const docs = await loadGitlabRepo(gitlabUrl, gitlabToken);
  const allEmbeddings = await generateEmbeddings(docs);

  await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
    if (!embedding) return;

    console.log(`🧠 Storing embedding ${index + 1} of ${allEmbeddings.length}: ${embedding.fileName}`);

    try {
      const saved = await db.sourceCodeEmbedding.create({
        data: {
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          projectId,
        },
      });

      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding} :: vector
        WHERE "id" = ${saved.id}
      `;
    } catch (error) {
      console.error(`❌ Error storing embedding ${index + 1}:`, error);
    }
  }));

  console.log(`✅ Embedding complete! All GitLab files for project ${projectId} indexed.`);
};
