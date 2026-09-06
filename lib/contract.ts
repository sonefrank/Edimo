import { supabase } from './supabase'
import { Contract, ContractData, ContractStatus } from './types'

export async function createContract(input: {
  propertyId: string | null
  proprietaireId: string
  locataireName: string
  locataireEmail: string
  contractData: ContractData
}): Promise<{ contract: Contract | null; error: string | null }> {
  // Si l'email correspond à un compte locataire existant, on le rattache
  // automatiquement (utile pour "Mes contrats" côté locataire).
  const { data: matchedProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_type', 'locataire')
    .ilike('email', input.locataireEmail)
    .maybeSingle()

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      property_id: input.propertyId,
      proprietaire_id: input.proprietaireId,
      locataire_id: matchedProfile?.id ?? null,
      locataire_name: input.locataireName,
      locataire_email: input.locataireEmail,
      contract_data: input.contractData,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error || !data) return { contract: null, error: error?.message ?? 'insert_failed' }
  return { contract: data as Contract, error: null }
}

export async function getContract(
  contractId: string
): Promise<{ data: Contract | null; error: string | null }> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'not_found' }
  return { data: data as Contract, error: null }
}

export async function getUserContracts(userId: string): Promise<Contract[]> {
  const { data } = await supabase
    .from('contracts')
    .select('*')
    .or(`proprietaire_id.eq.${userId},locataire_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  return (data as Contract[]) ?? []
}

export async function signContract(
  contractId: string,
  role: 'proprietaire' | 'locataire',
  signatureImage: string
): Promise<{ data: Contract | null; error: string | null }> {
  const { data: existing, error: fetchError } = await supabase
    .from('contracts')
    .select('proprietaire_signature, locataire_signature')
    .eq('id', contractId)
    .single()

  if (fetchError || !existing) return { data: null, error: fetchError?.message ?? 'not_found' }

  const proprietaire_signature =
    role === 'proprietaire' ? signatureImage : existing.proprietaire_signature
  const locataire_signature = role === 'locataire' ? signatureImage : existing.locataire_signature
  const bothSigned = Boolean(proprietaire_signature && locataire_signature)
  const status: ContractStatus = bothSigned ? 'signed_draft' : 'partially_signed'

  const { data, error } = await supabase
    .from('contracts')
    .update({
      proprietaire_signature,
      locataire_signature,
      status,
      signed_at: bothSigned ? new Date().toISOString() : null,
    })
    .eq('id', contractId)
    .select('*')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'update_failed' }
  return { data: data as Contract, error: null }
}

export async function deleteContract(contractId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('contracts').delete().eq('id', contractId)
  return { error: error?.message ?? null }
}
