"use client";
import { useEffect } from "react";
import useProject from "~/hooks/use-project";
import { api } from "~/trpc/react";

const CommitLog = () => {

    const {projectId} = useProject();
    const {data: commits} = api.project.getCommits.useQuery({projectId});
    

    return (
        <div>
            <pre>{JSON.stringify(commits,null,2)}</pre>
        </div>
    )
}

export default CommitLog;