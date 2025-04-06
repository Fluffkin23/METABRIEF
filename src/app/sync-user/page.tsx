import { auth, clerkClient } from "@clerk/nextjs/server" 
import { notFound, redirect } from "next/navigation" 
import { db } from "~/server/db" 

const SyncUser = async () => {
    // Get the user ID from the authentication
    const { userId } = await auth() 
    // Check if userId exists
    if (!userId) {
        // If not, throw an error 
        throw new Error("User not found") 
    }

     // Create a Clerk client instance
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    // Check if the user has an email address
    if (!user.emailAddresses[0]?.emailAddress) { 
        return notFound() 
    }

    // Upsert (update or insert) user data in the database
    await db.user.upsert({ 
        where: {
            // Use the user's email address to find the record
            emailAddress: user.emailAddresses[0]?.emailAddress ?? "" 
        },
        // If the record exists, update the following fields
        update: { 
            firstName: user.firstName ?? "", // Update first name
            lastName: user.lastName ?? "", // Update last name
            imageUrl: user.imageUrl ?? "", // Update image URL
        },
        // If the record does not exist, create a new one with these fields
        create: { 
            id: userId, // Set the user ID
            emailAddress: user.emailAddresses[0]?.emailAddress ?? "", // Set the email address
            firstName: user.firstName ?? "", // Set the first name
            lastName: user.lastName ?? "", // Set the last name
            imageUrl: user.imageUrl ?? "", // Set the image URL
        }
    })
    // Redirect the user to the dashboard after syncing
    return redirect("/dashboard")
}
 // Export the SyncUser function for use in other parts of the app
export default SyncUser
