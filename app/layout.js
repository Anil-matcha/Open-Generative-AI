import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Replicate Video Studio",
  description: "Dark desktop-first image-to-video workspace for Replicate models.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
