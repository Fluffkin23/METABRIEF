"use server";

import { createStreamableValue } from "ai/rsc";
import { generateEmbeddingOllama } from "~/lib/ollama";
import { db } from "~/server/db";

/**
 * Asks a question within the context of a specific project and retrieves relevant data based on vector similarity.
 *
 * @param {string} question - The question to be asked.
 * @param {string} projectId - The identifier for the project context.
 * @return {Promise<any>} Resolves with the query result containing information such as file name, source code, summary, and similarity score.
 */
export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue();

  const queryVector = await generateEmbeddingOllama(question);
  const vectorQuery = `[${queryVector.join(",")}]`;

  // Query the database to find code files relevant to the question
  // Uses vector similarity search to find files with similar embeddings to the question
  // Returns top 10 most similar files with similarity score > 0.5
  const result = (
    await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1-("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1-("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10
  `) as { fileName: string; sourceCode: string; summary: string; similarity: number; }[];

  let context = "";
  
  // Build context string by concatenating file info from each relevant document
  for (const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\nsummary of file: ${doc.summary}\n\n`;
  }

  const prompt = `You are an AI code assistant helping an intern understand a codebase.AI has expert knowledge, and gives helpful, clear, detailed responses.Only respond with information found in the context.

    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK

    START QUESTION
    ${question}
    END OF QUESTION

    Only use context to answer. If unsure, say "I'm sorry, but I don't know the answer to that question".
    Use markdown and code snippets.`;

  // Replace with your Ollama API endpoint
  const ollamaURL = "http://192.168.1.135:11434/api/generate";

  (async () => {
    const response = await fetch(ollamaURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:4b", // or any other model you have loaded
        prompt,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      stream.done();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Ollama streams newlines and JSON per line — might need to parse each line
      for (const line of chunk.split("\n")) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              stream.update(parsed.response);
            }
          } catch (e) {
            // Ignore malformed chunks
          }
        }
      }
    }

    stream.done();
  })();

  return {
    output: stream.value,
    fileReferences: result,
  };
}
