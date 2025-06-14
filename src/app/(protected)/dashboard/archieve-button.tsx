"use client"

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import useProject from "~/hooks/use-project";
import useRefetch from "~/hooks/use-refetch";
import { toast } from "sonner";

const ArchiveButton = () => {
  const archiveProject = api.project.archiveProject.useMutation();
  const {projectId} = useProject();
  const refetch = useRefetch();

  return(
    <Button disabled={archiveProject.isPending} size="sm" variant="destructive" onClick={() => {
      const confirm = window.confirm("Are you sure you want to archive this project?");
      if(confirm) archiveProject.mutate({projectId: projectId}, {
        onSuccess: () => {
          toast.success("Project archived successfully");
          refetch();
        },
        onError: () => {
          toast.error("Error archiving project");
        }
      });
    }}> Archive
    </Button>
  )
}
export default ArchiveButton;