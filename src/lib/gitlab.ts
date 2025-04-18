import { Gitlab } from "@gitbeaker/node";
import { db } from "~/server/db";
import {aisummariseCommitOllama} from "~/lib/ollama";

// Initialize GitLab client with a personal access token and custom base URL
export const gitlab = new Gitlab({
  host: "https://gitlab.metaminds.com", // Custom GitLab domain
  token: process.env.GITLAB_TOKEN,
});

type Response = {
  commitMessage: string;
  commitHash: string;
  commitAuthorName: string;
  commitAuthorAvatar: string | null;
  commitDate: string;
};

/**
 * Helper function to parse the GitLab URL into its namespace and project name.
 */
function parseGitLabUrl(url: string): { namespace: string; project: string } {
  const cleanedUrl = url.replace("https://gitlab.metaminds.com/", "");
  const parts = cleanedUrl.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid GitLab URL: ${url}`);
  }
  const namespace = parts.slice(0, -1).join("/");
  let project = parts[parts.length - 1]!;
  if (project.endsWith(".git")) {
    project = project.slice(0, -4);
  }
  return { namespace, project };
}
/**
 * Fetch the latest commit hashes from a GitLab repository.
 */
export const getCommitHashes = async (
  gitlabUrl: string,
): Promise<Response[]> => {
  const { namespace, project } = parseGitLabUrl(gitlabUrl);
  console.log("Parsed Namespace:", namespace, "Parsed Project:", project);

  try {
    // Fetch commits (up to 100 per page) to allow sorting and slicing.
    const rawCommits = await gitlab.Commits.all(`${namespace}/${project}`, {
      perPage: 100,
    });
    if (!rawCommits || rawCommits.length === 0) {
      console.log("No commits fetched.");
      return [];
    }

    // Sort commits by creation date (descending) and keep the latest ones.
    return rawCommits
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5) // Keep only the latest 5 commits
      .map(
        (commit: any): Response => ({
          commitHash: commit.id as string,
          commitMessage: commit.message ?? "",
          commitAuthorName: commit.author_name ?? "",
          commitAuthorAvatar: commit.author_email
            ? `https://www.gravatar.com/avatar/${commit.author_email}?d=identicon`
            : null,
          commitDate: commit.created_at ?? "",
        }),
      );
  } catch (error) {
    console.error(`GitLab API Error (${namespace}/${project}):`, error);
    throw new Error(
      `Could not fetch commits for repository: ${namespace}/${project}. Please check the URL or the repository's access permissions.`,
    );
  }
};

/**
 * Poll GitLab commits for the given project.
 */
export const pollCommitsGitlab = async (projectId: string) => {
  console.log("Polling commits for project:", projectId);
  try {
    const { githubUrl } = await fetchProjectGithubUrl(projectId);
    if (!githubUrl) {
      throw new Error(`No valid GitLab URL found for project: ${projectId}`);
    }
    console.log("GitLab URL for Project:", githubUrl);

    const commitHashes = await getCommitHashes(githubUrl);
    if (!commitHashes.length) {
      console.log(`No commits found for project: ${projectId}`);
      return [];
    }
    const unprocessedCommits = await filterUnprocessedCommits(
      projectId,
      commitHashes,
    );

    // Generate commit summaries in parallel
    const summaryResponses = await Promise.allSettled(
      unprocessedCommits.map((commit) =>
        summariesCommit(githubUrl, commit.commitHash),
      ),
    );
    console.log("Summary responses:", summaryResponses);

    const summaries = summaryResponses.map((response) =>
      response.status === "fulfilled" ? (response.value as string) : "",
    );

    // Create commit entries in the database
    const commits = await db.commit.createMany({
      data: summaries.map((summary, index) => {
        console.log(`Processing commit ${index}`);
        return {
          projectId,
          commitHash: unprocessedCommits[index]!.commitHash,
          commitMessage: unprocessedCommits[index]!.commitMessage,
          commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
          commitAuthorAvatar:
            unprocessedCommits[index]!.commitAuthorAvatar ?? "",
          commitDate: unprocessedCommits[index]!.commitDate,
          summary,
        };
      }),
    });

    return commits;
  } catch (error) {
    console.error("Error in pollCommitsGitlab:", error);
    throw error;
  }
};

/**
 * Generate a summary for a commit by fetching its diff and passing it to the AI summarizer.
 */
async function summariesCommit(gitlabUrl: string, commitHash: string) {
  const { namespace, project } = parseGitLabUrl(gitlabUrl);
  try {
    const diffData = await gitlab.Commits.diff(
      `${namespace}/${project}`,
      commitHash,
    );
    const unifiedDiff = diffData
      .map((fileDiff: any) => {
        const fileHeader =
          `diff --git a/${fileDiff.old_path} b/${fileDiff.new_path}\n` +
          `index ${fileDiff.diff_hash}..${fileDiff.diff_hash} 100644\n` +
          `--- a/${fileDiff.old_path}\n` +
          `+++ b/${fileDiff.new_path}`;
        return `${fileHeader}\n${fileDiff.diff}`;
      })
      .join("\n");

    console.log(
      `Transformed unified diff for commit ${commitHash}:`,
      unifiedDiff,
    );
    return (await aisummariseCommitOllama(unifiedDiff)) || "";
  } catch (error) {
    console.error(`Error fetching diff for commit ${commitHash}:`, error);
    throw new Error(`Failed to fetch diff for commit ${commitHash}`);
  }
}

/**
 * Fetch the GitLab URL for a project from the database.
 */
async function fetchProjectGithubUrl(projectId: string) {
  console.log("Fetching project data for ID:", projectId);
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubUrl: true },
  });
  if (!project?.githubUrl) {
    throw new Error(`Project ${projectId} does not have a valid GitLab URL.`);
  }
  return { githubUrl: project.githubUrl };
}

/**
 * Filter out commits that have already been processed.
 */
async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: Response[],
) {
  console.log("Fetching processed commits for project:", projectId);
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true },
  });
  const processedCommitHashes = new Set(
    processedCommits.map(({ commitHash }) => commitHash),
  );
  return commitHashes.filter(
    (commit) => !processedCommitHashes.has(commit.commitHash),
  );
}
