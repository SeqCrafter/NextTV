import "../globals.css";
import { Suspense } from "react";
import { geist, notoSansSC, notoSerifSC } from "@/app/fonts";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata = {
  title: "NextTV - 影视无限",
  description: "NextTV 影视播放平台",
};

// viewportFit: cover 让页面延伸到刘海/底部手势条区域，配合 env(safe-area-inset-*) 留白
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f4f0",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-CN"
      className={`${geist.variable} ${notoSansSC.variable} ${notoSerifSC.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-background-light text-ink min-h-dvh flex flex-col pb-mobile-nav selection:bg-primary selection:text-ink">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-surface-light focus:px-4 focus:py-3 focus:shadow-card">
          跳到主要内容
        </a>
        <MotionProvider>
          <Suspense fallback={<div className="h-16 shrink-0" />}>
            <Navbar />
          </Suspense>
          <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center w-full px-4 sm:px-6 xl:px-8 pb-10 outline-none">
            {children}
          </main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
