import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
  description: "NextTV 影视播放平台",
};

// viewportFit: cover 让页面延伸到刘海/底部手势条区域，配合 env(safe-area-inset-*) 留白
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
      <body className="bg-background-light text-gray-900 min-h-dvh flex flex-col pb-mobile-nav selection:bg-primary selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center w-full px-4 md:px-8 pb-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
