import { LanguageToggle } from '@/components/LanguageToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] px-4 py-10">
      <LanguageToggle className="absolute top-4 right-4" />
      {/* logo-full.svg, adapté en clair-sur-sombre : le fond de cet écran est noir,
          donc la maison + "EDIMO" (noirs dans le fichier source) passent en ivoire
          pour rester lisibles ; la porte et "LE BAYEUR" gardent le gold d'origine. */}
      <svg width="170" height="140" viewBox="0 0 400 330" role="img" aria-label="Edimo Le Bayeur" className="mb-6">
        <g transform="translate(100,20)">
          <path d="M100,30 L165,85 L165,175 L35,175 L35,85 Z" fill="#F5F1E8" />
          <path d="M80,175 L80,140 A20,20 0 0 1 120,140 L120,175 Z" fill="#D4AF37" />
        </g>
        <text
          x="200"
          y="270"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="56"
          letterSpacing="3"
          fill="#F5F1E8"
        >
          EDIMO
        </text>
        <text
          x="200"
          y="305"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="600"
          fontSize="26"
          letterSpacing="6"
          fill="#D4AF37"
        >
          LE BAYEUR
        </text>
      </svg>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg sm:p-8">{children}</div>
    </div>
  )
}
