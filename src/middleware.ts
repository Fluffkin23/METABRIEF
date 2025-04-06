// Import the Clerk middleware for authentication
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This is where we set up the public routes
// We match the routes for sign-in and sign-up pages
// So, if you're trying to access those, no need to authenticate
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Create and export the middleware instance
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})


// Configuration for when the middleware should run
export const config = {
  matcher: [
    // This pattern skips Next.js internal files and static assets (like images, CSS, JS)
    // It will only run on actual pages and routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    
    // Always run middleware on API routes and tRPC endpoints
    '/(api|trpc)(.*)',
  ],
};