"use client";

import useProject from "~/hooks/use-project";
import { api } from "~/trpc/react";

const TeamMembers = () => {
  const { projectId } = useProject();
  const { data:members } = api.project.getTeamMembers.useQuery({ projectId });
  return(
    <div className="flex items-center gap-2">
      {members?.map(member => (
        <img key = {member.id} src={member.user.imageUrl || ""} alt={member.user.firstName || ""} title={member.user.emailAddress || ""} className="rounded-full" height={30} width={30}/>))}
    </div>
  )

}
export default TeamMembers;