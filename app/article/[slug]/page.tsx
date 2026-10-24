import Link from "next/link";
import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { ArticleIllustration } from "@/components/ArticleIllustration";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type ArticleRow = RowDataPacket & {
  title: string;
  slug: string;
  content: string;
  category: string;
  category_slug: string;
  published_at: Date | null;
};

type RelatedArticle = RowDataPacket & {
  title: string;
  slug: string;
  category_slug: string;
};

type ArticleBlock =
  | { type: "paragraph" | "quote"; text: string; id?: never }
  | { type: "heading"; text: string; id: string };

function parseContent(content: string): { lead: string; blocks: ArticleBlock[] } {
  const paragraphs = content.split(/\r?\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const [lead = "", ...body] = paragraphs;
  let sectionNumber = 0;
  const blocks = body.map((text): ArticleBlock => {
    if (text.startsWith("## ")) {
      sectionNumber += 1;
      return { type: "heading", text: text.slice(3), id: `section-${sectionNumber}` };
    }
    if (text.startsWith("> ")) return { type: "quote", text: text.slice(2) };
    return { type: "paragraph", text };
  });
  return { lead, blocks };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [rows] = await db.execute<ArticleRow[]>(
    "SELECT a.title, a.slug, a.content, c.name AS category, c.slug AS category_slug, a.published_at FROM articles a JOIN categories c ON c.id = a.category_id WHERE a.slug = ? AND a.status = 'published' LIMIT 1",
    [slug],
  );
  const article = rows[0];
  if (!article) notFound();

  const [relatedArticles] = await db.execute<RelatedArticle[]>(
    "SELECT a.title, a.slug, c.slug AS category_slug FROM articles a JOIN categories c ON c.id = a.category_id WHERE c.id = (SELECT category_id FROM articles WHERE slug = ? LIMIT 1) AND a.slug <> ? AND a.status = 'published' ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT 3",
    [slug, slug],
  );
  const { lead, blocks } = parseContent(article.content);
  const readingMinutes = Math.max(1, Math.ceil((article.content.match(/\S+/g)?.length ?? 0) / 200));
  const formattedDate = article.published_at
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(article.published_at)
    : "Vừa cập nhật";
  const sections = blocks.filter((block): block is Extract<ArticleBlock, { type: "heading" }> => block.type === "heading");

  return (
    <main className="article-page">
      <header className="site-header article-site-header">
        <Link className="brand" href="/" aria-label="Bản Tin Mới - Trang chủ">BẢN TIN MỚI<span>.</span></Link>
        <Link className="article-header-link" href={`/category/${article.category_slug}`}>Tin {article.category} <span aria-hidden="true">↗</span></Link>
      </header>
      <article className="article-detail">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span>
          <Link href={`/category/${article.category_slug}`}>{article.category}</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{article.title}</span>
        </nav>
        <header className="article-heading">
          <Link className="eyebrow article-category" href={`/category/${article.category_slug}`}>{article.category}</Link>
          <h1>{article.title}</h1>
          {lead && <p className="article-standfirst">{lead}</p>}
          <div className="article-byline">
            <span className="byline-mark" aria-hidden="true">B</span>
            <span className="byline-author">Ban biên tập <strong>Bản Tin Mới</strong></span>
            <span className="byline-separator" aria-hidden="true" />
            <time dateTime={article.published_at?.toISOString()}>{formattedDate}</time>
            <span className="byline-separator" aria-hidden="true" />
            <span>{readingMinutes} phút đọc</span>
          </div>
        </header>

        <figure className="article-cover">
          <ArticleIllustration categorySlug={article.category_slug} />
          <figcaption>Ảnh minh họa: Unsplash</figcaption>
        </figure>

        <div className="article-reading-layout">
          <div>
            <div className="article-body">
              {blocks.map((block) => {
                if (block.type === "heading") return <h2 id={block.id} key={block.id}>{block.text}</h2>;
                if (block.type === "quote") return <blockquote key={block.text}>{block.text}</blockquote>;
                return <p key={block.text}>{block.text}</p>;
              })}
            </div>
            <p className="article-disclosure">Bài viết mẫu được biên soạn để minh họa hoạt động của cổng thông tin. Khi đăng tải tin thực tế, tòa soạn cần kiểm chứng thông tin và ghi rõ nguồn.</p>
            <Link className="button-link" href={`/category/${article.category_slug}`}>← Tin {article.category}</Link>
          </div>

          {sections.length > 0 && (
            <aside className="article-outline" aria-label="Nội dung bài viết">
              <p className="article-outline-title">TRONG BÀI NÀY</p>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}><a href={`#${section.id}`}>{section.text}</a></li>
                ))}
              </ol>
              <p className="article-outline-note">Thời gian đọc khoảng {readingMinutes} phút</p>
            </aside>
          )}
        </div>

        {relatedArticles.length > 0 && (
          <section className="article-related" aria-labelledby="related-title">
            <div className="article-related-heading">
              <p className="eyebrow">ĐỌC THÊM</p>
              <h2 id="related-title">Tin khác trong {article.category}</h2>
            </div>
            <div className="article-related-grid">
              {relatedArticles.map((related) => (
                <Link className="article-related-card" href={`/article/${related.slug}`} key={related.slug}>
                  <span>{article.category}</span>
                  <strong>{related.title}</strong>
                  <span className="related-arrow" aria-hidden="true">Đọc tiếp →</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
      <footer className="article-footer"><Link href="/">BẢN TIN MỚI</Link><span>Tin tức chọn lọc, góc nhìn đa chiều.</span></footer>
    </main>
  );
}
