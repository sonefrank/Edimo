export type CityId = 'douala' | 'yaounde' | 'buea' | 'limbe'

export interface City {
  id: CityId
  label: string
  /** true = annonces publiables et visibles ; false = ville affichée mais "bientôt disponible" */
  active: boolean
  /** [lat, lng] pour centrer la carte sur cette ville */
  center: [number, number]
}

// Source unique de vérité pour les villes couvertes par Edimo.
// Pour ouvrir une nouvelle ville : ajouter une entrée ici avec active: true.
// Rien d'autre à modifier — filtres, formulaire de création et carte s'adaptent automatiquement.
export const CITIES: City[] = [
  { id: 'douala', label: 'Douala', active: true, center: [4.0483, 9.7043] },
  { id: 'yaounde', label: 'Yaoundé', active: true, center: [3.848, 11.5021] },
  { id: 'buea', label: 'Buea', active: false, center: [4.156, 9.292] },
  { id: 'limbe', label: 'Limbe', active: false, center: [4.0225, 9.213] },
]

export function getCity(id: string | null | undefined): City | undefined {
  return CITIES.find((c) => c.id === id)
}

export const ACTIVE_CITIES = CITIES.filter((c) => c.active)
