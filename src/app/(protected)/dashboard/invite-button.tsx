"use client"

import { useEffect, useState } from "react";
import useProject from "~/hooks/use-project";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

const InviteButton = () => {
  // Access the projectId using the useProject hook
  const { projectId } = useProject();
  // State to control the visibility of the dialog
  const [open, setOpen] = useState(false);
  // State to store the origin URL
  const [origin, setOrigin] = useState("");

  // Effect to set the origin URL when the component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set the origin to the window's location origin
      setOrigin(window.location.origin);
    }
  }, []);
  // Construct the invite link using the origin and projectId
  const inviteLink = `${origin}/join/${projectId}`;

  return (
    <>
      {/* Dialog component for displaying the invite link */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Ask them to copy and paste this link</p>
          {/* Input field displaying the invite link */}
          <Input className="mt-4" readOnly value={inviteLink} onClick={() => {navigator.clipboard.writeText(inviteLink);
              toast.success("Link copied to clipboard");
            }}
          />
        </DialogContent>
      </Dialog>
      {/* Button to open the invite dialog */}
      <Button size="sm" onClick={() => setOpen(true)} >Invite Member</Button>
    </>
  );
}
export default InviteButton;