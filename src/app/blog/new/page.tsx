import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getRideOptions } from "@/lib/blog";
import { createBlogPost } from "../actions";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "Write a post" };

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/sign-in");
  const { error } = await searchParams;
  const rides = await getRideOptions();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pt-6 pb-16">
      <Link href="/blog" className="inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Rider blog
      </Link>
      <h1 className="text-[26px]">Write a post</h1>
      <PostForm action={createBlogPost} rides={rides} error={error} submitLabel="Submit for review" />
    </div>
  );
}
