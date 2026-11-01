// supabase/functions/scan-timetable/index.ts
//
// Turns a photo/screenshot of a college timetable into structured JSON using a
// vision-capable model. The mobile app NEVER holds the model API key — it calls
// this function with the user's Supabase JWT.
//
// Deploy:   supabase functions deploy scan-timetable
// Secrets:  supabase secrets set VISION_API_URL=... VISION_API_KEY=... VISION_MODEL=...
//   VISION_API_URL must be an OpenAI-compatible chat-completions endpoint that
//   accepts image_url content (OpenAI, Gemini's OpenAI-compat endpoint, OpenRouter...).
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Request  (POST, JSON):  { "image_base64": "<no data: prefix>", "mime": "image/jpeg" }
// Response (200, JSON):   { "slots": ParsedSlot[], "warnings": string[], "scans_left": number }
// Errors:  401 not signed in | 400 bad input | 413 too large | 429 daily limit | 502 model failed

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DAILY_LIMIT = 5;
const MAX_BASE64_CHARS = 6_000_000; // ~4.5 MB of image
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface ParsedSlot {
  day: number; // 1 = Monday ... 7 = Sunday
  start: string; // HH:MM 24h
  end: string; // HH:MM 24h
  subject: string;
  room: string | null;
  confidence: 'high' | 'low'; // low → the review screen highlights the cell
}

const PROMPT = `You read a college class timetable from an image and return ONLY JSON.

Return exactly this shape:
{"slots":[{"day":1,"start":"09:00","end":"10:00","subject":"Database Management Systems","room":"LH-2","confidence":"high"}]}

Rules:
- day: Monday=1, Tuesday=2, ... Saturday=6, Sunday=7.
- start and end: 24-hour "HH:MM". Convert 1:30 PM to "13:30". If a period has only a start time, use the next period's start (or +1 hour) as end.
- subject: the subject name or code exactly as printed. Do not invent or expand abbreviations.
- Ignore breaks, lunch, assembly, free periods and empty cells. Do NOT create slots for them.
- A cell spanning several periods (a lab) is ONE slot from the first start to the last end.
- room: null if not shown.
- confidence: "low" when text is blurry, cut off or you are guessing; otherwise "high".
- If the image is not a timetable, return {"slots":[]}.
- No markdown, no commentary, JSON only.`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function validate(raw: unknown): { slots: ParsedSlot[]; warnings: string[] } {
  const warnings: string[] = [];
  const slots: ParsedSlot[] = [];
  const list = (raw as { slots?: unknown })?.slots;
  if (!Array.isArray(list)) return { slots, warnings: ['The model returned no timetable data.'] };

  list.forEach((item, i) => {
    const s = item as Record<string, unknown>;
    const day = Number(s.day);
    const start = String(s.start ?? '');
    const end = String(s.end ?? '');
    const subject = String(s.subject ?? '').trim();
    const room = s.room == null || String(s.room).trim() === '' ? null : String(s.room).trim();

    if (!Number.isInteger(day) || day < 1 || day > 7) {
      warnings.push(`Row ${i + 1}: skipped (invalid day).`);
      return;
    }
    if (!TIME_RE.test(start) || !TIME_RE.test(end) || end <= start) {
      warnings.push(`Row ${i + 1} (${subject || 'unknown'}): skipped (invalid time).`);
      return;
    }
    if (subject.length === 0 || subject.length > 80) {
      warnings.push(`Row ${i + 1}: skipped (missing subject name).`);
      return;
    }
    slots.push({
      day,
      start,
      end,
      subject,
      room: room && room.length <= 40 ? room : null,
      confidence: s.confidence === 'low' ? 'low' : 'high',
    });
  });

  if (slots.length > 80) {
    warnings.push('More than 80 slots detected; only the first 80 were kept.');
    slots.length = 80;
  }
  return { slots, warnings };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  // ---- 1. who is calling? -------------------------------------------------
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Please sign in again.' }, 401);
  const userId = userData.user.id;

  // ---- 2. validate input --------------------------------------------------
  let body: { image_base64?: string; mime?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const image = body.image_base64 ?? '';
  const mime = body.mime ?? '';
  if (!image || !ALLOWED_MIME.has(mime)) {
    return json({ error: 'Send a JPEG, PNG or WebP image.' }, 400);
  }
  if (image.length > MAX_BASE64_CHARS) {
    return json({ error: 'Image too large. Please crop or compress it.' }, 413);
  }

  // ---- 3. daily limit (cost control) -------------------------------------
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const day = new Date().toISOString().slice(0, 10);
  const { data: usage } = await admin
    .from('scan_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();
  const used = usage?.count ?? 0;
  if (used >= DAILY_LIMIT) {
    return json({ error: `Daily scan limit (${DAILY_LIMIT}) reached. Try again tomorrow.` }, 429);
  }

  // ---- 4. call the vision model ------------------------------------------
  let modelText = '';
  try {
    const res = await fetch(Deno.env.get('VISION_API_URL')!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('VISION_API_KEY')!}`,
      },
      body: JSON.stringify({
        model: Deno.env.get('VISION_MODEL')!,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${image}` } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error('vision model error', res.status, await res.text());
      return json({ error: 'Could not read the timetable. Please try again.' }, 502);
    }
    const data = await res.json();
    modelText = data?.choices?.[0]?.message?.content ?? '';
  } catch (e) {
    console.error('vision request failed', e);
    return json({ error: 'Could not reach the scanner. Please try again.' }, 502);
  }

  // count the scan now that we paid for it
  await admin.from('scan_usage').upsert({ user_id: userId, day, count: used + 1 });

  // ---- 5. parse + validate ------------------------------------------------
  let parsed: unknown;
  try {
    // tolerate models that wrap JSON in ```json fences
    const cleaned = modelText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    parsed = JSON.parse(cleaned);
  } catch {
    return json({
      slots: [],
      warnings: ['The scan result was unreadable. Try a clearer, straight-on photo.'],
      scans_left: DAILY_LIMIT - (used + 1),
    });
  }

  const { slots, warnings } = validate(parsed);
  return json({ slots, warnings, scans_left: DAILY_LIMIT - (used + 1) });
});
