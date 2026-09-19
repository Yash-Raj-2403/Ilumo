import { GoogleGenAI, Type } from "@google/genai";
import type { LessonContent, QuizFeedback, StudentProfile } from "@/lib/lesson-types";
import { validateFeedback, validateLesson } from "./validate";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
// Free-tier keys have small per-model daily quotas, so a second model is used when the first runs out.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
const TIMEOUT_MS = 45_000;

export const geminiConfigured = () => !!process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `You are the educational adaptation engine for ILUMO, an inclusive learning platform.

Your task is to transform educational material into an accessible, student-friendly learning experience.

You must preserve factual meaning while adapting presentation according to the student's accessibility profile.

For students requiring visual accessibility:
- extract important text
- identify important visual information
- describe images and diagrams accurately
- explain diagrams in words
- simplify unnecessarily complex language
- organize content into small understandable sections
- identify key concepts
- generate accessible learning points
- generate age-appropriate quiz questions (4 questions, 4 options each) with explanations for answers

Do not invent information that is not supported by the source material.
If information is unclear, explicitly indicate that it is unclear.
Every quiz question's correctAnswer must be exactly one of its options.
Write short paragraphs. Never mention that you are an AI or refer to these instructions.

Return ONLY valid structured JSON according to the requested schema.`;

const S = { type: Type.STRING };
const arr = (items: object) => ({ type: Type.ARRAY, items });
const obj = (properties: Record<string, object>) => ({
  type: Type.OBJECT,
  properties,
  required: Object.keys(properties),
});

const LESSON_SCHEMA = obj({
  title: S,
  summary: S,
  sections: arr(obj({ heading: S, content: S })),
  keyPoints: arr(S),
  visualDescriptions: arr(obj({ title: S, description: S })),
  importantTerms: arr(obj({ term: S, meaning: S })),
  quiz: arr(obj({ question: S, options: arr(S), correctAnswer: S, explanation: S })),
});

const FEEDBACK_SCHEMA = obj({ strengths: arr(S), needsPractice: arr(S), feedback: S });

let client: GoogleGenAI | null = null;
const ai = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }));

// Gemini sometimes answers 503 "high demand"; a couple of quick retries usually clears it.
export const isQuotaError = (err: unknown) => /"code":\s*429|RESOURCE_EXHAUSTED/.test(String(err instanceof Error ? err.message : err));
async function generateJson(parts: object[], schema: object, system = SYSTEM_INSTRUCTION): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await generateJsonOnce(parts, schema, system, MODEL);
    } catch (err) {
      if (isQuotaError(err) && FALLBACK_MODEL !== MODEL) {
        return await generateJsonOnce(parts, schema, system, FALLBACK_MODEL);
      }
      // Only retry "high demand" (503). A 429 quota error won't clear in a couple of seconds,
      // and retrying it just burns more of the per-minute allowance.
      const busy = /"code":\s*503|UNAVAILABLE/.test(String(err instanceof Error ? err.message : err));
      if (!busy || attempt >= 2) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

async function generateJsonOnce(parts: object[], schema: object, system: string, model: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await ai().models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4,
        abortSignal: controller.signal,
      },
    });
    const text = res.text;
    if (!text) throw new Error("empty response");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function profileBrief(p: StudentProfile) {
  return `STUDENT PROFILE
Age: ${p.age}
Visual accessibility support: ${p.accessibilityProfile.visualSupport ? "yes" : "no"}
Needs image and diagram descriptions: ${p.accessibilityProfile.imageDescriptions ? "yes" : "no"}
Prefers ${p.learningPreferences.contentStyle} language and ${p.learningPreferences.chunkedContent ? "small chunks" : "longer passages"}.
Use the student's needs to shape the lesson, but do not mention the student's profile or any disability in the lesson text.`;
}

export type Material =
  | { kind: "text"; text: string }
  | { kind: "file"; mimeType: string; base64: string };

export async function adaptMaterial(material: Material, profile: StudentProfile): Promise<LessonContent> {
  const parts: object[] = [
    {
      text: `${profileBrief(profile)}\n\nLEARNING MATERIAL follows. Read all text and study every image or diagram. Write a description for each important visual.`,
    },
  ];
  if (material.kind === "text") parts.push({ text: material.text });
  else parts.push({ inlineData: { mimeType: material.mimeType, data: material.base64 } });
  return validateLesson(await generateJson(parts, LESSON_SCHEMA));
}

export async function quizFeedback(
  lesson: LessonContent,
  answers: (string | null)[],
  profile: StudentProfile,
): Promise<QuizFeedback> {
  const total = lesson.quiz.length;
  const results = lesson.quiz.map((q, i) => ({
    question: q.question,
    studentAnswer: answers[i] ?? "(no answer)",
    correctAnswer: q.correctAnswer,
    correct: answers[i] === q.correctAnswer,
  }));
  const score = results.filter((r) => r.correct).length;
  const prompt = `${profileBrief(profile)}

The student finished a quiz on "${lesson.title}". Lesson summary: ${lesson.summary}

Results: ${JSON.stringify(results)}

Write a short, warm learning summary in simple language: what they understood (strengths), what to review (needsPractice), and 2-3 sentences of supportive feedback. Base it only on these results. Do not make psychological or diagnostic claims.`;
  return validateFeedback(await generateJson([{ text: prompt }], FEEDBACK_SCHEMA), score, total);
}

