import Link from 'next/link'
import { Home } from 'lucide-react'

export const metadata = {
  title: "Conditions d'utilisation - Edimo Le Bayeur",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
          <Home className="size-5 text-[#D4AF37]" />
          EDIMO
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">Conditions d&apos;utilisation</h1>
          <p className="mb-6 text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <div className="flex flex-col gap-5 text-sm text-muted-foreground">
            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">1. Le rôle d&apos;Edimo</h2>
              <p>
                Edimo Le Bayeur est une plateforme de mise en relation entre propriétaires et
                locataires à Douala. Edimo ne loue, ne gère et ne détient aucun bien présenté sur
                la plateforme. Edimo n&apos;est ni agence immobilière, ni partie à un contrat de
                bail conclu entre un propriétaire et un locataire.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">2. Responsabilité des utilisateurs</h2>
              <p>
                Chaque propriétaire est seul responsable de l&apos;exactitude des informations
                publiées (description, prix, photos, disponibilité) et doit être en droit de
                louer le bien annoncé. Chaque locataire est responsable de vérifier
                l&apos;identité du propriétaire, de visiter le bien avant tout engagement et de
                signer un bail conforme à la législation camerounaise avant tout versement
                d&apos;argent.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">3. Limitation de responsabilité</h2>
              <p>
                Edimo décline toute responsabilité concernant les transactions, paiements,
                accords verbaux ou différends survenant entre propriétaires et locataires. La
                vérification d&apos;un compte ou la validation d&apos;une annonce par Edimo ne
                constitue pas une garantie sur la véracité des informations fournies ni sur la
                bonne exécution du bail.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">4. Modération des annonces</h2>
              <p>
                Toute annonce publiée est soumise à validation avant d&apos;être visible
                publiquement. Edimo se réserve le droit de refuser, suspendre ou supprimer tout
                compte ou toute annonce ne respectant pas ces conditions, contenant des
                informations trompeuses, ou signalée comme frauduleuse.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">5. Contenu publié</h2>
              <p>
                En publiant une annonce, un avis ou un message, vous garantissez détenir les
                droits sur les photos et textes publiés et vous engagez à ne pas publier de
                contenu illégal, injurieux ou trompeur.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">6. Modification des conditions</h2>
              <p>
                Ces conditions peuvent être mises à jour périodiquement. La poursuite de
                l&apos;utilisation de la plateforme après modification vaut acceptation des
                nouvelles conditions.
              </p>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Voir aussi notre{' '}
          <Link href="/privacy" className="font-medium text-[#D4AF37] hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
