import axios from "axios";
import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

// Function to format milliseconds to mm:ss
function msToTime(ms: number): string {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = Math.floor(seconds % 60);

  return `${minutes.toString().padStart(2, "0")}:${remainderSeconds.toString().padStart(2, "0")}`;
}


// Transcribe Romanian Audio
async function transcribeRomanianAudio(meetingUrl: string): Promise<string> {
  console.log("🎤 Transcribing Romanian audio...");

  const res = await fetch(meetingUrl, {
    headers: { "ngrok-skip-browser-warning": "true" },
  });

  if (!res.ok) {
    throw new Error(`❌ Failed to download file: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.startsWith("audio/")) {
    throw new Error(`❌ Invalid content type: ${contentType}`);
  }

  const buffer = await res.arrayBuffer();
  console.log("📤 Uploading to AssemblyAI...");

  const uploadUrl = await client.files.upload(buffer);

  console.log("📝 Requesting Romanian transcription...");
  const transcript = await client.transcripts.transcribe({
    audio: uploadUrl,
    language_code: "ro",
    speech_model: "nano",
  });

  if (transcript.status === "error") {
    throw new Error(`❌ Transcription error: ${transcript.error}`);
  }

  if (!transcript.text) {
    throw new Error("❌ No text found in Romanian transcript.");
  }

  console.log("✅ Romanian transcription complete.");
  return transcript.text;
}

// Translate Romanian Text to English
async function translateWithGemma(romanianText: string): Promise<string> {
  console.log("🌍 Translating Romanian to English with Gemma...");

  const prompt = `
You are a highly skilled professional translator, fluent in both Romanian and English.

Your task is to carefully and precisely translate the following Romanian text into natural, fluent English.

Maintain the original meaning, tone (formal or informal), and style of the source text. Do not omit or add any information.

IMPORTANT: Output ONLY the English translation, with no commentary, explanation, or notes.

Here is the Romanian text:
---
${romanianText}
---
`;

  const response = await axios.post("http://192.168.1.135:11434/api/generate", {
    model: "gemma3:4b",
    prompt: prompt,
    stream: false,
  });

  const output = response.data.response;

  if (!output) {
    throw new Error("❌ No translation output from Gemma.");
  }

  console.log("✅ Translation to English complete.");
  return output.trim();
}

// Summarize English Text into Chapters
async function summarizeWithGemma(englishText: string): Promise<any[]> {
  console.log("🧠 Summarizing and creating chapters with Gemma...");

  const prompt = `
You are a professional meeting summarizer.

Your task:
- Read the full transcript carefully.
- Break it into 4 to 6 major **thematic chapters** (NOT small 5-10 second segments).
- For each chapter, output:
  - start time ("00:00")
  - end time ("05:00")
  - gist (short 1-sentence main idea)
  - headline (title of the chapter, max 8 words)
  - summary (2-5 sentence detailed description)

IMPORTANT RULES:
- Do not create tiny segments every few seconds.
- Chapters should cover major topics discussed (5-10 minutes each, logically grouped).
- Output ONLY valid JSON array with no extra text or explanation.
- Do not include text fields or raw dialogue.

Format example:
[
  {
    "start": "00:00",
    "end": "05:00",
    "gist": "Introduction and objectives discussed",
    "headline": "Kickoff Meeting",
    "summary": "The team introduces themselves, discusses project objectives, and sets initial expectations."
  },
  ...
]

Here is the full meeting transcript:
---
${englishText}
---
`;

  const response = await axios.post("http://192.168.1.135:11434/api/generate", {
    model: "gemma3:4b",
    prompt: prompt,
    stream: false,
  });

  const gemmaOutput = response.data.response;

  if (!gemmaOutput) {
    throw new Error("❌ No summarization output from Gemma.");
  }

  const jsonMatch = gemmaOutput.match(/\[.*\]/s); // Extract JSON array
  if (!jsonMatch) {
    throw new Error("❌ Failed to find valid JSON in Gemma output.");
  }

  try {
    const summaries = JSON.parse(jsonMatch[0]);
    console.log("✅ Summaries parsed successfully.");
    return summaries;
  } catch (err) {
    console.warn("⚠️ First JSON parse failed, trying to clean output...");

    try {
      // Try cleaning up extra text before/after the JSON
      const cleanOutput = gemmaOutput.substring(
        gemmaOutput.indexOf("["),
        gemmaOutput.lastIndexOf("]") + 1
      );

      const summaries = JSON.parse(cleanOutput);
      console.log("✅ Summaries parsed successfully after cleaning.");
      return summaries;
    } catch (secondErr) {
      console.error("❌ Failed to parse Gemma output even after cleaning:", gemmaOutput);
      throw new Error("Gemma returned invalid JSON format even after cleaning.");
    }
  }
}

// Main Process Function
export const processMeetingRo = async (meetingUrl: string) => {
  const romanianText = await transcribeRomanianAudio(meetingUrl);

  const englishText = await translateWithGemma(romanianText);

  const summaries = await summarizeWithGemma(englishText);

  console.log("✅ Process complete. Returning summaries.");
  return { summaries };
};

// const FILE_URL = "https://honestly-helped-fly.ngrok-free.app/metabrief/1745745929314-testRoamana.mp3";
// //
// // const response = await processMeeting(FILE_URL);
// //
// // console.log(JSON.stringify(response, null, 2));
//
// const response = await transcribeRomanianAudio(FILE_URL);
// console.log(JSON.stringify(response, null, 2));
