// Verify PIN Edge Function
// PIN is stored as a secret, never exposed to frontend

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pin } = await req.json()

    if (!pin) {
      return new Response(
        JSON.stringify({ valid: false, error: 'No PIN provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get PIN from environment (Supabase secret)
    const correctPin = Deno.env.get('APP_PIN')
    
    if (!correctPin) {
      console.error('APP_PIN secret not configured')
      return new Response(
        JSON.stringify({ valid: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Compare PINs
    const valid = pin === correctPin

    return new Response(
      JSON.stringify({ valid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Verify PIN error:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

