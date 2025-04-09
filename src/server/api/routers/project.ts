import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { pollCommits } from "~/lib/github";

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
      // Poll the commits for the newly created project using its ID
      await pollCommits(project.id);
      return project; // Return the created project
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
});
