"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Category = { id: number; name: string };
type Article = { id: number; title: string; status: string; category: string };

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAdminData() {
    const [categoryResponse, articleResponse] = await Promise.all([fetch("/api/categories"), fetch("/api/articles?all=1")]);
    if (!categoryResponse.ok || !articleResponse.ok) throw new Error("Không tải được dữ liệu quản trị.");
    setCategories(await categoryResponse.json() as Category[]);
    setArticles(await articleResponse.json() as Article[]);
  }

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then(async (data: { authenticated: boolean }) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) await loadAdminData();
      })
      .catch(() => setMessage("Không thể kết nối dịch vụ."))
      .finally(() => setLoading(false));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setMessage("Email hoặc mật khẩu không đúng.");
      return;
    }
    setAuthenticated(true);
    setPassword("");
    await loadAdminData();
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        categoryId: Number(form.get("categoryId")),
        content: form.get("content"),
        status: form.get("status"),
      }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Không đăng được bài viết.");
      return;
    }
    formElement.reset();
    setMessage("Đã lưu bài viết.");
    await loadAdminData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setArticles([]);
  }

  if (loading) return <main className="admin-shell"><p>Đang tải...</p></main>;
  if (!authenticated) {
    return <main className="admin-shell">
      <Link className="brand" href="/">BẢN TIN MỚI<span>.</span></Link>
      <section className="admin-card login-card"><p className="eyebrow">KHU VỰC BIÊN TẬP</p><h1>Đăng nhập quản trị</h1><p>Đăng nhập để tạo và xuất bản bài viết.</p>
        <form onSubmit={login}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Mật khẩu<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button">Đăng nhập</button></form>
        {message && <p className="notice error">{message}</p>}
        <Link className="back-link" href="/">← Về trang chủ</Link>
      </section>
    </main>;
  }

  return <main className="admin-shell">
    <header className="admin-top"><Link className="brand" href="/">BẢN TIN MỚI<span>.</span></Link><button className="text-button" onClick={logout}>Đăng xuất</button></header>
    <section className="admin-workspace"><p className="eyebrow">BẢNG ĐIỀU KHIỂN</p><h1>Quản lý bài viết</h1>{message && <p className="notice">{message}</p>}
      <div className="admin-columns">
        <form className="admin-card editor-form" onSubmit={publish}><h2>Viết bài mới</h2>
          <label>Tiêu đề<input name="title" maxLength={180} required /></label>
          <label>Danh mục<select name="categoryId" required>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Nội dung<textarea name="content" rows={12} minLength={20} required /></label>
          <label>Trạng thái<select name="status"><option value="draft">Bản nháp</option><option value="published">Xuất bản ngay</option></select></label>
          <button className="primary-button">Lưu bài viết</button>
        </form>
        <section className="admin-card"><h2>Bài viết gần đây</h2>{articles.map((article) => <div className="admin-article" key={article.id}><strong>{article.title}</strong><span>{article.category} · {article.status === "published" ? "Đã đăng" : "Bản nháp"}</span></div>)}</section>
      </div>
    </section>
  </main>;
}
