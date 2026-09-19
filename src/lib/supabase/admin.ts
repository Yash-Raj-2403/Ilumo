import { createClient } from "@supabase/supabase-js";

// Server-only client (service role, bypasses RLS). Import from route handlers only,
// never from a "use client" file.
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
