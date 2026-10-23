import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bản Tin Mới | Tin tức mỗi ngày",
  description: "Tin mới, góc nhìn đa chiều và những câu chuyện quanh ta.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
