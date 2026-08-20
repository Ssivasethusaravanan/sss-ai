import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: "NVIDIA AI Chat — Test NIM Models",
  description: "A developer-focused AI chatbot for testing NVIDIA NIM models. Supports Llama, Nemotron, Mixtral, DeepSeek, and more with real-time streaming.",
  keywords: ["NVIDIA", "NIM", "AI", "Chat", "Llama", "DeepSeek", "Nemotron", "LLM"],
  openGraph: {
    title: "NVIDIA AI Chat — Test NIM Models",
    description: "Real-time AI chatbot for testing NVIDIA NIM models.",
    type: "website",
    siteName: "NVIDIA AI Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "NVIDIA AI Chat — Test NIM Models",
    description: "Real-time AI chatbot for testing NVIDIA NIM models.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-neutral-950 text-neutral-50`}>
        {children}
      </body>
    </html>
  );
}
