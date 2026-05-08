import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
serve(async () => Response.json({
  followups: {
    viewed_no_play: 'Saw you opened the page—want the 30-second summary?',
    played_no_click: 'Want me to send a tailored implementation example?',
    clicked_no_form: 'Happy to share pricing and rollout steps in one page.',
    submitted_form: 'Thanks for sharing details. I drafted a rollout plan for your team.',
    booked_call: 'Looking forward to your call—agenda attached.'
  }
}))
