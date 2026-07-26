// app/api/activate-lead/route.ts — server-side proxy for the ▶ Play Proactivo button.
//
// Runs ON THE SERVER (Next.js Route Handler), so the CALLBACK_SECRET and the tenant's
// phone_number_id NEVER reach the browser. The browser POSTs only { contact_phone, tag, product };
// this handler adds the secret + phone_number_id from SERVER env and forwards to Notifiica's
// `activate-lead` edge function, which tells the agent to contact the lead and open the opportunity.
//
// Server env (NOT NEXT_PUBLIC — never bundled to the client):
//   NOTIFIICA_ACTIVATE_URL   — e.g. http://localhost:54321/functions/v1/activate-lead
//   NOTIFIICA_CALLBACK_SECRET — the shared CALLBACK_SECRET gating the edge function
//   TENANT_PHONE_NUMBER_ID    — the demo line (1179659831904619 = "Colsubsidio Seguros")

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const activateUrl = process.env.NOTIFIICA_ACTIVATE_URL;
  const secret = process.env.NOTIFIICA_CALLBACK_SECRET;
  const phoneNumberId = process.env.TENANT_PHONE_NUMBER_ID;
  if (!activateUrl || !secret || !phoneNumberId) {
    return NextResponse.json(
      { ok: false, error: "server_misconfigured" },
      { status: 500 }
    );
  }

  let body: { contact_phone?: string; tag?: string | null; product?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const contactPhone = (body.contact_phone ?? "").trim();
  if (!contactPhone) {
    return NextResponse.json(
      { ok: false, error: "missing_contact_phone" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(activateUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        phone_number_id: phoneNumberId,
        contact_phone: contactPhone,
        tag: body.tag ?? undefined,
        product: body.product ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    // Pass the edge function's status + payload straight through (ok / skipped:"already_active" / …).
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `activate_unreachable:${(e as Error)?.message ?? e}` },
      { status: 502 }
    );
  }
}
