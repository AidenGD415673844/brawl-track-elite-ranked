import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.24.2'

const BodySchema = z.object({
  playerTag: z.string().trim().min(2).max(20).regex(/^#?[A-Z0-9]+$/i),
})

function parseKeyList(value: string | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string')
  } catch {
    // Some environments expose this as a comma-separated string instead of JSON.
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function hasAppKey(req: Request) {
  const apiKey = req.headers.get('apikey') || req.headers.get('x-supabase-api-key') || ''
  const authHeader = req.headers.get('Authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''

  const configuredKeys = [
    Deno.env.get('SUPABASE_ANON_KEY'),
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY'),
    ...parseKeyList(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')),
  ].filter(Boolean) as string[]

  if (configuredKeys.length > 0) {
    return [apiKey, bearer].some((incomingKey) => configuredKeys.includes(incomingKey))
  }

  // Last-resort compatibility for managed builds where only an injected public
  // app key is available to the function runtime. The browser client always sends
  // `apikey`; callers with no app key are still rejected.
  return apiKey.length > 20 || bearer.length > 20
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This app has no login flow, so protect the proxy with the app's public key
    // from `apikey` instead of requiring a user JWT on `Authorization`.
    if (!hasAppKey(req)) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => null)
    if (body?.healthCheck === true) {
      return json({ ok: true })
    }

    const apiKey = Deno.env.get('BRAWL_STARS_API_KEY')
    if (!apiKey) {
      return json({ error: 'Server not configured.' }, 500)
    }

    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return json({ error: 'Invalid player tag.' })
    }

    const tag = parsed.data.playerTag.startsWith('#')
      ? parsed.data.playerTag
      : '#' + parsed.data.playerTag
    const encodedTag = encodeURIComponent(tag.toUpperCase())

    const res = await fetch(
      `https://api.brawlstars.com/v1/players/${encodedTag}/battlelog`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    )

    if (!res.ok) {
      let msg = `API error (${res.status}).`
      if (res.status === 403) msg = 'Server API key invalid or access denied.'
      if (res.status === 404) msg = 'Player not found. Check your player tag.'
      return json({ error: msg })
    }

    const data = await res.json()
    return json(data)
  } catch (err) {
    return json({ error: 'Failed to fetch battles.' }, 500)
  }
})
