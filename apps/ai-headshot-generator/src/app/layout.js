import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/saas/Navbar";

const font = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "AI Headshot Generator - Premium Portraits",
  description: "Professional AI headshots for LinkedIn, teams, and creators.",
};

export default function RootLayout({ children }) {
  const theme = process.env.NEXT_PUBLIC_THEME || 'indigo';

  return (
    <html lang="en" className="h-dvh w-full transition-colors duration-500" data-theme={theme} style={{ colorScheme: 'light' }}>
      <body className={`${font.className} h-dvh w-full flex flex-col antialiased transition-colors duration-500`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
