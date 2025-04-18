import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { pollCommits } from "~/lib/github";
import { indexGithubRepo } from "~/lib/github-loader";
import { pollCommitsGitlab } from "~/lib/gitlab";
import {indexGitlabRepo} from "~/lib/gitlab-loader";

// Create a router for project-related API endpoints
export const projectRouter = createTRPCRouter({
  // Procedure to create a new project
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(), // Name of the project
        githubUrl: z.string(), // URL of the GitHub repository
        githubToken: z.string().optional(), // Optional GitHub token for authentication
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create a new project in the database
      const project = await ctx.db.project.create({
        data: {
          githubUrl: input.githubUrl, // Store the GitHub URL
          name: input.name, // Store the project name
          userToProject: {
            create: {
              userId: ctx.user.userId!, // Associate the project with the user
            },
          },
        },
      });
      if(input.githubUrl.includes("gitlab.com") || input.githubUrl.includes("gitlab.metaminds.com")) {
        console.log("Detected GitLab repository");
        await indexGitlabRepo(project.id, input.githubUrl, input.githubToken)
        await pollCommitsGitlab(project.id);
      }else if (input.githubUrl.includes("github.com")) {
        console.log("Detected GitHub repository");
        await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
        await pollCommits(project.id);
      }
      // Return the created project
      return project;
    }),
  
  // Procedure to retrieve all projects for the authenticated user
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProject: { some: { userId: ctx.user.userId! } }, // Filter projects by user ID
        deletedAt: null, // Exclude deleted projects
      },
    });
  }),
  // Procedure to retrieve commits for a specific project based on project ID
  getCommits: protectedProcedure.input(z.object({projectId: z.string(),})).query(async ({ ctx, input })  => {
    // Fetching commits from the database where the project ID matches the input
    pollCommits(input.projectId).then().catch(console.error);
    return await ctx.db.commit.findMany({
      where: { projectId: input.projectId },
    });
  }),
});
