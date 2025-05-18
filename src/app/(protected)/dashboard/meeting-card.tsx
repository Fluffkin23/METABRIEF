"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { useDropzone } from "react-dropzone";
import { Presentation, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { uploadFile } from "~/lib/minIO";
import { api } from "~/trpc/react";
import useProject from "~/hooks/use-project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger } from "~/components/ui/select";

const MeetingCard = ({ processingLanguage, setProcessingLanguage, }: { processingLanguage: "en" | "ro" | null; setProcessingLanguage: (lang: "en" | "ro") => void; }) => {
  const { project } = useProject();
  const processMeeting = useMutation({
    mutationFn: async (data: {
      meetingUrl: string;
      meetingId: string;
      projectId: string;
      processingLanguage: "en" | "ro";
    }) => {
      const { meetingUrl, meetingId, projectId } = data;
      const response = await axios.post("/api/process-meeting", { meetingUrl, meetingId, projectId, processingLanguage });
      return response.data;
    },
  });

  const [progress, setProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const uploadMeeting = api.project.uploadMeeting.useMutation();
  const router = useRouter();

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "audio/*": [".mp3", ".wav", ".ogg", ".aac", ".m4a"] },
    multiple: false,
    maxSize: 104857600,
    onDrop: async (acceptedFiles) => {
      if (!project) {
        toast.error("No project selected.");
        return;
      }
      if (!processingLanguage) {
        toast.error("❌ Please select a processing mode first!");
        return;
      }
      const file = acceptedFiles[0];
      if (!file) {
        toast.error("No file selected.");
        return;
      }

      setIsUploading(true);
      setProgress(0);
      try {
        const downloadUrl = await uploadFile(file as File, setProgress);
        uploadMeeting.mutate({
          projectId: project.id,
          meetingUrl: downloadUrl,
          name: file.name,
        }, {
          onSuccess: (meeting) => {
            toast.success("Meeting uploaded successfully.");
            router.push('/meetings');
            processMeeting.mutateAsync({ meetingUrl: downloadUrl, meetingId: meeting.id, projectId: project.id, processingLanguage });
          }
        });
        setProgress(100);
        setTimeout(() => {
          toast.success(`File uploaded to: ${downloadUrl}`);
        }, 100);
      } catch (error) {
        setProgress(0);
        toast.error("Upload failed.");
        console.error(error);
      }
      setIsUploading(false);
    },
  });

  return (
    <Card className="col-span-2 flex flex-col items-center justify-center p-10" {...getRootProps()}>
      <Select
        onValueChange={(value) => {
          setProcessingLanguage(value as "en" | "ro");
          if (value === "en") {
            toast.success("Processing in English selected!");
          } else if (value === "ro") {
            toast.success("Processing in Romanian selected!");
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          {processingLanguage ? `Selected: ${processingLanguage === "en" ? "English" : "Romanian"}` : "Select Processing Mode"}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">Process in English</SelectItem>
          <SelectItem value="ro">Process in Romanian</SelectItem>
        </SelectContent>
      </Select>

      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Create a new meeting</h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Analyse your meeting with METABRIEF <br />
            Powered by AI.
          </p>
          <div className="mt-6">
            <Button disabled={!processingLanguage || isUploading}>
              <Upload className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />
              Upload Meeting
              <input className="hidden" {...getInputProps()} />
            </Button>
          </div>
        </>
      )}

      {isUploading && (
        <div>
          <CircularProgressbar
            value={progress}
            text={`${progress}%`}
            className="size-20"
            styles={buildStyles({
              pathColor: "#4f46e5",
              textColor: "#4f46e5",
            })}
          />
          <p className="text-center text-sm text-gray-500">Uploading your meeting...</p>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
