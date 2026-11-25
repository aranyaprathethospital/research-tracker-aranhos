import localFont from "next/font/local";

export const sarabun = localFont({
  src: [
    { path: "./fonts/THSarabun-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/THSarabun-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-th-sarabun",
  display: "swap",
  adjustFontFallback: false,
});
