import { Octokit } from "octokit";
import { db } from "~/server/db";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const githubUrl = "https://github.com/Fluffkin23/MauiStellarCThreading";

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

export const getCommitHashes = async ( githubUrl: string,): Promise<Response[]> => { 
  const [owner, repo] = githubUrl.split("/").slice(-2);

  if(!owner || !repo) {
    throw new Error("Invalid github url")
  }

  const { data } = await octokit.rest.repos.listCommits({owner, repo});
  const sortedCommits = data.sort((a: any, b: any) =>new Date(b.commit.author.date).getTime() -new Date(a.commit.author.date).getTime(),) as any[];
  return sortedCommits.slice(0, 15).map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.author.login ?? "",
    commitAuthorAvatar: commit?.author.avatar_url ?? "",
    commitDate: commit.commit?.author.date ?? "",
  }));
};

// // console.log("Hello log");
// console.log(await getCommitHashes(githubUrl));

export const pollCommits = async (projectId: string) => {
  const { project, githubUrl } = await fetchProjectGithubUrl(projectId);
  const commitHashes = await getCommitHashes(githubUrl);
  const unprocessedCommits = await filterUnprocessedCommits(projectId,commitHashes,);
  console.log(unprocessedCommits);

  return unprocessedCommits;
};

async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({where: {id: projectId,},select: {githubUrl: true,},});

  if (!project?.githubUrl) {
    throw new Error("Project not found");
  }

  return { project, githubUrl: project?.githubUrl };
}

async function summariesCommit(github: string, commitHash: string) {}

async function filterUnprocessedCommits(projectId: string,commitHashes: Response[],) {
  const processedCommit = await db.commit.findMany({ where: {projectId,},});
  const unprocessedCommits = commitHashes.filter((commit) =>!processedCommit.some((processedCommit) => processedCommit.commitHash === commit.commitHash,),);

  return unprocessedCommits;
}

await pollCommits("cm99jvso90000cs25txkf7bdi").then(console.log);
