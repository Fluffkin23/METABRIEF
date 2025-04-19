"use client";
import useProject from "~/hooks/use-project";
import { Github, ExternalLink } from "lucide-react";
import Link from "next/link";
import CommitLog from "./commit-log";
import AskQuestionCard from "~/app/(protected)/dashboard/ask-question-card";
const Dashboard = () => {
  // Destructure the project object from the useProject hook
  const { project } = useProject();
  return (
    <div>
      {/* Container for the top section of the dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 gap-y-4">
        {/* Display the GitHub link associated with the project */}
        <div className="bg-primary w-fit rounded-md px-4 py-3">
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                {" "}
                This project is linked to {""}
                <Link
                  href={project?.githubUrl ?? ""} // Link to the project's GitHub URL
                  className="inline-flex items-center text-white/80 hover:underline"
                >
                  {project?.githubUrl} {/* Display the GitHub URL */}
                  <ExternalLink className="ml-1 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="h-4"></div>
        {/* Placeholder for team members, invite button, and archive button */}
        <div className="flex items-center gap-4">
          TeamMembers InviteButon ArchiveButton
        </div>
      </div>
      {/* Container for the middle section of the dashboard */}
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <AskQuestionCard/> {/* Placeholder for the Ask Question card */}
            MeetingCard {/* Placeholder for the Meeting card */}
        </div>
      </div>
      {/* Container for the bottom section of the dashboard */}
      <div className="mt-8">
        {/* CommitLog Placeholder for the commit log */}
        <CommitLog />
      </div>
    </div>
  );
};

export default Dashboard;
