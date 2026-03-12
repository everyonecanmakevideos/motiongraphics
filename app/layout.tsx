import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shape Motion Lab",
  description: "Generate deterministic motion graphics from text prompts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {/* Background gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-72 h-72 rounded-full bg-violet-500/8 blur-[100px]" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-indigo-600/5 blur-[140px]" />
        </div>

        {/* Nav */}
        <nav className="sticky top-0 z-50 glass gradient-border">
          <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L12.196 4.5V11.5L7 15L1.804 11.5V4.5L7 1Z" fill="white" fillOpacity="0.9" />
                </svg>
              </div>
              <span className="font-bold text-white tracking-tight text-[15px]">Shape Motion Lab</span>
            </div>
            <span className="text-[10px] text-indigo-300/70 px-2 py-0.5 rounded-full border border-indigo-400/20 bg-indigo-500/10">
              beta
            </span>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
