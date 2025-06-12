import axios from "axios";
import { Document } from "langchain/document";

// Function to summarize a git diff using the Ollama API
export const aisummariseCommitOllama = async (diff: string) => {
  // Constructing the prompt for the API request
  const prompt = `
You are an expert programmer, and you are trying to summarize a git diff in no more than 100 words.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means it was added.
A line that starting with \`-\` means that line was deleted.
A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
It is not part of the diff.
[...]
EXAMPLE SUMMARY COMMENTS:
\`\`\`
* Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\`\`\`
Most commits will have less comments than this examples list.
The last comment does not include the file names,
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.

Please summarise the following diff file: \n\n${diff}
`;

  const requestFn = async () => {
    const response = await axios.post(
      "http://192.168.1.135:11434/api/generate",
      {
        model: "gemma3:4b",
        prompt,
        stream: false,
      },
    );

    if (response.status !== 200 || response.data.error) {
      throw new Error(response.data.error || "Unexpected response");
    }

    return response.data.response;
  };
  return await retryWithBackoff(requestFn, 5, 1000); // max 5 retries, starting with 1s
};

export async function summariseCode(doc: Document) {
  console.log("getting summary for", doc.metadata.source);
  const code = doc.pageContent.slice(0, 1000); // limit to 1000 characters

  const prompt = `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
  You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
  Here is the code:
  ---
  ${code}
  ---
  Give a summary no more than 100 words of the code above.`;

  const response = await axios.post("http://192.168.1.135:11434/api/generate", {
    model: "gemma3:4b", // adjust to the actual model you're using
    prompt: prompt,
    stream: false,
  });

  return response.data.response;
}

export async function generateEmbeddingOllama(text: string) {
  const response = await axios.post(
    "http://192.168.1.135:11434/api/embeddings",
    {
      model: "nomic-embed-text:latest",
      prompt: text,
    },
  );

  return response.data.embedding;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  delay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      console.warn(`Attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt < maxRetries - 1) {
        const backoff = delay * Math.pow(2, attempt); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed after max retries");
}


// console.log(await generateEmbeddingOllama("Hello, world!"));


// // Example diff content to be summarized
// const diffContent = `
// diff --git a/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs b/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs
// index 17cd9cd..b25603c 100644
// --- a/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs
// +++ b/MauiStellarCThreading/ViewModel/HoroscopeViewModel.cs
// @@ -127,7 +127,7 @@ protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
//          }

//          // Method to navigate back to the previous view.
// -        private async Task goBack()
// +         private async Task goBack()
//          {
//              try
//              {
// diff --git a/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs b/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs
// index b252050..76e11be 100644
// --- a/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs
// +++ b/MauiStellarCThreading/Views/HoroscopePageView.xaml.cs
// @@ -5,5 +5,11 @@ public partial class HoroscopePageView : ContentPage
//      public HoroscopePageView()
//      {
//          InitializeComponent();
// -	}
// +
// +        // Initialize the ViewModel
// +        _viewModel = new HoroscopeViewModel();
// +
// +        // Set the binding context of the page to the ViewModel
// +        this.BindingContext = _viewModel;
// +    }
//  }
// \ No newline at end of file
// `;

// console.log(await aisummariseCommitOllama(diffContent));