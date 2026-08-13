import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { isDevRuntime } from '@/lib/env'

export type CheckoutStartResult =
  | { clientSecret: string; url?: undefined }
  | { url: string; clientSecret?: undefined }

type CheckoutApiResponse = {
  clientSecret?: string
  url?: string
  error?: string
}

export type CheckoutRegistrationFields = {
  firstName: string
  lastName: string
  dateOfBirth: string
  city: string
  country: string
  phone: string
  email: string
}

async function readFunctionError(err: unknown): Promise<string | null> {
  if (err instanceof FunctionsHttpError) {
    try {
      const body = (await err.context.json()) as { error?: string }
      if (typeof body?.error === 'string') return body.error
    } catch {
      // fall through
    }
    return 'Could not start checkout. Please try again.'
  }
  if (err instanceof FunctionsRelayError || err instanceof FunctionsFetchError) {
    return 'Payments aren\'t set up yet — the checkout service isn\'t reachable. Please try again shortly or contact support.'
  }
  return err instanceof Error ? err.message : null
}

async function invokeCreateCheckout(
  body: CheckoutRegistrationFields & { uiMode: 'embedded' | 'hosted'; siteUrl: string },
): Promise<CheckoutApiResponse> {
  const { data, error } = await supabase.functions.invoke<CheckoutApiResponse>('create-checkout-session', {
    body,
  })
  if (error) {
    const message = await readFunctionError(error)
    throw new Error(message ?? 'Could not start checkout. Please try again.')
  }
  return data ?? {}
}

async function createViaLocalDevApi(
  body: CheckoutRegistrationFields & { uiMode: 'embedded' | 'hosted'; siteUrl: string },
): Promise<CheckoutApiResponse | null> {
  if (!isDevRuntime) return null
  try {
    const localRes = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const contentType = localRes.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return null
    const localData = (await localRes.json()) as CheckoutApiResponse
    if (!localRes.ok) {
      if (localRes.status === 404) return null
      throw new Error(localData.error ?? 'Could not start checkout.')
    }
    return localData
  } catch (err) {
    if (err instanceof Error && !/Failed to fetch|NetworkError|fetch|JSON/i.test(err.message)) {
      throw err
    }
    return null
  }
}

function toResult(data: CheckoutApiResponse): CheckoutStartResult | null {
  if (data.clientSecret) return { clientSecret: data.clientSecret }
  if (data.url) return { url: data.url }
  return null
}

/**
 * Starts Stripe Checkout the same way in local Vite and on Vercel/production:
 * - Dev: optional local Vite plugin, then Edge Function
 * - Prod: Edge Function only
 * - Dev: embedded Checkout on-site, then hosted URL
 * - Prod: hosted Stripe Checkout page first (full payment page), then embedded
 */
export async function startRegistrationCheckout(
  fields: CheckoutRegistrationFields,
): Promise<CheckoutStartResult> {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : ''
  const base = { ...fields, siteUrl }

  const tryMode = async (uiMode: 'embedded' | 'hosted'): Promise<CheckoutStartResult | null> => {
    const payload = { ...base, uiMode }
    const local = await createViaLocalDevApi(payload)
    if (local) {
      const fromLocal = toResult(local)
      if (fromLocal) return fromLocal
      if (local.error) throw new Error(local.error)
    }
    const remote = await invokeCreateCheckout(payload)
    const fromRemote = toResult(remote)
    if (fromRemote) return fromRemote
    if (remote.error) throw new Error(remote.error)
    return null
  }

  const preferHosted = !isDevRuntime

  if (!preferHosted) {
    try {
      const embedded = await tryMode('embedded')
      if (embedded) return embedded
    } catch (err) {
      // Embedded can fail on unregistered domains / API mode — try hosted next.
      const message = err instanceof Error ? err.message : ''
      if (!/embedded|ui_mode|domain|client.?secret|not enabled/i.test(message) && message) {
        if (/not configured|secret key|503|401|403|Invalid registration/i.test(message)) {
          throw err
        }
      }
    }
  }

  const hosted = await tryMode('hosted')
  if (hosted) return hosted

  if (preferHosted) {
    const embedded = await tryMode('embedded')
    if (embedded) return embedded
  }

  throw new Error('Could not start checkout. Please try again.')
}
