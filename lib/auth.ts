import { supabase } from './supabase'

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  userType: 'propriétaire' | 'locataire'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        user_type: userType,
      },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function resendVerificationEmail(email: string) {
  return await supabase.auth.resend({ type: 'signup', email })
}

export async function sendPasswordResetEmail(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function updatePassword(password: string) {
  return await supabase.auth.updateUser({ password })
}
