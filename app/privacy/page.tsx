import Link from 'next/link'
import { Home } from 'lucide-react'

export const metadata = {
  title: 'Confidentialité - Edimo Le Bayeur',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
          <Home className="size-5 text-[#D4AF37]" />
          EDIMO
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h1 className="mb-1 text-2xl font-bold text-[#1a1a1a]">Politique de confidentialité</h1>
          <p className="mb-6 text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

          <div className="flex flex-col gap-5 text-sm text-muted-foreground">
            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">1. Données collectées</h2>
              <p>
                Pour créer et faire fonctionner votre compte, Edimo collecte : nom complet,
                email, numéro de téléphone, type de compte (propriétaire ou locataire), et,
                selon votre usage, les annonces publiées, photos, messages échangés, avis
                déposés, favoris et position géographique que vous choisissez de partager (pour
                situer une annonce ou calculer un itinéraire).
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">2. Utilisation des données</h2>
              <p>
                Ces données servent uniquement au fonctionnement de la plateforme : afficher les
                annonces, permettre la messagerie entre utilisateurs, calculer un itinéraire,
                modérer le contenu et vous contacter au sujet de votre compte. Edimo ne vend
                aucune donnée personnelle à des tiers.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">3. Visibilité des informations</h2>
              <p>
                Votre nom, votre statut de vérification et les annonces que vous publiez sont
                visibles par les autres utilisateurs connectés. Votre email et votre téléphone
                ne sont partagés qu&apos;avec les personnes avec qui vous échangez via la
                messagerie, jamais publiés publiquement sur une annonce.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">4. Géolocalisation</h2>
              <p>
                La position exacte d&apos;une propriété est renseignée volontairement par le
                propriétaire. La position d&apos;un visiteur n&apos;est utilisée que
                ponctuellement, avec son accord explicite via l&apos;autorisation du navigateur,
                pour calculer un itinéraire ; elle n&apos;est pas conservée après le calcul.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">5. Conservation et suppression</h2>
              <p>
                Vos données sont conservées tant que votre compte est actif. Vous pouvez
                demander la suppression de votre compte et des données associées en contactant
                l&apos;administration de la plateforme.
              </p>
            </section>

            <section>
              <h2 className="mb-1.5 font-semibold text-foreground">6. Sécurité</h2>
              <p>
                L&apos;authentification et le stockage des données sont gérés par Supabase, avec
                un accès restreint par des règles de sécurité au niveau de la base de données
                (chacun n&apos;accède qu&apos;aux données qui le concernent).
              </p>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Voir aussi nos{' '}
          <Link href="/terms" className="font-medium text-[#D4AF37] hover:underline">
            conditions d&apos;utilisation
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
