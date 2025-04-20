import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import {z} from "zod";
import {pollCommits} from "~/lib/github";
import {indexGithubRepo} from "~/lib/github-loader";
import {pollCommitsGitlab} from "~/lib/gitlab";
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
        .mutation(async ({ctx, input}) => {
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
            if (input.githubUrl.includes("gitlab.com") || input.githubUrl.includes("gitlab.metaminds.com")) {
                console.log("Detected GitLab repository");
                await indexGitlabRepo(project.id, input.githubUrl, input.githubToken)
                await pollCommitsGitlab(project.id);
            } else if (input.githubUrl.includes("github.com")) {
                console.log("Detected GitHub repository");
                await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
                await pollCommits(project.id);
            }
            // Return the created project
            return project;
        }),

    // Procedure to retrieve all projects for the authenticated user
    getProjects: protectedProcedure.query(async ({ctx}) => {
        return await ctx.db.project.findMany({
            where: {
                userToProject: {some: {userId: ctx.user.userId!}}, // Filter projects by user ID
                deletedAt: null, // Exclude deleted projects
            },
        });
    }),
    // Procedure to retrieve commits for a specific project based on project ID
    getCommits: protectedProcedure.input(z.object({projectId: z.string(),})).query(async ({ctx, input}) => {
        // Fetching commits from the database where the project ID matches the input
        pollCommits(input.projectId).then().catch(console.error);
        return await ctx.db.commit.findMany({
            where: {projectId: input.projectId},
        });
    }),
    // Procedure to save a user's answer to a question for a specific project
    saveAnswer: protectedProcedure.input(z.object({
        projectId: z.string(),
        question: z.string(),
        answer: z.string(),
        fileReferences: z.any(),
    })).mutation(async ({ctx, input}) => {
        return await ctx.db.question.create({
            data: {
                answer: input.answer,
                filesReferences: input.fileReferences,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.user.userId!
            }
        })
    }),
    // Procedure to retrieve questions for a specific project based on project ID
    getQuestions: protectedProcedure.input(z.object({projectId: z.string()})).query(async({ctx, input}) =>{
        // Fetch questions from the database based on the provided project ID
        return await ctx.db.question.findMany({
            where: {
                projectId: input.projectId
            },
            // Include user information with each question
            include: {
                user: true
            },
            // Order the questions by creation date in descending order
            orderBy: {
                createdAt: "desc"
            }
        })
    }),
  // Procedure to upload a meeting
  uploadMeeting: protectedProcedure.input(z.object({ projectId: z.string(), meetingUrl: z.string(), name:z.string()})).
  mutation(async({ctx, input}) => {
    // Create a new meeting in the database
    const meeting = await ctx.db.meeting.create({
      data:{
        meetingUrl: input.meetingUrl,
        projectId: input.projectId,
        name: input.name,
        status: "PROCESSING"
      }
    })
    return meeting
  }),
  // Procedure to retrieve meetings for a specific project based on project ID
  getMeetings:protectedProcedure.input(z.object({projectId: z.string()})).query(async({ctx, input}) => {
    return await ctx.db.meeting.findMany({ where:{ projectId: input.projectId}, include: {issues:true} })
  }),
  // Procedure to delete a meeting by its ID
  deleteMeeting: protectedProcedure.input(z.object({ meetingId: z.string() })).mutation(async ({ ctx, input }) => {
    // Delete the meeting from the database
    return await ctx.db.meeting.delete({ where: { id: input.meetingId }, });
  }),
  // Procedure to retrieve a meeting by its ID
  getMeetingById: protectedProcedure.input(z.object({ meetingId: z.string() })).query(async ({ ctx, input }) => {
      return await ctx.db.meeting.findUnique({ where: { id: input.meetingId }, include: { issues: true } });
    })
});
