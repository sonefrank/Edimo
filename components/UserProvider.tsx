'use client'

import { createContext, useContext, ReactNode } from 'react'

export interface CurrentUser {
  id: string
  fullName: string
  userType: 'propriétaire' | 'locataire'
  verified: boolean
}

const UserContext = createContext<CurrentUser | null>(null)

export function UserProvider({
  value,
  children,
}: {
  value: CurrentUser
  children: ReactNode
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useCurrentUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useCurrentUser doit être utilisé à l’intérieur de <UserProvider>.')
  }
  return context
}
