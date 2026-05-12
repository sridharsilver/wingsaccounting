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
    Goal: Guide users to see our work on the portfolio page or start a project on the contact page.
    
    LANGUAGE RULE:
    Always detect the language of the user's message and respond in that SAME language (e.g., if they ask in Hindi, respond in Hindi; if in Spanish, respond in Spanish).
    
    RESPONSE FORMAT:
    You MUST return your response as a JSON object with two fields:
    1. "reply": Your actual response text.
    2. "lang": The BCP-47 language tag of the response (e.g., "en-US", "hi-IN", "te-IN", "es-ES", "fr-FR", "de-DE", "zh-CN").`

    // Truncate to last 6 messages for maximum efficiency
    const maxHistory = 6;
    const historyToProcess = history?.slice(-maxHistory) || [];
    const formattedHistory = []
    let lastRole = null

    if (historyToProcess.length > 0) {
      for (const m of historyToProcess) {
        const role = m.role === 'assistant' ? 'model' : 'user'
        if (role === lastRole) continue
        if (formattedHistory.length === 0 && role === 'model') continue
        formattedHistory.push({ role, parts: [{ text: m.content }] })
        lastRole = role
      }
    }

    formattedHistory.push({ role: "user", parts: [{ text: message }] })

    const requestBody = {
      contents: formattedHistory,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { response_mime_type: "application/json" }
    }

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    let response;
    let data;
    let lastError;
    let lastModelTried = models[0];

    for (const model of models) {
      lastModelTried = model;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          }
        )

        data = await response.json()
        if (response.ok) break; // Success!
        
        lastError = data;
        console.warn(`Model ${model} failed with status ${response.status}.`)
        
        // Continue to next model on 429, 404, or 5xx
        if (response.status === 429 || response.status === 404 || response.status >= 500) {
          continue;
        } else {
          break; // Unrecoverable (e.g. 400 Bad Request)
        }
      } catch (e) {
        console.error(`Fetch error for ${model}:`, e)
      }
    }

    if (!response || !response.ok) {
      const errorText = JSON.stringify(lastError || { error: 'Unknown' })
      const status = response?.status || 500
      const isQuotaError = status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')

      const retryMatch = errorText.match(/retry in (\d+(\.\d+)?)s/)
      const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 10 : 180

      return new Response(JSON.stringify({ 
        reply: isQuotaError
          ? `⏳ I've hit my request limit. I'll be back in **${retrySeconds < 60 ? retrySeconds + ' seconds' : '3 minutes'}**! Please wait.`
          : `⚠️ Something went wrong. (${status} - ${lastModelTried})`,
        lang: "en-US",
        rateLimit: isQuotaError,
        retryAfter: isQuotaError ? retrySeconds : 0
      }), { headers: corsHeaders, status: 200 })
    }

    const candidate = data.candidates?.[0]
    const reply = candidate?.content?.parts?.[0]?.text

    if (!reply) {
      console.error('No text in response:', JSON.stringify(data))
      const reason = candidate?.finishReason || data.promptFeedback?.blockReason || "Blocked or empty response"
      return new Response(JSON.stringify({ 
        reply: `I'm sorry, I couldn't generate a response. (Reason: ${reason})` 
      }), { headers: corsHeaders, status: 200 })
    }

    try {
      const parsed = JSON.parse(reply)
      return new Response(JSON.stringify({ 
        reply: parsed.reply, 
        lang: parsed.lang || "en-US" 
      }), { headers: corsHeaders, status: 200 })
    } catch (e) {
      // Fallback if AI didn't return valid JSON
      return new Response(JSON.stringify({ reply, lang: "en-US" }), { headers: corsHeaders, status: 200 })
    }
  } catch (error) {
    console.error('System Error:', error)
    return new Response(JSON.stringify({ reply: `System Error: ${error.message}` }), { headers: corsHeaders, status: 200 })
  }
})
