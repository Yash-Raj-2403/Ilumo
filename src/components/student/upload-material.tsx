"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Image as ImageIcon, UploadCloud } from "lucide-react";
import type { Lesson } from "@/lib/lesson-types";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { authedFetch } from "@/lib/session/authed-fetch";
import { useStudent } from "./student-provider";
import { ProcessingState } from "./processing-state";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.md";
const OK_EXT = /\.(pdf|png|jpe?g|webp|txt|md)$/i;
const MAX_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;
const MIN_PROCESSING_MS = 4000;

const fmtSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

type Phase = "pick" | "processing" | "error";
type Source = { kind: "file"; file: File } | { kind: "sample" };

function validate(file: File): string | null {
  if (file.size === 0) return "That file looks empty. Please choose another one.";
  if (!OK_EXT.test(file.name)) return "This file type isn't supported yet. Try a PDF or image.";
  if (file.size > MAX_BYTES) return "That file is too large. Please choose one under 8 MB.";
  return null;
}

export function UploadMaterial() {
  const router = useRouter();
  const params = useSearchParams();
  const { student, saveLesson, supports: mySupports } = useStudent();
  // Which of the person's own kinds of support this lesson should be adapted for.
  const [adaptFor, setAdaptFor] = useState<CategorySlug[] | null>(null);
  const chosen = (adaptFor ?? mySupports).filter((s) => mySupports.includes(s));
  const [phase, setPhase] = useState<Phase>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [failure, setFailure] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const lastSource = useRef<Source | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  const choose = (f: File | undefined | null) => {
    if (!f) return;
    const err = validate(f);
    setProblem(err);
    setFile(err ? null : f);
  };

  const run = useCallback(
    async (source: Source) => {
      lastSource.current = source;
      setPhase("processing");
      const form = new FormData();
      form.set("profile", JSON.stringify(student));
      form.set("supports", JSON.stringify(chosen.length ? chosen : mySupports));
      if (source.kind === "sample") form.set("sample", "true");
      else form.set("file", source.file);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const startedAt = Date.now();
      try {
        const res = await authedFetch("/api/lessons/process", { method: "POST", body: form, signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.lesson) throw new Error(data.error || "We couldn't prepare your lesson right now.");
        // Let the progress steps play out so the experience doesn't flash by.
        const wait = MIN_PROCESSING_MS - (Date.now() - startedAt);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        const lesson = data.lesson as Lesson;
        saveLesson(lesson);
        router.push(`/student/lesson/${lesson.id}`);
      } catch (e) {
        const timedOut = e instanceof DOMException && e.name === "AbortError";
        setFailure(
          timedOut
            ? "This is taking longer than expected."
            : e instanceof TypeError
              ? "We couldn't connect. Check your internet and try again."
              : e instanceof Error
                ? e.message
                : "We couldn't prepare your lesson right now.",
        );
        setPhase("error");
      } finally {
        clearTimeout(timer);
      }
    },
    [router, saveLesson, student, chosen, mySupports],
  );

  // ?sample=1 jumps straight into the sample lesson.
  useEffect(() => {
    if (params.get("sample") === "1" && !started.current) {
      started.current = true;
      run({ kind: "sample" });
    }
  }, [params, run]);

  if (phase === "processing") return <ProcessingState />;

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center card-border" role="alert">
        <h1 className="text-3xl font-bold text-ink">We couldn&apos;t prepare your lesson right now.</h1>
        <p className="mt-3 text-lg text-body">{failure}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => lastSource.current && run(lastSource.current)} className="min-h-12 rounded-full bg-brand-deep px-6 font-semibold text-white">
            Try Again
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("pick");
              setFile(null);
            }}
            className="min-h-12 rounded-full bg-white px-6 font-semibold text-brand-deep card-border"
          >
            Choose Another Material
          </button>
          <button type="button" onClick={() => run({ kind: "sample" })} className="min-h-12 rounded-full px-6 font-semibold text-brand underline underline-offset-4">
            Use the sample lesson instead
          </button>
        </div>
      </div>
    );
  }

  const isImage = file?.type.startsWith("image/");
  const FileIcon = isImage ? ImageIcon : FileText;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-ink">Let&apos;s make your learning material accessible.</h1>
        <p className="mt-3 text-xl text-body">Upload something you&apos;re learning and ILUMO will adapt it for you.</p>
      </header>

      <fieldset className="rounded-3xl bg-tint-purple p-5 card-border">
        <legend className="px-2 text-lg font-bold text-ink">Adapt this lesson for</legend>
        {mySupports.length === 1 ? (
          <p className="text-lg text-ink">{CATEGORIES.find((c) => c.slug === mySupports[0])?.title}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.filter((c) => mySupports.includes(c.slug)).map((c) => {
              const on = chosen.includes(c.slug);
              return (
                <label key={c.slug} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${on ? "bg-brand-deep text-white" : "bg-white text-brand-deep card-border"}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => {
                      const next = on ? chosen.filter((x) => x !== c.slug) : [...chosen, c.slug];
                      setAdaptFor(next.length ? next : chosen); // keep at least one
                    }}
                  />
                  {on && <span aria-hidden>✓</span>} {c.short}
                </label>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-sm text-body">It will appear in those support areas, written to suit them.</p>
      </fieldset>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            choose(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-3xl border-2 border-dashed p-8 text-center sm:p-14 ${
            dragging ? "border-brand bg-brand-soft" : "border-brand-deep/40 bg-white"
          }`}
        >
          <UploadCloud className="mx-auto size-12 text-brand" aria-hidden />
          <p className="mt-4 text-2xl font-bold text-ink">Drop your learning material here</p>
          <p className="my-2 text-body">or</p>
          <input
            ref={inputRef}
            id="material-file"
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <label
            htmlFor="material-file"
            className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-brand-deep px-8 font-semibold text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-4"
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          >
            Choose File
          </label>
          <p className="mt-6 text-sm text-body">Accepted: PDF, images (PNG, JPG, WebP) and text files. Up to 8 MB.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 card-border sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
              <FileIcon className="size-7 text-brand" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-ink">{file.name}</p>
              <p className="text-body">
                {file.type || file.name.split(".").pop()?.toUpperCase()} · {fmtSize(file.size)}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setFile(null)} className="min-h-12 rounded-full bg-white px-6 font-semibold text-brand-deep card-border">
              Remove<span className="sr-only"> {file.name}</span>
            </button>
            <button type="button" onClick={() => run({ kind: "file", file })} className="min-h-12 rounded-full bg-brand-deep px-8 font-semibold text-white">
              Make This Accessible
            </button>
          </div>
        </div>
      )}

      {problem && (
        <p role="alert" className="rounded-2xl bg-tint-pink p-4 font-semibold text-ink ring-1 ring-black/20">
          {problem}
        </p>
      )}

      {!file && (
        <div className="text-center">
          <button type="button" onClick={() => run({ kind: "sample" })} className="min-h-12 rounded-full bg-white px-6 font-semibold text-brand-deep card-border hover:bg-brand-soft">
            Try a Sample Lesson
          </button>
        </div>
      )}
    </div>
  );
}
