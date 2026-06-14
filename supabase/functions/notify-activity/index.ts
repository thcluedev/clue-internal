import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const TYPE_LABELS: Record<string, string> = {
  llamada: '📞 Llamada',
  reunion: '👥 Reunión',
  mail:    '✉️ Mail',
  tarea:   '✓ Tarea',
  otro:    '· Otro',
}

serve(async (req) => {
  try {
    const { activityId } = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: activity } = await supabase
      .from('activities')
      .select(`
        *,
        opportunities(title, companies(name)),
        assigned_profile:profiles!activities_assigned_to_fkey(full_name),
        creator_profile:profiles!activities_created_by_fkey(full_name)
      `)
      .eq('id', activityId)
      .single()

    if (!activity) return new Response('Activity not found', { status: 404 })

    const { data: { user: assignedUser } } = await supabase.auth.admin.getUserById(activity.assigned_to)
    if (!assignedUser?.email) return new Response('No email found', { status: 200 })

    const dueText  = activity.due_date
      ? `Fecha: ${new Date(activity.due_date + 'T00:00:00').toLocaleDateString('es-AR')}`
      : 'Sin fecha definida'

    const oppTitle     = activity.opportunities?.title         || '—'
    const companyName  = activity.opportunities?.companies?.name || '—'
    const typeLabel    = TYPE_LABELS[activity.type] || activity.type
    const creatorName  = activity.creator_profile?.full_name   || 'el equipo'

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0c0a;font-family:'DM Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:rgba(30,27,24,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <span style="font-family:monospace;font-size:11px;letter-spacing:0.1em;color:#9a9489;">CLUE <span style="color:#e84c1e;">INTERNAL</span></span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 8px;">
        <p style="margin:0 0 6px;font-size:11px;font-family:monospace;color:#9a9489;letter-spacing:0.08em;text-transform:uppercase;">${typeLabel}</p>
        <h1 style="margin:0;font-size:22px;font-weight:500;color:#ede9e0;line-height:1.3;">${activity.title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-family:monospace;font-size:9px;color:#9a9489;letter-spacing:0.1em;text-transform:uppercase;">OPORTUNIDAD</span><br>
              <span style="font-size:14px;color:#ede9e0;">${oppTitle}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-family:monospace;font-size:9px;color:#9a9489;letter-spacing:0.1em;text-transform:uppercase;">EMPRESA</span><br>
              <span style="font-size:14px;color:#ede9e0;">${companyName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;${activity.notes ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : ''}">
              <span style="font-family:monospace;font-size:9px;color:#9a9489;letter-spacing:0.1em;text-transform:uppercase;">FECHA</span><br>
              <span style="font-size:14px;color:#ede9e0;">${dueText}</span>
            </td>
          </tr>
          ${activity.notes ? `<tr>
            <td style="padding:10px 0;">
              <span style="font-family:monospace;font-size:9px;color:#9a9489;letter-spacing:0.1em;text-transform:uppercase;">NOTA</span><br>
              <span style="font-size:14px;color:#ede9e0;">${activity.notes}</span>
            </td>
          </tr>` : ''}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 28px;">
        <p style="margin:0;font-size:11px;font-family:monospace;color:#9a9489;">Asignado por ${creatorName}</p>
      </td>
    </tr>
  </table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clue Internal <no-reply@cluedev.com.ar>',
        to: assignedUser.email,
        subject: `Nueva actividad asignada: ${activity.title}`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
})
