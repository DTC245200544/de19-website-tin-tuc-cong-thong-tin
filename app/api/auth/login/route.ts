import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, isValidAdminPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Thông tin đăng nhập không hợp lệ." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!expectedEmail || email !== expectedEmail || !isValidAdminPassword(password)) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const isHttps = forwardedProto ? forwardedProto === "https" : request.nextUrl.protocol === "https:";
  await createAdminSession(isHttps);
  return NextResponse.json({ authenticated: true });
}
