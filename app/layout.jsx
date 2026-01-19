import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NextTV - 影视无限",
  description: "NextTV 影视播放平台",
  other: {
    "preconnect-googleapis": "https://fonts.googleapis.com",
    "preconnect-gstatic": "https://fonts.gstatic.com",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background-light text-gray-900 min-h-screen flex flex-col selection:bg-primary selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center w-full px-4 md:px-8 pb-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
