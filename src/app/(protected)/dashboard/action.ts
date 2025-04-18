"use server";

import {createStreamableValue} from "ai/rsc";
import {generateEmbeddingOllama} from "~/lib/ollama";
import {db} from "~/server/db";

/**
 * Streams the response from Ollama API using the given prompt
 */
async function streamOllamaResponse(prompt: string, stream: any) {

  const response = await fetch(process.env.OLLAMA_URL_GENERATE ?? "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "gemma3:4b", prompt, stream: true }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Error streaming response from Ollama");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            stream.update(parsed.response);
          }
        } catch (e) {
          throw new Error("Error parsing response from Ollama");
        }
      }
    }
  }
  stream.done();
}

export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue()
  const queryVector = await generateEmbeddingOllama(question);
  const vectorQuery = `[${queryVector.join(",")}]`;
  const result = (
      await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1-("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1-("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10
  `) as {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];

  let context = "";
  for(const doc of result) {
    context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\nsummary of file: ${doc.summary}\n\n`;
  }

  const prompt = `You are a ai code assistant who answers questions about the codebase. Your target audience is a technical intern who is looking to understand the codebase.
      AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        If the question is asking about code or a specific file, AI will provide the detailed answer, giving step by step instructions, including code snippets.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK

      START QUESTION
      ${question}
      END OF QUESTION
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
        AI assistant will not invent anything that is not drawn directly from the context.
      Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering, make sure there is no ambiguity and include any and all relevant information to give context to the intern.
      \`,`;

  // Now stream the response using the extracted function
  void streamOllamaResponse(prompt, stream);

  return {
    output: stream.value,
    fileReferences: result,
  };
}
