import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type ArticleRow = {
  title: string;
  content: string;
  category: string;
  published_at: Date | null;
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [rows] = await getDb().execute(
    "SELECT a.title, a.content, c.name AS category, a.published_at FROM articles a JOIN categories c ON c.id = a.category_id WHERE a.slug = ? AND a.status = 'published' LIMIT 1",
    [slug],
  );
  const article = (rows as ArticleRow[])[0];
  if (!article) notFound();

  return (
    <main className="article-page">
      <header className="site-header"><Link className="brand" href="/">BẢN TIN MỚI<span>.</span></Link><Link href="/">← Trang chủ</Link></header>
      <article className="article-detail">
        <p className="eyebrow">{article.category} · {article.published_at ? new Date(article.published_at).toLocaleDateString("vi-VN") : ""}</p>
        <h1>{article.title}</h1>
        <div className="article-body">{article.content.split(/\r?\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        <Link className="button-link" href="/">← Quay lại trang chủ</Link>
      </article>
    </main>
  );
}
