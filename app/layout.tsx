import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NVIDIA AI Chat — Test NIM Models",
  description: "A developer-focused AI chatbot for testing NVIDIA NIM models. Supports Llama, Nemotron, Mixtral, DeepSeek, and more with real-time streaming.",
  keywords: ["NVIDIA", "NIM", "AI", "Chat", "Llama", "DeepSeek", "Nemotron", "LLM"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-neutral-950 text-neutral-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
