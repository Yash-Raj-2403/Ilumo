import { authedFetch } from "@/lib/supabase/authed-fetch";

/** Ask the AI to describe a picture (a File, or a data: address such as an uploaded lesson image). */
export async function describeImage(source: File | Blob | string): Promise<{ title: string; description: string }> {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const form = new FormData();
  form.set("file", blob, "picture");
  const res = await authedFetch("/api/describe", { method: "POST", body: form, signal: AbortSignal.timeout(45_000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.description) throw new Error(data.error || "We couldn't describe that picture right now. Please try again.");
  return data;
}
