"use client";
import useProject from "~/hooks/use-project";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "~/components/ui/dialog";
import Image from "next/image";
import { askQuestion } from "./action";
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor";
import {CodeReferences} from "~/app/(protected)/dashboard/code-references";
import {api} from "~/trpc/react";
import {toast} from "sonner";
import useRefetch from "~/hooks/use-refetch";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileReferences, setFileReferences] = useState<{ fileName: string; sourceCode: string; summary: string }[]>([]);
  const [answer, setAnswer] = useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Reset the answer state to an empty string
    setAnswer("");
    // Reset the file references state to an empty array
    setFileReferences([]);
    // Prevent the default form submission behavior
    e.preventDefault();
    // If the project ID is missing, exit the function
    if (!project?.id) return;
    // Set the loading state to true to indicate that the operation is in progress
    setLoading(true);
    // Call the askQuestion function with the question and project ID
    const { output, fileReferences } = await askQuestion(question, project.id);
    // Set the file references state with the file references returned from the askQuestion function
    setFileReferences(fileReferences);
    // Open the dialog to display the answer
    setOpen(true);

    // Iterate over the stream of data returned from the askQuestion function
    for await (const delta of readStreamableValue(output)) {
      // If there is data in the stream
      if (delta) {
        // Append the data to the answer state
        setAnswer((ans) => ans + delta);
      }
    }
    // Set the loading state to false to indicate that the operation is complete
    setLoading(false);
  };
  const refetch = useRefetch();
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>
                <Image src="/logo.png" alt="logo" width={40} height={40} />
              </DialogTitle>
              <Button  disabled={saveAnswer.isPending} variant={"outline"} onClick={() => {saveAnswer.mutate({projectId: project!.id, question, answer, fileReferences},
                  {
                  onSuccess: async () => {
                    toast.success("Answer saved successfully");
                    try {
                      await refetch();
                    } catch (error) {
                      console.error("Refetch failed:", error);
                    }
                  },
                    onError: () => {
                        toast.error("Failed to save answer");
                    }
                })
              }}>
                Save Answer
              </Button>
            </div>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-auto rounded-md border bg-white p-4 text-black shadow-inner">
            <MDEditor.Markdown
                source={answer}
                style={{ backgroundColor: "transparent", color: "inherit" }}
            />
          </div>

          <div className="h-4" />
          <CodeReferences filesReferences={fileReferences} />

          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>


      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the homepage ?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={loading}> Ask METABRIEF </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
export default AskQuestionCard;
