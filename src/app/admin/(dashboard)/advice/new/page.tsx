import { createArticle } from "../actions";
import { ArticleForm } from "../article-form";

export default function NewArticlePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-[20px]">New article</h2>
      <ArticleForm action={createArticle} submitLabel="Create article" />
    </div>
  );
}
