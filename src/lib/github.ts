import axios from "axios";
import { Octokit } from "octokit"; // Importing the Octokit library to interact with the GitHub API
import { db } from "~/server/db"; // Importing the database instance for querying the database
import { aisummariseCommitOllama } from "./ollama";

// Initializing the Octokit instance with the GitHub token for authentication
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Type definition for the response structure of commit data
type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

// Function to fetch the latest commit hashes from a GitHub repository
export const getCommitHashes = async (githubUrl: string,): Promise<Response[]> => {
  // Extracting the owner and repository name from the GitHub URL
  const [owner, repo] = githubUrl.split("/").slice(-2);
  // Validating the extracted owner and repository name
  if (!owner || !repo) {
    throw new Error("Invalid github url");
  }
  // Fetching the list of commits from the GitHub repository
  const { data } = await octokit.rest.repos.listCommits({ owner, repo });
  // Sorting the commits by date in descending order
  const sortedCommits = data.sort((a: any, b: any) =>
      new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime(),) as any[];
  // Returning the top 15 commits with relevant details
  return sortedCommits.slice(0, 15).map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.author.login ?? "",
    commitAuthorAvatar: commit?.author.avatar_url ?? "",
    commitDate: commit.commit?.author.date ?? "",
  }));
};

// Function to poll unprocessed commits for a specific project
export const pollCommits = async (projectId: string) => {
  // Fetching the GitHub URL of the project from the database
  const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
  // Fetching the latest commit hashes from the GitHub repository
  const commitHashes = await getCommitHashes(githubUrl);
  // Filtering out already processed commits
  const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes,);
  // Process each unprocessed commit to generate summaries
  const summaryResponse = await Promise.allSettled(unprocessedCommits.map((commit) => {
      // Generate a summary for each commit using the summariesCommit function
      return summariesCommit(githubUrl, commit.commitHash);
    }),
  );
  // Extract summaries from the settled promises
  const summaries = summaryResponse.map((response) => {
    // If the promise was fulfilled, use the summary value
    if (response.status === "fulfilled") {
      return response.value;
    }
    // If the promise was rejected, return an empty string as a placeholder
    return "";
  });
  // Create new commit entries in the database with the generated summaries
  // Return the created commit entries
  return db.commit.createMany({data: summaries.map((summary, index) => {
      // Log the processing of each commit for debugging purposes
      console.log(`Processing commit at index ${index}`);
      // Return the commit data structure with all necessary details
      return {
        projectId: projectId,
        commitHash: unprocessedCommits[index]!.commitHash,
        commitMessage: unprocessedCommits[index]!.commitMessage,
        commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
        commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
        commitDate: unprocessedCommits[index]!.commitDate,
        summary, // Include the generated summary
      };
    }),
  });
};

// Helper function to fetch the GitHub URL of a project from the database
async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { githubUrl: true },
  });
  // Throwing an error if the project or its GitHub URL is not found
  if (!project?.githubUrl) {
    throw new Error("Project not found");
  }
  return { project, githubUrl: project?.githubUrl };
}
// Placeholder function for summarizing a commit (not implemented yet)
async function summariesCommit(githubUrl: string, commitHash: string) {
  const { data } = await axios.get(`${githubUrl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: "application/vnd.github.v3.diff",
      Authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : undefined,
    },
  });
  return (await aisummariseCommitOllama(data)) || "";
}

// Helper function to filter out already processed commits
async function filterUnprocessedCommits(
  projectId: string,
  commitHashes: Response[],
) {
  const processedCommit = await db.commit.findMany({
    where: { projectId },
  });

  // Filtering out commits that have already been processed
  return commitHashes.filter(
    (commit) =>
      !processedCommit.some(
        (processedCommit) => processedCommit.commitHash === commit.commitHash,
      ),
  );
}

// Example usage of the pollCommits function with a sample project ID
// await pollCommits("cm99jvso90000cs25txkf7bdi").then(console.log);
