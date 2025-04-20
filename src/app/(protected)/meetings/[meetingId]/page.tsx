import IssuesList from "~/app/(protected)/meetings/[meetingId]/issues-list";

// Define the props for the MeetingDetailsPage component
type Props = {
  // Define the params prop, which is expected to contain the meetingId
  params:Promise<{meetingId: string}>
}

// Define the MeetingDetailsPage component
const MeetingDetailsPage = async ({params}: Props) => {
  // Extract the meetingId from the params
  const {meetingId} = await params;
  // Render the IssuesList component, passing the meetingId as a prop
  return(
    <IssuesList meetingId={meetingId} />
  )
}

export default MeetingDetailsPage;