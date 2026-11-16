import { Geist, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";

export const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

// Geist has no CJK glyphs; keep Chinese body text consistent across platforms.
export const notoSansSC = Noto_Sans_SC({
  display: "swap",
  variable: "--font-noto-sans-sc",
  preload: false,
});

export const notoSerifSC = Noto_Serif_SC({
  display: "swap",
  variable: "--font-noto-serif-sc",
  preload: false,
});
