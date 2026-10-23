import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { isAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type ArticleRow = RowDataPacket & {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  published_at: Date | null;
  status: string;
};

function createSlug(title: string): string {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return normalized.replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
}

export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get("all") === "1";
  if (showAll && !(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const statusFilter = showAll ? "" : "WHERE a.status = 'published'";
  const [rows] = await getDb().query<ArticleRow[]>(
    `SELECT a.id, a.title, a.slug, a.content, a.status, a.published_at, c.name AS category FROM articles a JOIN categories c ON c.id = a.category_id ${statusFilter} ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT 50`,
  );
  return NextResponse.json(rows.map((article) => ({
    ...article,
    excerpt: article.content.replace(/\s+/g, " ").slice(0, 150),
  })));
}

export async function POST(request: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body: unknown = await request.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const content = typeof data.content === "string" ? data.content.trim() : "";
  const categoryId = Number(data.categoryId);
  const status = data.status === "published" ? "published" : "draft";
  if (title.length < 5 || title.length > 180 || content.length < 20 || content.length > 30000 || !Number.isInteger(categoryId)) {
    return NextResponse.json({ error: "Tiêu đề, nội dung hoặc danh mục chưa hợp lệ." }, { status: 400 });
  }
  const db = getDb();
  const [categories] = await db.execute("SELECT id FROM categories WHERE id = ? LIMIT 1", [categoryId]);
  if ((categories as unknown[]).length === 0) return NextResponse.json({ error: "Danh mục không tồn tại." }, { status: 400 });

  const baseSlug = createSlug(title);
  if (!baseSlug) return NextResponse.json({ error: "Tiêu đề không thể tạo đường dẫn hợp lệ." }, { status: 400 });
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const [result] = await db.execute(
    "INSERT INTO articles (title, slug, content, status, category_id, published_at) VALUES (?, ?, ?, ?, ?, ?)",
    [title, slug, content, status, categoryId, status === "published" ? new Date() : null],
  );
  return NextResponse.json({ id: (result as { insertId: number }).insertId, slug }, { status: 201 });
}
