"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal, type ShareableData } from "./share-modal";

export function ShareButton({ data, className }: { data: ShareableData; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" className={className ?? "min-h-9 px-3 text-[13px]"} onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </Button>
      {open && <ShareModal data={data} onClose={() => setOpen(false)} />}
    </>
  );
}
