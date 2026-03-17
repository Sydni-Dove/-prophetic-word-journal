import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Try models in order — newest first, fallback to older stable versions
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];

const PROMPT =
  'Extract all the text from this handwritten image exactly as written. ' +
  'Preserve every paragraph break, line break, date, and punctuation mark. ' +
  'Return only the raw extracted text — no commentary, no formatting changes, no markdown.';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { image, mimeType } = await req.json();
    if (!image) return ok({ error: 'No image data received.' });

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return ok({
        error:
          'GEMINI_API_KEY secret is not set. Go to Supabase dashboard → ' +
          'Edge Functions → Manage Secrets and add GEMINI_API_KEY.',
      });
    }

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType || 'image/png', data: image } },
            { text: PROMPT },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    });

    let lastError = 'No models available.';

    for (const model of MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody }
      );
      const json = await res.json();

      if (!res.ok) {
        lastError = json?.error?.message ?? `Model ${model} returned HTTP ${res.status}`;
        continue; // try next model
      }

      const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return ok({ text, model });
    }

    // All models failed
    return ok({ error: `OCR failed — ${lastError}` });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return ok({ error: msg });
  }
});
