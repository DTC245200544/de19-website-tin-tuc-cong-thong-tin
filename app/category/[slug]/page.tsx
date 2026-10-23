import Link from "next/link";
import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { ArticleIllustration } from "@/components/ArticleIllustration";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type CategoryRow = RowDataPacket & {
  id: number;
  name: string;
  slug: string;
};

type ArticleRow = RowDataPacket & {
  id: number;
  title: string;
  slug: string;
  content: string;
  published_at: Date | null;
  category: string;
  category_slug: string;
};

function formatDate(value: Date | null): string {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value)
    : "Vừa cập nhật";
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [categoryRows] = await db.execute<CategoryRow[]>(
    "SELECT id, name, slug FROM categories WHERE slug = ? LIMIT 1",
    [slug],
  );
  const category = categoryRows[0];
  if (!category) notFound();

  const [articles] = await db.execute<ArticleRow[]>(
    "SELECT a.id, a.title, a.slug, a.content, a.published_at, c.name AS category, c.slug AS category_slug FROM articles a JOIN categories c ON c.id = a.category_id WHERE c.id = ? AND a.status = 'published' ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT 50",
    [category.id],
  );

  return (
    <main className="category-page">
      <div className="utility-bar">
        <div className="portal-width utility-content">
          <Link href="/">Bản Tin Mới</Link>
          <span className="utility-divider" />
          <span>Tin tức chọn lọc, góc nhìn đa chiều</span>
          <Link href="/admin">Tòa soạn</Link>
        </div>
      </div>
      <header className="masthead portal-width">
        <Link className="publication-brand" href="/" aria-label="Bản Tin Mới - Trang chủ">
          <span className="brand-symbol">B</span>
          <span className="brand-wordmark">BẢN TIN <strong>MỚI</strong></span>
          <span className="brand-tagline">TIN TỨC · GÓC NHÌN · ĐỜI SỐNG</span>
        </Link>
        <Link className="category-home-link" href="/">← Trang chủ</Link>
      </header>
      <nav className="category-nav category-nav-simple" aria-label="Điều hướng">
        <div className="portal-width category-nav-inner">
          <Link className="home-nav" href="/" aria-label="Trang chủ">⌂</Link>
          <Link className="nav-category" href="/">Các chuyên mục</Link>
          <Link className="nav-admin" href="/admin">Tòa soạn <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>

      <div className="portal-width category-content">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">{category.name}</span>
        </nav>
        <header className="category-heading">
          <p className="eyebrow">CHUYÊN MỤC</p>
          <h1>{category.name}</h1>
          <p>Những câu chuyện mới, thông tin đáng chú ý và góc nhìn từ {category.name.toLocaleLowerCase("vi")}.</p>
        </header>
        <div className="category-page-grid">
          <section className="category-articles" aria-label={`Tin ${category.name}`}>
            <div className="category-list-heading"><h2>Tin {category.name}</h2><span>{articles.length} bài viết</span></div>
            {articles.map((article) => (
              <article className="category-story" key={article.id}>
                <Link className="category-story-art" href={`/article/${article.slug}`} aria-label={`Đọc bài: ${article.title}`}>
                  <ArticleIllustration categorySlug={article.category_slug} />
                </Link>
                <div className="category-story-copy">
                  <p className="news-card-date">{formatDate(article.published_at)} <span>·</span> {article.category}</p>
                  <h2><Link href={`/article/${article.slug}`}>{article.title}</Link></h2>
                  <p>{article.content.replace(/\s+/g, " ").slice(0, 190)}</p>
                  <Link className="card-read-link" href={`/article/${article.slug}`}>Đọc bài <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
            {articles.length === 0 && <p className="portal-notice">Chuyên mục này chưa có bài viết được xuất bản.</p>}
          </section>
          <aside className="category-sidebar">
            <div className="sidebar-heading"><span>TRÊN BẢN TIN MỚI</span></div>
            <div className="sidebar-note">
              <p className="sidebar-note-label">GÓC NHÌN MỖI NGÀY</p>
              <h3>Câu chuyện quanh ta, kể theo cách gần gũi.</h3>
              <p>Từ đời sống thường nhật đến những chuyển động đáng chú ý.</p>
              <Link href="/">Về trang chủ <span aria-hidden="true">↗</span></Link>
            </div>
          </aside>
        </div>
      </div>
      <footer className="portal-footer">
        <div className="portal-width footer-main">
          <Link className="publication-brand footer-brand" href="/">
            <span className="brand-symbol">B</span>
            <span className="brand-wordmark">BẢN TIN <strong>MỚI</strong></span>
            <span className="brand-tagline">TIN TỨC · GÓC NHÌN · ĐỜI SỐNG</span>
          </Link>
          <p>Tin tức chọn lọc, góc nhìn đa chiều.</p>
          <Link href="/">Về Bản Tin Mới</Link>
        </div>
        <div className="portal-width footer-bottom"><span>© 2026 Bản Tin Mới</span><span>Thông tin nhanh · Góc nhìn mới</span></div>
      </footer>
    </main>
  );
}
