import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.24.2'

const BodySchema = z.object({
  roomName: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_\-]+$/),
  identity: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_\-]+$/),
})

function b64urlFromBytes(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlFromString(str: string): string {
  return b64urlFromBytes(new TextEncoder().encode(str))
}

async function signJwt(apiKey: string, apiSecret: string, roomName: string, identity: string) {
  const header = { typ: 'JWT', alg: 'HS256' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: apiKey,
    sub: identity,
    iat: now,
    exp: now + 3600,
    nbf: now,
    video: { roomJoin: true, room: roomName },
  }
  const data = `${b64urlFromString(JSON.stringify(header))}.${b64urlFromString(JSON.stringify(payload))}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return `${data}.${b64urlFromBytes(new Uint8Array(sig))}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')
    const url = Deno.env.get('LIVEKIT_URL')

    if (!apiKey || !apiSecret || !url) {
      return new Response(
        JSON.stringify({ error: 'LiveKit not configured on server.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = await signJwt(apiKey, apiSecret, parsed.data.roomName, parsed.data.identity)
    return new Response(JSON.stringify({ token, url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to mint token.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
