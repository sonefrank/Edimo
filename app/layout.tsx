import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Edimo Le Bayeur",
  description:
    "Edimo Le Bayeur - Plateforme de location immobilière à Douala. Trouvez ou publiez une propriété en toute simplicité.",
  appleWebApp: {
    capable: true,
    title: "Edimo",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
