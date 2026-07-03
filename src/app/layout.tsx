import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Stash — Personal Bookmark Dashboard",
    template: "%s · Stash",
  },
  description:
    "A premium personal bookmark dashboard. Organize, search, and rediscover everything you save.",
};

// Applies the persisted accent before hydration so the first paint
// already uses the user's chosen brand color (no flash of violet).
const accentScript = `try{var s=JSON.parse(localStorage.getItem("bmd-settings"));var a=s&&s.state&&s.state.accent;if(a)document.documentElement.dataset.accent=a}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
