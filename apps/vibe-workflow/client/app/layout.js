import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vibe Workflow — Open-Source Alternative to Weavy AI, Krea Nodes, Freepik Spaces & FloraFauna AI",
  description:
    "Vibe Workflow is a free, open-source, self-hostable node-based AI workflow builder. The best open-source alternative to Weavy AI, Krea Nodes, Freepik Spaces, and FloraFauna AI. Build generative AI pipelines with a visual node editor — no subscription required.",
  keywords: [
    "weavy ai alternative",
    "krea nodes alternative",
    "krea workflows alternative",
    "freepik spaces alternative",
    "florafauna ai alternative",
    "open source ai workflow builder",
    "node based ai editor",
    "generative ai pipeline",
    "visual ai workflow",
    "self hosted ai",
    "comfyui alternative",
    "ai image generation workflow",
    "ai video generation pipeline",
    "no code ai workflow",
    "artistic intelligence",
    "open source generative ai",
    "ai workflow automation",
    "vibe workflow",
  ],
  openGraph: {
    title: "Vibe Workflow — Open-Source Alternative to Weavy AI, Krea Nodes, Freepik Spaces & FloraFauna AI",
    description:
      "Free, self-hostable, node-based AI workflow builder. The open-source alternative to Weavy AI, Krea Nodes, Freepik Spaces, and FloraFauna AI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Workflow — Open-Source Alternative to Weavy AI, Krea Nodes & FloraFauna AI",
    description:
      "Free, self-hostable, node-based AI workflow builder. The open-source alternative to Weavy AI, Krea Nodes, Freepik Spaces, and FloraFauna AI.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
