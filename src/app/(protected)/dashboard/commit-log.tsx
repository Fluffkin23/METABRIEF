"use client";
import { Link } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { useEffect } from "react";
import useProject from "~/hooks/use-project";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";


// Component to display the commit log for the selected project
const CommitLog = () => {
    // Retrieve the project ID and project details from the custom hook
    const {projectId, project} = useProject();
    // Fetch commits associated with the current project using the project ID
    const {data: commits} = api.project.getCommits.useQuery({projectId});
    
    return (
        <>
      <ul className="space-y-6">
        {commits?.map((commit, commitInx) => {
          return (
            <li key={commit.id} className="relative flex gap-x-4">
              {/* Vertical line indicating the commit timeline */}
              <div className={cn(
                commitInx === commits.length - 1 ? "h-6" : "-bottom-6",
                "absolute left-0 top-0 flex w-6 justify-center"
              )}>
                <div className="w-px translate-x-1 bg-gray-200"></div>
              </div>
              <>
                {/* Commit author's avatar */}
                <img src={commit.commitAuthorAvatar} alt="commit avatar"
                     className="relative mt-3 h-8 w-8 flex-none rounded-full bg-gray-50" />
                <div className="flex-auto rounded-mg bg-white p-3 ring-1 ring-inset ring-gray-200">
                  <div className="flex justify-between gap-x-4">
                    {/* Link to the specific commit on GitHub */}
                    <Link target="_blank" href={`${project?.githubUrl}/commits/${commit.commitHash}`}
                          className="py-0.5 text-xs leading-5 text-gray-500">
                      <span className="font-medium text-gray-900">
                        {commit.commitAuthorName}
                      </span>{" "}
                      <span className="inline-flex items-center"> committed
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </span>
                    </Link>
                  </div>
                  {/* Commit message */}
                  <span className="font-semibold">
                    {commit.commitMessage}
                  </span>
                  {/* Summary of the commit */}
                  <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500">
                    {commit.summary}
                  </pre>
                </div>
              </>
            </li>
          );
        })}
      </ul>
    </>
    )
}

export default CommitLog;