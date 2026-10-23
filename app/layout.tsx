import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bản Tin Mới | Cổng thông tin",
  description: "Cổng thông tin tổng hợp tin tức và bài viết mới nhất.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
