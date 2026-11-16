import "../globals.css";
import { geist, notoSansSC, notoSerifSC } from "@/app/fonts";

export const metadata = {
  title: "NextTV - 影视无限",
  description: "请输入密码以访问 NextTV",
};

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
      <body className="bg-background-light text-ink min-h-dvh flex flex-col selection:bg-primary selection:text-ink">
        <main className="flex-1 flex flex-col items-center w-full px-4 md:px-8 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
