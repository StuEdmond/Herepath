import { TriangleAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { formatVerifiedDate, type ConditionTargetType } from "@/lib/condition-reports";
import { ConditionReportButton } from "./condition-report-button";

/**
 * How fresh a ride's details are: when our team last checked the road, any current conditions warning (with its date), and a way for
 * riders to tell us something has changed. A ride nobody has checked yet says so plainly.
 */
export async function RideFreshness({
  targetType,
  targetId,
  lastVerifiedOn,
  conditionsNote,
  conditionsNoteOn,
}: {
  targetType: ConditionTargetType;
  targetId: string;
  lastVerifiedOn: string | null;
  conditionsNote: string | null;
  conditionsNoteOn: string | null;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col gap-2">
      {conditionsNote && (
        <div className="flex gap-2 rounded-lg bg-red-tint-bg p-3 text-[14px] text-red-tint-text" role="note">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Current conditions{conditionsNoteOn ? `, updated ${formatVerifiedDate(conditionsNoteOn)}` : ""}</p>
            <p className="whitespace-pre-wrap">{conditionsNote}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1 text-[13px] text-text-muted">
        <span>{lastVerifiedOn ? `Last checked by our team: ${formatVerifiedDate(lastVerifiedOn)}` : "Not yet checked on the road by our team"}</span>
        <ConditionReportButton targetType={targetType} targetId={targetId} signedIn={!!session?.user} />
      </div>
    </div>
  );
}
