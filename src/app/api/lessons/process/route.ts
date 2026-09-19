import { NextResponse } from "next/server";
import { adaptMaterial, geminiConfigured, isQuotaError, type Material } from "@/lib/server/gemini";
import { MOCK_LESSON } from "@/lib/server/mock";
import { requireUser } from "@/lib/server/auth";
import { DEMO_STUDENT, type Lesson, type StudentProfile } from "@/lib/lesson-types";

export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const TEXT_TYPES = ["text/plain", "text/markdown"];

// The sample includes a written figure description so Gemini has a "diagram" to work with.
const SAMPLE_TEXT = `Photosynthesis (Grade 7 Science)
Plants make their own food through photosynthesis. Chlorophyll, the green substance in leaves, absorbs sunlight. The plant uses that energy to turn water and carbon dioxide into sugar and oxygen. Water is taken up through the roots. Carbon dioxide enters through tiny holes in the leaves called stomata. Oxygen is released into the air. The sugar is used for growth and energy.
Figure 1: A diagram of a green plant. A sun in the top corner sends rays of sunlight onto the leaves. An arrow labelled "water" goes from the roots up to the leaves. An arrow labelled "carbon dioxide" points into the leaves. An arrow labelled "oxygen" points out of the leaves. A label in the leaf reads "sugar (food)".`;

const shouldMock = () => process.env.USE_MOCK_DATA === "true" || !geminiConfigured();

const fail = (message: string, status: number, code: string) =>
  NextResponse.json({ error: message, code }, { status });

function finish(content: Lesson, id?: string) {
  const lesson: Lesson = { ...content, id: id ?? crypto.randomUUID(), createdAt: new Date().toISOString() };
  return NextResponse.json({ lesson });
}

export async function POST(request: Request) {
  if (!(await requireUser(request))) return fail("Please log in again.", 401, "unauthorized");
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("We couldn't read that upload. Please try again.", 400, "bad_request");
  }

  let profile: StudentProfile = DEMO_STUDENT;
  try {
    const p = form.get("profile");
    if (typeof p === "string") profile = JSON.parse(p);
  } catch {
    /* fall back to the demo profile */
  }

  const isSample = form.get("sample") === "true";
  const pasted = form.get("text");
  const file = form.get("file");

  let material: Material;
  let visual: Lesson["visual"];

  if (isSample) {
    if (shouldMock()) return finish({ ...MOCK_LESSON, source: "mock", visual: { kind: "sample" } } as Lesson);
    material = { kind: "text", text: SAMPLE_TEXT };
    visual = { kind: "sample" };
  } else if (file instanceof File) {
    if (file.size === 0) return fail("That file looks empty. Please choose another one.", 400, "empty");
    if (file.size > MAX_BYTES) return fail("That file is too large. Please use one under 8 MB.", 400, "too_large");
    const type = file.type || "";
    if (TEXT_TYPES.includes(type) || file.name.match(/\.(txt|md)$/i)) {
      const text = (await file.text()).trim();
      if (!text) return fail("That file looks empty. Please choose another one.", 400, "empty");
      material = { kind: "text", text: text.slice(0, 40_000) };
    } else if (FILE_TYPES.includes(type)) {
      const buf = Buffer.from(await file.arrayBuffer());
      material = { kind: "file", mimeType: type, base64: buf.toString("base64") };
      if (type.startsWith("image/")) {
        visual = { kind: "image", dataUrl: `data:${type};base64,${material.base64}`, alt: file.name };
      }
    } else {
      return fail("This file type isn't supported yet. Try a PDF or image.", 400, "unsupported");
    }
  } else if (typeof pasted === "string" && pasted.trim()) {
    material = { kind: "text", text: pasted.trim().slice(0, 40_000) };
  } else {
    return fail("Please add some learning material first.", 400, "empty");
  }

  if (shouldMock()) {
    // Demo mode: no key configured, so show the bundled lesson instead of failing.
    return finish({ ...MOCK_LESSON, source: "mock", visual } as Lesson);
  }

  try {
    const content = await adaptMaterial(material, profile);
    return finish({ ...content, source: "gemini", visual } as Lesson);
  } catch (err) {
    console.error("[ilumo] lesson processing failed:", err instanceof Error ? err.message : err);
    if (isSample) return finish({ ...MOCK_LESSON, source: "mock", visual: { kind: "sample" } } as Lesson);
    if (isQuotaError(err)) return fail("The AI service is busy right now. Please wait a minute and try again.", 429, "rate_limited");
    return fail("We couldn't prepare your lesson right now.", 502, "ai_unavailable");
  }
}
