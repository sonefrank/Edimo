# Edimo Le Bayeur

Plateforme de location immobilière à Douala — Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Supabase.

## Démarrage

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **Settings > API**, copiez l'URL et la clé `anon public`, puis renseignez `.env.local` :

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_ADMIN_EMAIL=votre-email@exemple.com
   ```

3. Dans **SQL Editor**, exécutez le contenu de [`supabase/schema.sql`](./supabase/schema.sql) (remplacez d'abord `<VOTRE_EMAIL_ADMIN>` dans le fichier par l'email choisi ci-dessus). Ce script crée les tables `profiles`, `properties`, `messages`, `favorites`, `reviews`, leurs politiques RLS, et le trigger qui crée automatiquement un profil à l'inscription.
4. Installez les dépendances et lancez le serveur :

   ```bash
   npm install
   npm run dev
   ```

5. Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé vers `/signup`.

## Structure

- `app/(auth)` — inscription, connexion, vérification email (pas de navbar).
- `app/(app)` — feed, détail propriété, création d'annonce, messagerie, profil, favoris (navbar + garde d'authentification).
- `app/admin` — tableau de bord modération (réservé à `NEXT_PUBLIC_ADMIN_EMAIL`).
- `lib/` — client Supabase, types TypeScript, helpers d'authentification.
- `components/ui/` — primitives shadcn/ui (Button, Input, Card, Select, Tabs, ...).
- `supabase/schema.sql` — schéma de base de données et politiques RLS à exécuter manuellement.

## Notes

- Les images de propriétés sont pour l'instant des placeholders gris (pas d'upload en V1) — `property.images` reste un tableau vide à la création.
- Les paiements ne sont pas inclus dans cette version (prévus en V2+).
