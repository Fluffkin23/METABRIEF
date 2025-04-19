"use client";

import React, { useState } from "react";
import { Card } from "~/components/ui/card";
import { useDropzone } from "react-dropzone";
// import { uploadFile } from "~/lib/firebase";
import { Presentation, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { uploadFile } from "~/lib/minIO";

const MeetingCard = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "audio/*": [".mp3", ".wav", ".ogg", ".aac", ".m4a"]},
    multiple: false,
    maxSize: 104857600, // 100MB
    onDrop: async (acceptedFiles) => {setIsUploading(true);
      const file = acceptedFiles[0];
      let currentProgress = 0;
      const maxSimulatedProgress = 90;

      const interval = setInterval(() => {
        currentProgress += 1.8 + Math.random(); // smooth simulated boost
        if (currentProgress >= maxSimulatedProgress) {
          clearInterval(interval);
          return;
        }
        setProgress(Math.round(currentProgress));
      }, 200); // ~10s to reach ~90%

      try {
        // 🕓 Artificial delay to simulate 10s upload time
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Actual upload
        const fileUrl = await uploadFile(file as File);

        clearInterval(interval);
        setProgress(100);

        setTimeout(() => {
          window.alert(`File uploaded to: ${fileUrl}`);
        }, 100);
      } catch (error) {
        clearInterval(interval);
        setProgress(0);
        window.alert("Upload failed.");
        console.error(error);
      }

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
