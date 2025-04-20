
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

export const processMeeting = async (meetingUrl: string) => {
  console.log("🔍 [Step 1] Downloading audio with ngrok header...");

  const res = await fetch(meetingUrl, {
    headers: {
      "ngrok-skip-browser-warning": "true", // 👈 this bypasses the interstitial
    },
  });

  if (!res.ok) {
    throw new Error(`❌ Failed to download file: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.startsWith("audio/")) {
    throw new Error(`❌ Invalid content type: ${contentType}`);
  }

  const buffer = await res.arrayBuffer();

  console.log("📤 [Step 2] Uploading to AssemblyAI...");

  const uploadRes = await client.files.upload(buffer);

  console.log("📄 Upload URL:", uploadRes);

  const transcript = await client.transcripts.transcribe({
    audio: uploadRes,
    auto_chapters: true,
  });

  console.log("🧾 [Step 3] Transcript received:", transcript.status);

  if (transcript.status === "error") {
    console.error("❌ Transcription error:", transcript.error);
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  if (!transcript.text) {
    throw new Error("❌ No text found in transcript.");
  }

  const summaries =
    transcript.chapters?.map((chapter) => ({
      start: msToTime(chapter.start),
      end: msToTime(chapter.end),
      gist: chapter.gist,
      headline: chapter.headline,
      summary: chapter.summary,
    })) || [];

  console.log("✅ Done. Returning summaries.");
  return { summaries };
};

const FILE_URL = "https://honestly-helped-fly.ngrok-free.app/meetings/1745157818172-4-25-2024.m4a";
const response = await processMeeting(FILE_URL);

console.log(response)