-- EDIMO LE BAYEUR - schéma Supabase
-- À exécuter dans Supabase Dashboard > SQL Editor (une seule fois, sur un projet vierge).
-- Remplacez '<VOTRE_EMAIL_ADMIN>' ci-dessous par l'email du compte qui doit accéder à /admin.

-- ============ PROFILS ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  user_type text not null check (user_type in ('propriétaire', 'locataire')),
  verified boolean not null default false,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Crée automatiquement une ligne profiles à l'inscription (à partir des `options.data` de signUp)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'user_type', 'locataire')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Vérifie si l'utilisateur courant est l'administrateur de la plateforme
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = '<VOTRE_EMAIL_ADMIN>';
$$;

-- ============ PROPRIÉTÉS ============
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  property_type text not null default 'appartement' check (property_type in ('chambre', 'studio', 'appartement', 'villa')),
  city text not null default 'douala' check (city in ('douala', 'yaounde', 'buea', 'limbe')),
  price_fcfa integer not null check (price_fcfa >= 0),
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  area_sqm numeric not null default 0,
  location text not null,
  latitude double precision,
  longitude double precision,
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  status text not null default 'disponible' check (status in ('disponible', 'louée', 'maintenance')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  message_text text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ FAVORIS ============
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

-- ============ AVIS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewed_user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

create policy "Profils visibles par tout utilisateur connecté"
  on public.profiles for select to authenticated using (true);
create policy "Un utilisateur modifie son propre profil, l'admin modifie tout"
  on public.profiles for update to authenticated using (auth.uid() = id or public.is_admin());
create policy "Seul l'admin supprime un profil"
  on public.profiles for delete to authenticated using (public.is_admin());

create policy "Annonces approuvées visibles par tous, propriétaire et admin voient tout"
  on public.properties for select to authenticated
  using (approved = true or auth.uid() = owner_id or public.is_admin());
create policy "Un propriétaire crée ses propres annonces"
  on public.properties for insert to authenticated with check (auth.uid() = owner_id);
create policy "Le propriétaire ou l'admin modifie une annonce"
  on public.properties for update to authenticated using (auth.uid() = owner_id or public.is_admin());
create policy "Le propriétaire ou l'admin supprime une annonce"
  on public.properties for delete to authenticated using (auth.uid() = owner_id or public.is_admin());

create policy "Voir les messages échangés avec soi-même"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Envoyer un message en tant que soi-même"
  on public.messages for insert to authenticated with check (auth.uid() = sender_id);
create policy "Marquer comme lu ses propres messages reçus"
  on public.messages for update to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Gérer ses propres favoris"
  on public.favorites for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Avis visibles par tout utilisateur connecté"
  on public.reviews for select to authenticated using (true);
create policy "Déposer un avis en tant que soi-même"
  on public.reviews for insert to authenticated with check (auth.uid() = reviewer_id);
create policy "L'auteur ou l'admin supprime un avis"
  on public.reviews for delete to authenticated using (auth.uid() = reviewer_id or public.is_admin());

-- ============ TEMPS RÉEL (chat) ============
alter publication supabase_realtime add table public.messages;

-- ============ STOCKAGE (photos des annonces) ============
-- Bucket public en lecture (les photos s'affichent dans le feed sans authentification
-- côté navigateur), mais l'écriture est restreinte au propriétaire du dossier.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "Photos d'annonces visibles par tous"
  on storage.objects for select
  using (bucket_id = 'property-images');

-- Convention de chemin : {owner_id}/{property_id ou temp_id}/{fichier}
-- (storage.foldername(name))[1] correspond au premier segment du chemin, l'owner_id.
create policy "Le propriétaire ajoute ses propres photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Le propriétaire supprime ses propres photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============ TYPE DE BIEN (chambre / studio / appartement / villa) ============
-- Migration pour une base déjà créée avant l'ajout de cette colonne :
alter table public.properties
  add column if not exists property_type text not null default 'appartement'
    check (property_type in ('chambre', 'studio', 'appartement', 'villa'));

-- Migration pour une base où la colonne existait déjà avec une contrainte plus
-- restrictive (élargit pour inclure 'studio' et 'villa') :
alter table public.properties drop constraint if exists properties_property_type_check;
alter table public.properties
  add constraint properties_property_type_check
  check (property_type in ('chambre', 'studio', 'appartement', 'villa'));

-- ============ MODÉRATION DES ANNONCES (validation admin) ============
-- Migration pour une base déjà créée avant l'ajout de cette colonne :
-- toutes les annonces déjà publiées passent approved = true pour ne pas
-- disparaître du feed du jour au lendemain ; seules les nouvelles annonces
-- repartent en attente de validation.
alter table public.properties
  add column if not exists approved boolean not null default false;
update public.properties set approved = true where approved = false;

drop policy if exists "Annonces disponibles visibles par tout utilisateur connecté" on public.properties;
drop policy if exists "Annonces approuvées visibles par tous, propriétaire et admin voient tout" on public.properties;
create policy "Annonces approuvées visibles par tous, propriétaire et admin voient tout"
  on public.properties for select to authenticated
  using (approved = true or auth.uid() = owner_id or public.is_admin());

-- ============ STOCKAGE (photos de profil) ============
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars visibles par tous"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Un utilisateur gère sa propre photo de profil"
  on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ NOTIFICATIONS PUSH ============

-- Abonnements navigateur (un par appareil/navigateur sur lequel l'utilisateur a activé les notifications)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Un utilisateur gère ses propres abonnements push"
  on public.push_subscriptions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Alertes de recherche : un locataire est notifié quand une nouvelle annonce
-- approuvée correspond à ces critères. property_type / location_query nuls = tout.
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_type text check (property_type in ('chambre', 'studio', 'appartement', 'villa')),
  min_budget integer,
  max_budget integer,
  location_query text,
  created_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

create policy "Un utilisateur gère ses propres alertes"
  on public.saved_searches for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expiration des annonces : 30 jours d'activité après approbation.
-- expiry_notified évite de renvoyer la notification "bientôt expirée" en boucle.
alter table public.properties
  add column if not exists expires_at timestamptz;
alter table public.properties
  add column if not exists expiry_notified boolean not null default false;

-- ============ MULTI-VILLES ============
-- Migration pour une base déjà créée avant l'ajout de cette colonne :
-- les annonces déjà publiées passent en 'douala' par défaut.
alter table public.properties
  add column if not exists city text not null default 'douala';
alter table public.properties drop constraint if exists properties_city_check;
alter table public.properties
  add constraint properties_city_check
  check (city in ('douala', 'yaounde', 'buea', 'limbe'));

-- ============ CONTRATS (e-signature DRAFT — non légale) ============
-- locataire_id est renseigné automatiquement si l'email correspond à un compte
-- locataire existant ; sinon reste nul (le locataire signe simplement via le lien,
-- sans que son compte soit rattaché — cohérent avec la nature "brouillon" de la fonctionnalité).
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties (id) on delete set null,
  proprietaire_id uuid not null references public.profiles (id) on delete cascade,
  locataire_id uuid references public.profiles (id) on delete set null,
  locataire_name text not null,
  locataire_email text not null,
  status text not null default 'draft' check (status in ('draft', 'partially_signed', 'signed_draft')),
  contract_data jsonb not null,
  proprietaire_signature text,
  locataire_signature text,
  created_at timestamptz not null default now(),
  signed_at timestamptz
);

create index contracts_proprietaire_idx on public.contracts (proprietaire_id);
create index contracts_locataire_idx on public.contracts (locataire_id);
create index contracts_status_idx on public.contracts (status);

alter table public.contracts enable row level security;

create policy "Les deux parties (et l'admin) voient le contrat"
  on public.contracts for select to authenticated
  using (auth.uid() = proprietaire_id or auth.uid() = locataire_id or public.is_admin());

create policy "Le propriétaire crée le contrat"
  on public.contracts for insert to authenticated
  with check (auth.uid() = proprietaire_id);

create policy "Les deux parties signent (mise à jour) le contrat"
  on public.contracts for update to authenticated
  using (auth.uid() = proprietaire_id or auth.uid() = locataire_id or public.is_admin());

create policy "Le propriétaire ou l'admin supprime le contrat"
  on public.contracts for delete to authenticated
  using (auth.uid() = proprietaire_id or public.is_admin());
