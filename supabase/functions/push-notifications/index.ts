import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { JWT } from "https://esm.sh/google-auth-library@9"

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Function triggered with payload:", JSON.stringify(payload, null, 2))
    
    const record = payload.record || payload 
    
    if (!record) {
      console.error("No record found in payload")
      return new Response(JSON.stringify({ error: "No record" }), { status: 400 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profiles, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('push_token, full_name')
      .not('push_token', 'is', null)

    if (dbError) {
      console.error("Database error:", dbError)
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens' }), { status: 200 })
    }

    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')
    
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    
    const tokenResponse = await jwtClient.getAccessToken()
    const accessToken = tokenResponse.token

    if (!accessToken) throw new Error("Failed to get FCM access token")

    const results = await Promise.all(profiles.map(async (profile) => {
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`
      
      const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: profile.push_token,
            // Combined Notification and Data payload for maximum reliability
            notification: {
              title: "New Enquiry Received!",
              body: `${record.name} is interested in ${record.subject || 'your services'}`,
            },
            data: {
              enquiryId: String(record.id),
              click_action: "OPEN_ENQUIRIES"
            },
            android: {
              priority: "high",
              notification: {
                icon: "ic_stat_notification",
                color: "#9b4dff",
                channel_id: "enquiries",
                notification_priority: "PRIORITY_MAX", // Highest possible
                visibility: "PUBLIC",
                tag: "new_enquiry",
                default_sound: true,
                default_vibrate_timings: true
              }
            }
          }
        }),
      })
      const responseText = await res.text()
      console.log(`FCM Response for ${profile.full_name}:`, responseText)
      return JSON.parse(responseText)
    }))

    return new Response(JSON.stringify({ success: true, results }), { status: 200 })
  } catch (error) {
    console.error("Critical Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
