"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArticleIllustration } from "@/components/ArticleIllustration";

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  category_slug: string;
  published_at: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "Vừa cập nhật";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/articles")
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được danh sách bài viết.");
        return (await response.json()) as Article[];
      })
      .then(setArticles)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Có lỗi xảy ra."))
      .finally(() => setIsLoading(false));
  }, []);

  const categoryList = [...new Map(articles.map((article) => [article.category_slug, {
    name: article.category,
    slug: article.category_slug,
  }])).values()].sort((first, second) => {
    const editorialOrder = [
      "thoi-su",
      "the-gioi",
      "kinh-doanh",
      "cong-nghe",
      "doi-song",
      "suc-khoe",
      "giao-duc",
      "the-thao",
      "van-hoa",
      "du-lich",
      "thoi-trang",
      "xe",
      "phap-luat",
      "moi-truong",
    ];
    return editorialOrder.indexOf(first.slug) - editorialOrder.indexOf(second.slug);
  });
  const primaryCategories = categoryList.slice(0, 8);
  const moreCategories = categoryList.slice(8);
  const categories = ["Tất cả", ...categoryList.map((item) => item.name)];
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return articles.filter((article) => {
      const matchesCategory = category === "Tất cả" || article.category === category;
      const matchesSearch =
        !query ||
        article.title.toLocaleLowerCase("vi").includes(query) ||
        article.excerpt.toLocaleLowerCase("vi").includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [articles, category, search]);

  const [featured, ...otherArticles] = filtered;
  const headlineStories = otherArticles.slice(0, 3);
  const sideStories = otherArticles.slice(3, 5);
  const todayLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  return (
    <main className="portal">
      <div className="utility-bar">
        <div className="portal-width utility-content">
          <span>{todayLabel}</span>
          <span className="utility-divider" />
          <span>Đọc tin tức mới nhất mỗi ngày</span>
          <Link href="/admin">Tòa soạn</Link>
        </div>
      </div>

      <header className="masthead portal-width">
        <Link className="publication-brand" href="/" aria-label="Bản Tin Mới - Trang chủ">
          <span className="brand-symbol">B</span>
          <span className="brand-wordmark">BẢN TIN <strong>MỚI</strong></span>
          <span className="brand-tagline">TIN TỨC · GÓC NHÌN · ĐỜI SỐNG</span>
        </Link>
        <form className="site-search" onSubmit={(event) => { event.preventDefault(); document.getElementById("tin-moi")?.scrollIntoView({ behavior: "smooth" }); }}>
          <label className="sr-only" htmlFor="news-search">Tìm kiếm tin tức</label>
          <input
            id="news-search"
            placeholder="Tìm kiếm tin tức..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" aria-label="Tìm kiếm">⌕</button>
        </form>
      </header>

      <nav className="category-nav" aria-label="Chuyên mục">
        <div className="portal-width category-nav-inner">
          <Link className="home-nav" href="/" aria-label="Trang chủ">
            <span aria-hidden="true">⌂</span><span>Trang chủ</span>
          </Link>
          {primaryCategories.map((item) => (
            <Link className="nav-category" href={`/category/${item.slug}`} key={item.slug}>
              {item.name}
            </Link>
          ))}
          {moreCategories.length > 0 && (
            <details className="nav-more">
              <summary>Chuyên mục <span aria-hidden="true">⌄</span></summary>
              <div className="nav-more-menu">
                {moreCategories.map((item) => (
                  <Link href={`/category/${item.slug}`} key={item.slug}>{item.name}</Link>
                ))}
              </div>
            </details>
          )}
          <Link className="nav-admin" href="/admin">Tòa soạn <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>

      <div className="breaking-bar">
        <div className="portal-width breaking-content">
          <span className="breaking-label">TIN MỚI</span>
          <p>{featured?.title ?? "Cập nhật những thông tin mới nhất trong ngày"}</p>
          <span className="breaking-date">{formatDate(featured?.published_at ?? null)}</span>
        </div>
      </div>

      <section className="portal-width top-news" aria-labelledby="top-news-title">
        <div className="section-kicker">
          <h1 id="top-news-title"><span /> TÂM ĐIỂM HÔM NAY</h1>
          <span className="section-kicker-note">Tin nổi bật từ tòa soạn</span>
        </div>

        {error && <p className="portal-notice error">{error} Vui lòng thử lại sau ít phút.</p>}
        {isLoading && <p className="portal-notice">Đang tải tin tức mới nhất...</p>}
        {!isLoading && !error && !featured && <p className="portal-notice">Chưa có bài viết phù hợp. Hãy thử từ khóa hoặc chuyên mục khác.</p>}

        {featured && (
          <div className={`lead-layout${sideStories.length ? " lead-layout-with-left" : ""}`}>
            {sideStories.length > 0 && (
              <aside className="left-news-rail" aria-label="Tin vừa lên">
                <div className="left-rail-heading"><span>VỪA LÊN</span><span aria-hidden="true">↗</span></div>
                {sideStories.map((article) => (
                  <article className="left-rail-story" key={article.id}>
                    <Link className="left-rail-art" href={`/article/${article.slug}`} aria-label={`Đọc bài: ${article.title}`}>
                      <ArticleIllustration categorySlug={article.category_slug} />
                    </Link>
                    <Link className="rail-category" href={`/category/${article.category_slug}`}>{article.category}</Link>
                    <h3><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
                    <span className="rail-date">{formatDate(article.published_at)}</span>
                  </article>
                ))}
              </aside>
            )}
            <article className="lead-story">
              <Link className="lead-art-link" href={`/article/${featured.slug}`} aria-label={`Đọc bài: ${featured.title}`}>
                <ArticleIllustration categorySlug={featured.category_slug} />
              </Link>
              <div className="lead-copy">
                <Link className="story-category" href={`/category/${featured.category_slug}`}>{featured.category}</Link>
                <h2><Link href={`/article/${featured.slug}`}>{featured.title}</Link></h2>
                <p className="lead-excerpt">{featured.excerpt}</p>
                <div className="story-meta">
                  <span>{formatDate(featured.published_at)}</span>
                  <span className="meta-dot" />
                  <span>Ban biên tập</span>
                  <Link className="read-more" href={`/article/${featured.slug}`}>Đọc tiếp <span aria-hidden="true">→</span></Link>
                </div>
              </div>
            </article>

            <aside className="headline-rail" aria-label="Tin đáng chú ý">
              <div className="rail-heading"><h2>TIN ĐÁNG CHÚ Ý</h2><span>●</span></div>
              {headlineStories.length === 0 && (
                <p className="rail-empty">Thêm bài viết để cập nhật các tin đáng chú ý tại đây.</p>
              )}
              {headlineStories.map((article) => (
                <article className="rail-story" key={article.id}>
                  <Link className="rail-art" href={`/article/${article.slug}`} aria-label={`Đọc bài: ${article.title}`}>
                    <ArticleIllustration categorySlug={article.category_slug} />
                  </Link>
                  <div>
                    <Link className="rail-category" href={`/category/${article.category_slug}`}>{article.category}</Link>
                    <h3><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
                    <span className="rail-date">{formatDate(article.published_at)}</span>
                  </div>
                </article>
              ))}
              <div className="editor-pick">
                <span className="editor-pick-mark">“</span>
                <p>Thông tin chọn lọc, góc nhìn đa chiều và câu chuyện đáng quan tâm.</p>
                <span className="editor-pick-label">LỜI NGỎ TÒA SOẠN</span>
              </div>
            </aside>
          </div>
        )}
      </section>

      <section className="latest-section" id="tin-moi" aria-labelledby="latest-title">
        <div className="portal-width">
          <div className="latest-heading">
            <div>
              <p className="eyebrow">CẬP NHẬT LIÊN TỤC</p>
              <h2 id="latest-title">Tin mới nhất</h2>
            </div>
            <div className="latest-tools">
              <span>{filtered.length} bài viết</span>
              <label className="sr-only" htmlFor="category-filter">Lọc tin theo chuyên mục</label>
              <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="latest-layout">
            <div className="news-grid">
              {filtered.map((article) => (
                <article className="news-card" key={article.id}>
                  <Link className="news-card-art" href={`/article/${article.slug}`} aria-label={`Đọc bài: ${article.title}`}>
                    <ArticleIllustration categorySlug={article.category_slug} />
                    <span className="card-category">{article.category}</span>
                  </Link>
                  <div className="news-card-copy">
                    <p className="news-card-date">{formatDate(article.published_at)} <span>·</span> 3 phút đọc</p>
                    <h3><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
                    <p className="news-card-excerpt">{article.excerpt}</p>
                    <Link className="card-read-link" href={`/article/${article.slug}`}>Xem chi tiết <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              ))}
            </div>

            <aside className="sidebar">
              <div className="sidebar-heading"><span>GÓC TÒA SOẠN</span></div>
              <div className="sidebar-note">
                <p className="sidebar-note-label">BẢN TIN MỚI</p>
                <h3>Mỗi ngày một góc nhìn.</h3>
                <p>Cùng cập nhật những câu chuyện đáng quan tâm, gần gũi với cuộc sống.</p>
                <Link href="/admin">Gửi bài cho tòa soạn <span aria-hidden="true">↗</span></Link>
              </div>
              <div className="sidebar-topics">
                <h3>Chuyên mục</h3>
                {categoryList.map((item, index) => (
                  <Link className="sidebar-topic" href={`/category/${item.slug}`} key={item.slug}>
                    <span className="topic-number">{String(index + 1).padStart(2, "0")}</span>{item.name}<span className="topic-arrow">↗</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <footer className="portal-footer" id="gioi-thieu">
        <div className="portal-width footer-main">
          <Link className="publication-brand footer-brand" href="/">
            <span className="brand-symbol">B</span>
            <span className="brand-wordmark">BẢN TIN <strong>MỚI</strong></span>
            <span className="brand-tagline">TIN TỨC · GÓC NHÌN · ĐỜI SỐNG</span>
          </Link>
          <p>Tin tức chọn lọc, góc nhìn đa chiều và những câu chuyện quanh ta.</p>
          <Link href="/admin">Góc bạn đọc</Link>
        </div>
        <div className="portal-width footer-bottom">
          <span>© 2026 Bản Tin Mới</span>
          <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Ảnh minh họa: Unsplash</a>
        </div>
      </footer>
    </main>
  );
}
