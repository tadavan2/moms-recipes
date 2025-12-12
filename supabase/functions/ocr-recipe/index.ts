// OCR Recipe Edge Function
// Receives one or more images and uses Claude to extract recipe data
// Handles: handwritten cards, printed recipes, emails with notes, two-sided cards

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
    const body = await req.json()
    
    // Support both old format (single image) and new format (array of images)
    let images: Array<{base64: string, mimeType: string}> = []
    
    if (body.images && Array.isArray(body.images)) {
      images = body.images
    } else if (body.imageBase64 && body.mimeType) {
      // Backwards compatibility with old single-image format
      images = [{ base64: body.imageBase64, mimeType: body.mimeType }]
    }

    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
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

    // Build content array with all images
    const content: Array<{type: string, source?: object, text?: string}> = []
    
    // Add each image
    images.forEach((img, index) => {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.base64
        }
      })
    })
    
    // Add the prompt
    const imageCount = images.length
    const prompt = `You are extracting a recipe from ${imageCount === 1 ? 'an image' : imageCount + ' images'} of a recipe card or document.

IMPORTANT: The content may be in various formats:
- Handwritten text (cursive OR print handwriting)
- Typed/printed text (from emails, printouts, cookbooks)
- A MIX of printed text with handwritten notes or modifications
- ${imageCount > 1 ? 'Multiple images showing FRONT and BACK of the same card - combine all information' : 'Single image - extract everything visible'}

Your task:
1. Read ALL text in the image(s), whether handwritten or printed
2. Identify the recipe name/title
3. Note who it's from if mentioned (e.g., "From Grandma Betty" or "From: susan@email.com")
4. Extract ALL ingredients with their amounts
5. Extract ALL directions/steps in order
6. Capture any tips, notes, or handwritten additions

${imageCount > 1 ? 'CRITICAL: These images are the FRONT and BACK of the same recipe card. Combine all information into ONE complete recipe. Do not create separate recipes.' : ''}

Return ONLY valid JSON in this exact format (no markdown, no explanation, no extra text):
{
  "name": "Recipe Name",
  "source": "Person's Name or null if not specified",
  "preview": "One sentence describing what this recipe makes",
  "ingredients": [
    {"item": "flour", "amount": "2 cups", "category": "Baking"},
    {"item": "butter", "amount": "1 stick", "category": "Dairy"}
  ],
  "directions": [
    "First step instructions",
    "Second step instructions"
  ],
  "tip": "Any tips, notes, or special instructions, or null if none"
}

Categories for ingredients (pick the best match):
Dairy, Baking, Nuts, Snacks, Produce, Meat, Spices, Other

If you cannot read something clearly, make your best guess and add [?] after it.
If there are handwritten modifications to a printed recipe, include the modifications.`

    content.push({
      type: 'text',
      text: prompt
    })

    // Call Claude API with increased token limit
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: content
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
