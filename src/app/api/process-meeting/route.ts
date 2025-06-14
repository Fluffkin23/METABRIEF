import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processMeeting } from "~/lib/assembly";
import { db } from "~/server/db";
import { processMeetingRo } from "~/lib/assemblyRo";

const bodyParser = z.object({
  meetingUrl: z.string(),
  projectId: z.string(),
  meetingId: z.string(),
  processingLanguage: z.enum(["en", "ro"])
})

export const maxDuration = 300; // 5 minutes

// Handle POST requests to process a meeting
export async function POST(req : NextRequest){
  // Authenticate the user
  const {userId} = await auth();
  // If the user is not authenticated, return an error
  if(!userId) {
    return NextResponse.json({error : "Unauthorized"}, {status : 401});
  }
  try{
    // Parse the request body
    const body = await req.json();
    const {meetingUrl, projectId, meetingId, processingLanguage} = bodyParser.parse(body);
    // Process the meeting using AssemblyAI
    let summaries;
    if (processingLanguage === "ro") {
      console.log("🇷🇴 Using Romanian processing pipeline...");
      const result = await processMeetingRo(meetingUrl);
      summaries = result.summaries;
    } else if (processingLanguage === "en") {
      console.log("🇺🇸 Using English processing pipeline...");
      const result = await processMeeting(meetingUrl);
      summaries = result.summaries;
    } else {
      return NextResponse.json({ error: "Invalid processing language" }, { status: 400 });
    }
    // Create issues in the database for each summary
    await db.issue.createMany({
      data : summaries.map(summary => ({
        start: summary.start,
        end: summary.end,
        gist: summary.gist,
        headline: summary.headline,
        summary: summary.summary,
        meetingId
      }))
    })
    // Update the meeting status to completed
    await db.meeting.update({
      where : { id : meetingId },
      data : {
        status : "COMPLETED",
        name: summaries[0]!.headline,
      }
    })
    // Return a success response
    return NextResponse.json({success:true}, {status : 200});
  }catch (error) {
    // Log the error
    console.error(error);
    // Return an error response
    return NextResponse.json({error : "Internal server error"}, {status : 500});
  }
}