import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { lead, action, personalizationData } = await req.json()

    if (action === 'capture') {
      // Store lead in database
      const { data: leadRecord, error: insertError } = await supabaseClient
        .from('leads')
        .insert([{
          ...lead,
          personalization_data: personalizationData,
          source: 'video_personalization',
          status: 'new'
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting lead:', insertError)
        throw insertError
      }

      // Update contact list if personalization data exists
      if (personalizationData && personalizationData.contacts) {
        for (const contact of personalizationData.contacts) {
          const { error: contactError } = await supabaseClient
            .from('contacts')
            .upsert({
              email: contact.email,
              first_name: contact.first_name,
              last_name: contact.last_name,
              company: contact.company,
              job_title: contact.job_title,
              lead_id: leadRecord.id,
              tags: ['personalized_video']
            })

          if (contactError) {
            console.error('Error upserting contact:', contactError)
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          lead: leadRecord,
          message: 'Lead captured successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'send_email') {
      // Send personalized email
      const emailData = {
        to: lead.email,
        subject: personalizationData?.subject || 'Your Personalized Video Experience',
        template: 'personalized_video_welcome',
        personalizationData,
        leadData: lead
      }

      // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
      // For now, we'll just log it
      console.log('Email to send:', emailData)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email queued for delivery'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Error processing lead:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})