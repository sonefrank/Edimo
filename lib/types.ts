export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  user_type: 'propriétaire' | 'locataire'
  verified: boolean
  bio?: string
  avatar_url?: string
  created_at: string
}

export type PropertyType = 'chambre' | 'studio' | 'appartement' | 'villa'

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  chambre: 'Chambre',
  studio: 'Studio',
  appartement: 'Appartement',
  villa: 'Villa',
}

export interface Property {
  id: string
  owner_id: string
  title: string
  description: string
  property_type: PropertyType
  city: string
  price_fcfa: number
  bedrooms: number
  bathrooms: number
  area_sqm: number
  location: string
  latitude?: number
  longitude?: number
  amenities: string[]
  images: string[]
  status: 'disponible' | 'louée' | 'maintenance'
  approved: boolean
  expires_at?: string
  expiry_notified: boolean
  created_at: string
}

export interface SavedSearch {
  id: string
  user_id: string
  property_type: PropertyType | null
  min_budget: number | null
  max_budget: number | null
  location_query: string | null
  created_at: string
}

export interface PropertyWithOwner extends Property {
  owner: { verified: boolean } | null
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  property_id?: string
  message_text: string
  read: boolean
  created_at: string
}

export interface Review {
  id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  comment: string
  created_at: string
}

export interface ReviewWithReviewer extends Review {
  reviewer: { full_name: string } | null
}

export interface Conversation {
  participant_id: string
  participant_name: string
  property_id?: string
  property_title?: string
  last_message: string
  last_message_at: string
  unread_count: number
}
