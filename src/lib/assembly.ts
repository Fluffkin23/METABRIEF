
import {AssemblyAI} from "assemblyai";

const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY!});

// Function to convert milliseconds to a time format (mm:ss)
function msToTime(ms: number) {
    // Convert milliseconds to seconds
    const seconds = ms / 1000;
    // Calculate the number of minutes
    const minutes = Math.floor(seconds / 60);
    // Calculate the remaining seconds
    const remainderSeconds = Math.floor(seconds % 60);

    // Format the time as mm:ss, padding with leading zeros if necessary
    return `${minutes.toString().padStart(2,"0")}: ${remainderSeconds.toString().padStart(2,"0")}`;
}

// Function to process a meeting given its audio URL and return a summary
export const processMeeting = async(meetingUrl: string) => {
  // Transcribe the audio from the meeting URL using AssemblyAI
  const transcript = await client.transcripts.transcribe({
    audio: meetingUrl,
    auto_chapters: true
  })

  // Map over the chapters in the transcript to create summaries with formatted start and end times
  const summaries = transcript.chapters?.map(chapter => ({
    // Format the start time of the chapter
    start : msToTime(chapter.start),
    // Format the end time of the chapter
    end : msToTime(chapter.end),
    gist: chapter.gist,
    headline: chapter.headline,
    summary: chapter.summary
  })) || []
  // Throw an error if no text is found in the transcript
  if(!transcript.text) throw new Error("No text found in transcript");

  // Return the summaries
  return { summaries }
}

// const FILE_URL = "https://assembly.ai/sports_injuries.mp3";
// const response = await processMeeting(FILE_URL);
//
// console.log(response)