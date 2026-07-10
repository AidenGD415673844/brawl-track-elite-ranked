import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.24.2'

const BodySchema = z.object({
  playerTag: z.string().trim().min(2).max(20).regex(/^#?[A-Z0-9]+$/i),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Accept either the project's anon key (app has no user auth) or a valid user JWT.
    if (token !== anonKey) {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, anonKey)
      const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token)
      if (claimsErr || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }


    const apiKey = Deno.env.get('BRAWL_STARS_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid player tag.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch battles.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
