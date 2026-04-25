import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, personalizationData, leadData } = await req.json()

    // Email templates
    const templates = {
      personalized_video_welcome: {
        subject: `Welcome ${personalizationData?.first_name || 'there'}! Your Personalized Video is Ready`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22d3ee;">Your Personalized Video Experience</h1>
            <p>Hello ${personalizationData?.first_name || 'there'},</p>
            <p>Thank you for your interest! We've created a personalized video just for you${personalizationData?.company ? ` at ${personalizationData.company}` : ''}.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>What's Included:</h3>
              <ul>
                <li>Personalized welcome message</li>
                <li>Custom content based on your interests</li>
                <li>Exclusive offers for ${personalizationData?.job_title || 'your role'}</li>
              </ul>
            </div>

            <a href="${personalizationData?.videoUrl || '#'}" style="background: #22d3ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Watch Your Personalized Video
            </a>

            <p style="color: #6b7280; font-size: 14px;">
              Didn't request this? <a href="#">Unsubscribe</a>
            </p>
          </div>
        `,
        text: `Hello ${personalizationData?.first_name || 'there'}!

Thank you for your interest! We've created a personalized video just for you${personalizationData?.company ? ` at ${personalizationData.company}` : ''}.

Watch your personalized video: ${personalizationData?.videoUrl || 'link not available'}

Didn't request this? Please let us know.`
      },

      lead_nurture: {
        subject: `${personalizationData?.first_name || 'Hi'}, More Personalized Content Available`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #22d3ee;">More Personalized Content for You</h2>
            <p>Hi ${personalizationData?.first_name || 'there'},</p>
            <p>We noticed you enjoyed our personalized video. Here's some additional content tailored just for you:</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Recommended for ${personalizationData?.job_title || 'you'}:</h3>
              <ul>
                <li>Industry-specific insights</li>
                <li>Custom solutions for ${personalizationData?.company || 'your company'}</li>
                <li>Exclusive case studies</li>
              </ul>
            </div>

            <a href="#" style="background: #22d3ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Explore More Content
            </a>
          </div>
        `,
        text: `Hi ${personalizationData?.first_name || 'there'},

We noticed you enjoyed our personalized video. Check out more personalized content tailored just for you.

Explore more: #`
      }
    }

    const emailTemplate = templates[template] || templates.personalized_video_welcome

    // Here you would integrate with your email service provider
    // For example: SendGrid, Mailgun, AWS SES, etc.

    // Example with SendGrid (you would need to set up the API key)
    /*
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject,
          dynamic_template_data: {
            ...personalizationData,
            ...leadData
          }
        }],
        from: { email: 'noreply@yourdomain.com' },
        template_id: template
      })
    })
    */

    // For now, we'll simulate successful email sending
    console.log('Email sent:', {
      to,
      subject: emailTemplate.subject,
      template,
      personalizationData,
      leadData
    })

    // Store email send record
    const emailRecord = {
      to,
      subject: emailTemplate.subject,
      template,
      personalizationData,
      leadData,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }

    console.log('Email record:', emailRecord)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: Date.now().toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Email service error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})