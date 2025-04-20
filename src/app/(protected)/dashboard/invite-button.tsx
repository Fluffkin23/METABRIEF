"use client"

import { useEffect, useState } from "react";
import useProject from "~/hooks/use-project";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

const InviteButton = () => {
  const { projectId } = useProject();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);
  const inviteLink = `${origin}/join/project/${projectId}`;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Ask them to copy and paste this link</p>
          <Input className="mt-4" readOnly value={inviteLink} onClick={() => {navigator.clipboard.writeText(inviteLink);
              toast.success("Link copied to clipboard");
            }}
          />
        </DialogContent>
      </Dialog>
      <Button size="sm" onClick={() => setOpen(true)} >Invite Member</Button>
    </>
  );
}
export default InviteButton;