import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { redirect } from "next/navigation";
import { toast } from "sonner";

type Props = {
  params: Promise<{projectId: string}>
}

// JoinHandler component to handle joining a project
const JoinHandler = async (props: Props) => {
  // Extract projectId from props
  const {projectId} = await props.params;
  // Get userId from auth
  const {userId} = await auth();
  // If no userId, redirect to sign-in page
  if (!userId) return redirect ("/sign-in");

  // Find the user in the database
  const dbUser = await db.user.findFirst({
    where: { id: userId }
  })
  // Get clerk client
  const client = await clerkClient()
  // Get user from clerk
  const user = await client.users.getUser(userId);
  // If user doesn't exist in db, create user
  if (!dbUser) {
    await db.user.create({
      data: {
        id: userId,
        emailAddress: user.emailAddresses[0]!.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl || "/logo.png",
      }
    })
  }
  // Find the project in the database
  const project = await db.project.findUnique({
    where: {id: projectId}
  })
  // If project doesn't exist, redirect to dashboard
  if(!project) return redirect("/dashboard");
  try{
    // Create a new user to project connection
    await db.userToProject.create({
      data: {
        userId,
        projectId
      }
    })
  }catch(e){
    // Log if user is already in project
    console.log("user already in project")
    // toast.error("You are already in this project")
  }
  // Redirect to dashboard
  return redirect("/dashboard");
}
export default JoinHandler;