import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-start gap-4 p-4 pt-10">
      <h1 className="text-[28px]">Herepath</h1>
      <p className="max-w-md text-text-secondary">
        Ancient roads. Modern riders. The Explore page (search and browse) lands here in a later
        build stage.
      </p>
      <Link href="/preview">
        <Button variant="secondary">View component preview</Button>
      </Link>
    </div>
  );
}
