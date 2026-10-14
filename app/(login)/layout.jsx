import "../globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Segoe UI Midlevel",
    "Noto Sans",
    "Helvetica",
    "Arial",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji"
  ],
});

export const metadata = {
  title: "NextTV - 影视无限",
  description: "请输入密码以访问 NextTV",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f9fafb",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.className} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-background-light text-gray-900 min-h-dvh flex flex-col selection:bg-primary selection:text-white">
        <main className="flex-1 flex flex-col items-center w-full px-4 md:px-8 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
