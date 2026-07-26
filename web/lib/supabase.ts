"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Surfaced at runtime in the browser console; keeps build from silently
  // shipping a client with an undefined URL.
  // eslint-disable-next-line no-console
  console.warn("[crm-light] Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY env");
}

/** Browser Supabase client (anon key, no auth — "Camino B" pattern). */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

export const REST_URL = `${url}/rest/v1`;
