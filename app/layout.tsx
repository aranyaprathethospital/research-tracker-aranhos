import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Research Tracker | ติดตามความก้าวหน้างานวิจัย",
  description: "ระบบติดตามความก้าวหน้า กำหนดส่ง และความเห็นที่ปรึกษางานวิจัย",
  icons: {
    icon: [
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${geist.variable} font-sans`}>
      <body className="min-h-[100svh] bg-[#f6f7fb] text-[#282239] antialiased">
        <Toaster position="bottom-right" theme="light" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
