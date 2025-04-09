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
    owner: "docker",
    repo: "docker",
  });
  console.log(data);
};

// console.log("Hello log");
getCommitHashes(githubUrl);
