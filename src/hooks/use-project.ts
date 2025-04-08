"use client";
import React from "react";
import { api } from "~/trpc/react";
import { useLocalStorage } from "usehooks-ts";

// Custom hook to manage project-related state
const useProject = () => {
  // Fetching the list of projects using a query from the API
  const { data: projects } = api.project.getProjects.useQuery();
  
  // Using local storage to persist the selected project ID across sessions
  const [projectId, setProjectId] = useLocalStorage("dyonysus-projectId", "");
  
  // Finding the currently selected project based on the project ID
  const project = projects?.find((project) => project.id === projectId);

  // Returning the projects list, the currently selected project, and the project ID management functions
  return {
    projects,
    project,
    projectId,
    setProjectId,
  };
};

export default useProject;
