import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, history } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim()

    if (!apiKey) return new Response(JSON.stringify({ reply: "API Key missing." }), { headers: corsHeaders })

    const systemPrompt = `You are the AI Concierge for Wings Design Studio. 
    You are elite, professional, and helpful.

    CORE ROUTES:
    - Contact Page: /contact
    - Portfolio Page: /portfolio
    - Services Page: /services

    MANDATORY LINKING RULES:
    1. If you mention the contact page, you MUST use: [Contact Page](/contact)
    2. If someone asks for previous work, samples, or portfolio, you MUST use: [View Our Portfolio](/portfolio)
    3. If someone asks for specific services, you MUST use: [Explore Services](/services)
    
    Never just use brackets like [Contact Page]. Always include the path in parentheses like (/contact).

    Context: Wings Design Studio specializes in elite branding, graphic design, web UI/UX, and premium commercial printing.
    Goal: Guide users to see our work on the portfolio page or start a project on the contact page.`

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I will use the exact markdown link format for all internal routes." }] },
      ...(history || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      }
    )

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response."

    return new Response(JSON.stringify({ reply }), { headers: corsHeaders, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ reply: `System Error: ${error.message}` }), { headers: corsHeaders, status: 200 })
  }
})
