import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Indie_Flower, Permanent_Marker, Caveat } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/context/Web3Provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalSound from "@/components/GlobalSound";
import AppShell from "@/components/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const indieFlower = Indie_Flower({
  weight: "400",
  variable: "--font-sketch",
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-marker",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arc One - Sketch & Launch Meme Coins",
  description: "The premier sketchbook-styled dashboard for launching and trading meme coins on Arc Testnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${indieFlower.variable} ${permanentMarker.variable} ${caveat.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="antialiased selection:bg-[#adc6ff]/30 selection:text-[#ece1d5]">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Web3Provider>
            <GlobalSound />
            <AppShell>{children}</AppShell>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
