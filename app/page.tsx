"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published_at: string | null;
};

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState("Tất cả");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/articles")
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được danh sách bài viết.");
        return (await response.json()) as Article[];
      })
      .then(setArticles)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Có lỗi xảy ra."));
  }, []);

  const categories = ["Tất cả", ...new Set(articles.map((article) => article.category))];
  const filtered = category === "Tất cả" ? articles : articles.filter((article) => article.category === category);

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/">BẢN TIN MỚI<span>.</span></Link>
        <nav aria-label="Điều hướng chính">
          <a href="#tin-moi">Tin mới</a>
          <a href="#gioi-thieu">Giới thiệu</a>
          <Link href="/admin">Quản trị</Link>
        </nav>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">CẬP NHẬT MỖI NGÀY</p>
          <h1>Thông tin đáng tin cậy.<br /><em>Góc nhìn đa chiều.</em></h1>
          <p>Theo dõi những câu chuyện và xu hướng đang định hình cuộc sống quanh ta.</p>
          <a className="button-link" href="#tin-moi">Khám phá tin mới <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-mark">B</div><span className="art-caption">NEWS / 2026</span></div>
      </section>
      <section className="news-section" id="tin-moi">
        <div className="section-heading">
          <div><p className="eyebrow">ĐỌC VÀ KHÁM PHÁ</p><h2>Tin tức mới nhất</h2></div>
          <div className="filters" aria-label="Lọc theo danh mục">
            {categories.map((item) => <button className={category === item ? "filter active" : "filter"} key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </div>
        {error ? <p className="notice error">{error} Hãy kiểm tra Docker Compose và kết nối MySQL.</p> : null}
        {!error && articles.length === 0 ? <p className="notice">Đang tải bài viết hoặc chưa có bài nào được đăng.</p> : null}
        <div className="article-grid">
          {filtered.map((article, index) => (
            <article className={`article-card card-${index % 3}`} key={article.id}>
              <div className="card-image"><span>{article.category}</span><strong>{String(index + 1).padStart(2, "0")}</strong></div>
              <div className="card-content">
                <p className="article-date">{article.published_at ? new Date(article.published_at).toLocaleDateString("vi-VN") : "Bài viết mới"}</p>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <Link href={`/article/${article.slug}`}>Đọc bài <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer id="gioi-thieu"><Link className="brand" href="/">BẢN TIN MỚI<span>.</span></Link><p>Đồ án cổng thông tin · Được vận hành bởi Next.js và MySQL</p><p>© 2026 Bản Tin Mới</p></footer>
    </main>
  );
}
