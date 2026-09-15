import type { Metadata, Viewport } from "next";
import { Russo_One, Rajdhani } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const russoOne = Russo_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-body",
  weight: ["500", "600", "700"],
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
  themeColor: "#150826",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${russoOne.variable} ${rajdhani.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
