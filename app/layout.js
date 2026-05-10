import './globals.css';
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Open Generative AI｜中文创作工作台',
  description: '面向中文影视创作者的 AI 图像、视频与口型同步创作工作台。支持多模型生成、工作流和本地模型。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
