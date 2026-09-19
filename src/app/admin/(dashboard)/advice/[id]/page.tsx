import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { adviceArticles } from "@/db/schema";
import { updateArticle, deleteArticle } from "../actions";
import { ArticleForm } from "../article-form";
import { Button } from "@/components/ui/button";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article] = await db.select().from(adviceArticles).where(eq(adviceArticles.id, id));
  if (!article) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[20px]">Edit article</h2>
        {article.status === "published" ? (
          <Link href={`/advice/${article.slug}`} className="text-[13px] text-green-bright underline">
            View live article
          </Link>
        ) : (
          <span className="text-[13px] text-text-muted">Draft — not visible to riders</span>
        )}
      </div>
      <ArticleForm action={updateArticle.bind(null, id)} submitLabel="Save changes" defaults={article} />
      <form action={deleteArticle.bind(null, id)}>
        <Button type="submit" variant="danger" className="min-h-9 px-3 text-[13px]">
          Delete article
        </Button>
      </form>
    </div>
  );
}
