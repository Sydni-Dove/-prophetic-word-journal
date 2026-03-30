import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Try models in order — newest first, fallback to older stable versions
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

const PROMPT =
  'Read this handwritten journal page carefully and extract the text as accurately as possible. ' +
  'Preserve paragraph breaks, line breaks, dates, labels, and punctuation whenever they are readable. ' +
  'If the page contains headings or labels such as Word, Prophetic Word, Meaning, Interpretation, Scripture, Response, Prayer, Notes, Theme, By, Source, or Date, keep those labels exactly as written instead of rewriting them. ' +
  'Do not summarize, explain, clean up, or paraphrase. Do not add commentary. Do not invent missing words. ' +
  'If a word is unclear, keep your best close reading rather than rewriting the sentence. ' +
  'Return only the extracted text.';

const FUNCTION_VERSION = 'ocr-image-2026-03-27-v2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: cors,
    });
  }

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
      return ok({
        text,
        model,
        version: FUNCTION_VERSION,
        attemptedModels: MODELS
      });
    }

    // All models failed
    return ok({
      error: `OCR failed — ${lastError}`,
      version: FUNCTION_VERSION,
      models: MODELS
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return ok({ error: msg, version: FUNCTION_VERSION });
  }
});
