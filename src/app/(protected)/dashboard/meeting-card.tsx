"use client";

import React, { useState } from "react";
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

const MeetingCard = () => {
  const { project } = useProject();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const uploadMeeting = api.project.uploadMeeting.useMutation();
  const router = useRouter();
  // useDropzone hook for handling file drops
  const { getRootProps, getInputProps } = useDropzone({
    // Define accepted file types
    accept: { "audio/*": [".mp3", ".wav", ".ogg", ".aac", ".m4a"] },
    // Disable multiple file selection
    multiple: false,
    // Set maximum file size to 100MB
    maxSize: 104857600,
    // onDrop callback function, triggered when files are dropped
    onDrop: async (acceptedFiles) => {
      // Check if a project is selected
      if (!project) {
        window.alert("No project selected.");
        return;
      }
      // Get the first file from the accepted files
      const file = acceptedFiles[0];
      // Check if a file was selected
      if (!file) {
        window.alert("No file selected.");
        return;
      }
      // Set uploading state to true
      setIsUploading(true);
      // Reset progress to 0
      setProgress(0);
      try {
        // Upload the file using uploadFile function
        const downloadUrl = await uploadFile(file as File, setProgress); // assumes optional progress callback
        // Mutate the uploadMeeting trpc mutation
        uploadMeeting.mutate({
          projectId: project.id,
          meetingUrl: downloadUrl,
          name: file.name,
        }, {
          onSuccess: () => {
            toast.success("Meeting uploaded successfully.");
            router.push('/meetings')
          }
        });
        // Set progress to 100
        setProgress(100);
        setTimeout(() => {
          window.alert(`File uploaded to: ${downloadUrl}`);
        }, 100);
      } catch (error) {
        // Reset progress on error
        setProgress(0);
        window.alert("Upload failed.");
        console.error(error);
      }
      // Set uploading state to false
      setIsUploading(false);
    }
  });
  return (
    <Card className="col-span-2 flex flex-col items-center justify-center p-10"{...getRootProps()}>
      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">{" "} Create a new meeting </h3>
          <p className="mt-1 text-center text-sm text-gray-500">Analyse your meeting with METABRIEF <br />Powered by AI.</p>
          <div className="mt-6">
            <Button disabled={isUploading}>
              <Upload className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" /> Upload Meeting
              <input className="hideene" {...getInputProps()} />
            </Button>
          </div>
        </>
      )}
      {isUploading && (
        <div>
          <CircularProgressbar value={progress} text={`${progress}%`} className="size-20" styles = {
            buildStyles({
              pathColor : "#4f46e5",
              textColor : "#4f46e5",
            })
          }/>
          <p className="text-center text-sm text-gray-500">{" "} Uploading your meeting...</p>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
