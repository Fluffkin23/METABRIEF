import { Octokit } from "octokit";

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
}

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
  const  {data} = await octokit.rest.repos.listCommits({
    owner: "Fluffkin23",
    repo: "MauiStellarCThreading",
  });
  const sortedCommits = data.sort((a:any, b:any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[];

  return sortedCommits.slice(0, 10).map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message ?? "",
    commitAuthorName: commit.author.login ?? "",
    commitAuthorAvatar: commit?.author.avatar_url ?? "",
    commitDate: commit.commit?.author.date ?? "",
  }));
};

// console.log("Hello log");
console.log(await getCommitHashes(githubUrl));