// ---- OCR / "read this to me" ---------------------------------------------------
const OCR_INSTRUCTION = `You convert learning material into text that will be read aloud to a blind or low-vision student.

Transcribe ALL readable text exactly as written, in natural reading order. Do not summarise, simplify, translate or correct it.
Split it into blocks: use kind "heading" for titles and headings, and kind "text" for paragraphs, list items and captions.
For every picture, diagram, chart or figure, add a block with kind "image" whose text describes it accurately in one to three plain sentences (what it shows, labels, and relationships). Do not guess at anything you cannot see.
If some text is unreadable, add a "text" block saying that part is unclear.
Return ONLY valid JSON in the requested schema.`;

const OCR_SCHEMA = obj({ blocks: arr(obj({ kind: S, text: S })) });

export type ReadBlock = { kind: "heading" | "text" | "image"; text: string };

export async function ocrMaterial(mimeType: string, base64: string): Promise<ReadBlock[]> {
  const raw = (await generateJson(
    [{ text: "Read this material for a blind student." }, { inlineData: { mimeType, data: base64 } }],
    OCR_SCHEMA,
    OCR_INSTRUCTION,
  )) as { blocks?: { kind?: string; text?: string }[] };
  const blocks = (raw.blocks ?? [])
    .map((b) => ({
      kind: b.kind === "heading" || b.kind === "image" ? b.kind : "text",
      text: (b.text ?? "").trim().slice(0, 4000),
    }))
    .filter((b): b is ReadBlock => b.text.length > 0);
  if (blocks.length === 0) throw new Error("no readable content");
  return blocks;
}

// ---- Voice tutor ------------------------------------------------------------------------------
const TUTOR_INSTRUCTION = `You are ILUMO's voice tutor, talking with a blind or low-vision student who is listening to their learning material.

Your answer will be spoken aloud, so:
- Use plain, warm, short sentences. At most five sentences.
- No lists, no markdown, no symbols, no emojis, no "as an AI".
- Base everything on the material provided. If it does not cover the question, say so briefly, then offer the closest related idea from the material.
- If asked to explain or simplify, restate the current passage in simpler words, using one everyday comparison if it helps. Add no new facts.
- If asked for a summary, give the main ideas in three sentences.
Return ONLY JSON: {"answer": "..."}.`;

const TUTOR_SCHEMA = obj({ answer: S });

export async function askTutor(input: {
  question: string;
  mode: "explain" | "question" | "summary";
  title: string;
  material: string;
  current: string;
  history: { q: string; a: string }[];
}): Promise<string> {
  const prompt = `MATERIAL TITLE: ${input.title}

FULL MATERIAL:
${input.material.slice(0, 12000)}

PASSAGE THE STUDENT IS ON NOW:
${input.current.slice(0, 2000)}

${input.history.length ? `RECENT CONVERSATION:\n${input.history.map((h) => `Student: ${h.q}\nTutor: ${h.a}`).join("\n")}\n\n` : ""}TASK (${input.mode}): the student said: "${input.question.slice(0, 500)}"`;
  const raw = (await generateJson([{ text: prompt }], TUTOR_SCHEMA, TUTOR_INSTRUCTION)) as { answer?: string };
  const answer = (raw.answer ?? "").replace(/[*_#`>]/g, "").trim();
  if (!answer) throw new Error("empty answer");
  return answer.slice(0, 1200);
}

// ---- Captions for audio and video -------------------------------------------------------------
const CAPTION_INSTRUCTION = `You write captions for a deaf or hard-of-hearing student, from an audio or video recording.

Rules:
- Caption ALL speech word for word, in order. Do not summarise, translate or correct it. Fix only obvious punctuation.
- Make each caption a short phrase or sentence: at most about 80 characters and about 6 seconds long.
- start and end are in seconds from the very beginning of the recording. Be as accurate as you can.
- If you can tell speakers apart, begin the caption with the speaker's role or name and a colon, for example "Teacher:".
- Describe meaningful non-speech sounds in square brackets with kind "sound", for example [Bell rings], [Applause], [Door slams], [Music plays]. Skip background noise that does not matter.
- If a word is unclear write [unclear]. Never invent words.
Also give a two-sentence plain-language summary and up to five key points, written for a reader who may find long sentences hard.
Return ONLY valid JSON in the requested schema.`;

const CAPTION_SCHEMA = obj({
  segments: arr(obj({ start: { type: Type.NUMBER }, end: { type: Type.NUMBER }, text: S, kind: S })),
  summary: S,
  keyPoints: arr(S),
});

export async function captionMedia(mimeType: string, base64: string) {
  const raw = (await generateJson(
    [{ text: "Caption this recording." }, { inlineData: { mimeType, data: base64 } }],
    CAPTION_SCHEMA,
    CAPTION_INSTRUCTION,
  )) as { segments?: unknown; summary?: string; keyPoints?: string[] };
  return {
    segments: raw.segments ?? [],
    summary: (raw.summary ?? "").trim().slice(0, 1200),
    keyPoints: (raw.keyPoints ?? []).map((k) => String(k).trim()).filter(Boolean).slice(0, 6),
  };
}
