// OCR Recipe Edge Function
// Receives an image and uses Claude to extract recipe data

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
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64 or mimeType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Claude API key from environment
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: `You are extracting a recipe from a handwritten recipe card. The handwriting may be cursive.

Analyze this image and extract:
1. Recipe name/title
2. Who it's from (if noted, like "From the kitchen of...")
3. All ingredients with amounts
4. All directions/steps
5. Any tips, notes, or special instructions

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "name": "Recipe Name",
  "source": "Person's Name or null",
  "preview": "One sentence description of what this recipe makes",
  "ingredients": [
    {"item": "flour", "amount": "2 cups", "category": "Baking"},
    {"item": "butter", "amount": "1 stick", "category": "Dairy"}
  ],
  "directions": [
    "Step one instructions",
    "Step two instructions"
  ],
  "tip": "Any tips or notes, or null if none"
}

Categories should be one of: Dairy, Baking, Nuts, Snacks, Produce, Meat, Spices, Other

If you cannot read something clearly, make your best guess and add [?] after it.
If the image shows both sides of a card, extract from both.`
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Claude API error:', errorData)
      return new Response(
        JSON.stringify({ error: errorData.error?.message || 'Claude API request failed' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const recipeText = data.content[0].text

    // Try to parse as JSON to validate
    let recipe
    try {
      recipe = JSON.parse(recipeText)
    } catch {
      // If parsing fails, return the raw text for debugging
      return new Response(
        JSON.stringify({ error: 'Failed to parse recipe JSON', raw: recipeText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ recipe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

