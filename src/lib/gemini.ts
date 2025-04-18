// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { Document } from "langchain/document";

// // Initialize the Google Generative AI client with the API key from environment variables
// const genAI = new GoogleGenerativeAI(process.env.GEMENI_API_KEY!);

// // Retrieve the generative model to be used for content generation
// const model = genAI.getGenerativeModel({
//     model: "gemini-1.5-flash"
// });

// // Function to summarize a git diff using the generative AI model
// export const aisummariseCommit = async (diff: string) => {
//   // Generate a summary of the provided git diff by sending a prompt to the model
//   const response = await model.generateContent([
//     `You are an expert programmer, and you are trying to summarize a git diff.
//   Reminders about the git diff format:
//   For every file, there are a few metadata lines, like (for example):
//   \`\`\`
//   diff --git a/lib/index.js b/lib/index.js
//   index aadf691..bfef603 100644
//   --- a/lib/index.js
//   +++ b/lib/index.js
//   \`\`\`
//   This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
//   Then there is a specifier of the lines that were modified.
//   A line starting with \`+\` means it was added.
//   A line that starting with \`-\` means that line was deleted.
//   A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
//   It is not part of the diff.
//   [...]
//   EXAMPLE SUMMARY COMMENTS:
//   \`\`\`
//   * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
//   * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
//   * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
//   * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
//   * Lowered numeric tolerance for test files
//   \`\`\`
//   Most commits will have less comments than this examples list.
//   The last comment does not include the file names,
//   because there were more than two relevant files in the hypothetical commit.
//   Do not include parts of the example in your summary.
//   It is given only as an example of appropriate comments.`,
//     `Please summarise the following diff file: \n\n${diff}`,
//   ]);
//   return response.response.text();
// };

// /**
//  * Summarizes a code document using Gemini AI to help onboard junior developers
//  * 
//  * This function takes a Document object containing code and generates a concise summary
//  * using the Gemini AI model. The summary is designed to help junior developers understand
//  * the purpose and functionality of the code file. The function:
//  * - Logs the source file being summarized
//  * - Limits the code content to 1000 characters to stay within model constraints
//  * - Uses a specialized prompt to generate an onboarding-focused summary
//  * - Returns a concise summary of no more than 100 words
//  * 
//  * @param doc - The Document object containing the code to summarize
//  * @returns A Promise that resolves to a string containing the AI-generated summary
//  */
// export async function summariseCode(doc: Document) {
//   console.log("getting summary for", doc.metadata.source);
//   const code = doc.pageContent.slice(0, 1000); // limit to 1000 characters
//   const response = await model.generateContent([`You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
//   You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
//   Here is the code:
//   ---
//   ${code}
//   ---
//   Give a summary no more than 100 words of the code above.`]);

//   return response.response.text();
// }

// /**
//  * Generates embeddings for a given text using Google's Gemini AI model
//  * 
//  * This function takes a text input and converts it into a numerical vector representation
//  * (embedding) using the text-embedding-004 model. Embeddings are useful for:
//  * - Semantic search and similarity comparisons
//  * - Text classification and clustering
//  * - Natural language processing tasks
//  * 
//  * @param text - The input text to generate embeddings for
//  * @returns A Promise that resolves to an array of numerical values representing the text embedding
//  */
// export async function generateEmbedding(text: string) {
//   const model = genAI.getGenerativeModel({
//     model: "text-embedding-004"
//   });

//   const response = await model.embedContent(text);
//   const embeddings = response.embedding;
//   return embeddings.values;
// }

// // console.log(await generateEmbedding("Hello, world!"));



// // // Example diff content to be summarized
// // const diffContent = `
// // diff --git a/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs b/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs
// // index 17cd9cd..b25603c 100644
// // --- a/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs
// // +++ b/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs
// // @@ -127,7 +127,7 @@ protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
// //          }
 
// //          // Method to navigate back to the previous view.
// // -        private async Task goBack()
// // +         private async Task goBack()
// //          {
// //              try
// //              {
// // diff --git a/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs b/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs
// // index b252050..76e11be 100644
// // --- a/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs
// // +++ b/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs
// // @@ -5,5 +5,11 @@ public partial class HoroscopePageView : ContentPage
// //      public HoroscopePageView()
// //      {
// //          InitializeComponent();
// // -	}
// // +
// // +        // Initialize the ViewModel
// // +        _viewModel = new HoroscopeViewModel();
// // +
// // +        // Set the binding context of the page to the ViewModel
// // +        this.BindingContext = _viewModel;
// // +    }
// //  }
// // \ No newline at end of file
// // `;

// // console.log(await summariseCommit(diffContent));
