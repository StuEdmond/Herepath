import { redirect } from "next/navigation";
import { GUIDELINES_PATH } from "@/lib/guidelines";

// The guidelines now live on the FAQ page; this keeps any old or shared /guidelines link working.
export default function GuidelinesPage() {
  redirect(GUIDELINES_PATH);
}
