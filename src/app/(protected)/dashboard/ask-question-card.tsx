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

const AskQuestionCard = () => {
  const { project } = useProject();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileReferences, setFileReferences] = useState<{ fileName: string; sourceCode: string; summary: string }[]>([]);
  const [answer, setAnswer] = useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswer("");
    setFileReferences([]);
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);

    const { output, fileReferences } = await askQuestion(question, project.id);
    setFileReferences(fileReferences);
    setOpen(true);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }
    setLoading(false);
  };
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
                  onSuccess: () => {
                    toast.success("Answer saved successfully");
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
