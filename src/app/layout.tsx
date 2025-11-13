// app/layout.tsx (Server Component)
import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "../styles/globals.css";
import "../styles/profile.css";
import LayoutClient from "./layout-client";

const prompt = Prompt({
  weight: "400",
  subsets: ["latin"],
});

// ✅ metadata: สำหรับ title, description, etc.
export const metadata: Metadata = {
  title: "The Paseo : Reward Membership App",
  description: "สะสมแต้มและแลกของรางวัลกับเรา",
};

// ✅ viewport: สำหรับ themeColor, viewport settings
export const viewport: Viewport = {
  themeColor: "#9DC93C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="scroll-smooth">
      <body
        className={`${prompt.className} antialiased bg-fixed bg-gradient-to-t from-paseo to-gray-200 text-gray-900 h-full`}
      >
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
