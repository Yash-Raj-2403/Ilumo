"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Child, Role } from "@/lib/auth-shared";
import { supabase } from "@/lib/supabase/client";
import * as db from "@/lib/supabase/data";
import { DEMO_STUDENT, type Lesson, type QuizFeedback, type StudentProfile } from "@/lib/lesson-types";
import { ALL_SLUGS, normalizeSupports } from "@/lib/auth-shared";
import type { CategorySlug } from "@/lib/categories";
import { pauseSpeech, resumeSpeech, speakText, speechSupported, stopSpeech } from "@/lib/speech";

export type TextSize = "small" | "medium" | "large" | "xl";
export type Settings = {
  textSize: TextSize;
  highContrast: boolean;
  focusMode: boolean;
  describeImages: boolean;
  keyboardHints: boolean;
  /** Which accessibility categories apply to this person (null = never asked). */
  supports: CategorySlug[] | null;
  /** Show the Explore shelf of basics for ages 5 to 10. */
  explore: boolean;
  /** Best star score (1 to 3) for each Game Zone game. */
  gameStars: Record<string, number>;
  /** Days in a row a Game Zone game was finished. */
  gameStreak: { last: string; count: number; done: string[] };
  /** Text-to-speech speed, 0.75 to 2. */
  speechRate: number;
  /** How captions look (size and colours). */
  captions: { size: "m" | "l" | "xl" | "xxl"; theme: "dark" | "light" | "yellow" };
  /** A sign-language video someone attached to a lesson: lesson id -> web address. */
  signVideos: Record<string, string>;
  /** Extra words and phrases someone added to their communication board. */
  aacCustom: { emoji: string; label: string }[];
  /** Physical/motor access options. */
  motor: { size: "l" | "xl" | "xxl"; scan: boolean; scanSeconds: number; dwell: boolean; dwellMs: number; timeFactor: number; voice: boolean };
  /** Comfortable-reading options for dyslexia and other reading difficulties. */
  reading: { font: "standard" | "lexend" | "atkinson"; size: number; lineHeight: number; letterSpacing: number; tint: "none" | "cream" | "blue" | "peach" | "green"; ruler: boolean };
};
export type Progress = {
  sectionsRead: number[];
  quiz?: { answers: (string | null)[]; feedback: QuizFeedback };
  updatedAt: string;
};
export type ReadItem = { id: string; text: string };
export type SpeechState = { status: "idle" | "playing" | "paused"; currentId: string | null };

const SIZES: TextSize[] = ["small", "medium", "large", "xl"];

export type AuthUser = { id: string; email: string; name: string; role: Role; child: Child | null };

type Ctx = {
  ready: boolean;
  user: AuthUser;
  signOut: () => Promise<void>;
  /** Set when saving to or loading from the database failed. */
  dbError: string | null;
  student: StudentProfile;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Categories to show: the person's own choices, or everything if they haven't chosen yet. */
  supports: CategorySlug[];
  /** Update name/email/child in memory after they were saved. */
  updateUser: (patch: Partial<AuthUser>) => void;
  stepTextSize: (dir: 1 | -1) => void;
  lessons: Lesson[];
  progress: Record<string, Progress>;
  saveLesson: (lesson: Lesson) => void;
  getLesson: (id: string) => Lesson | undefined;
  markSectionRead: (lessonId: string, index: number) => void;
  saveQuizResult: (lessonId: string, answers: (string | null)[], feedback: QuizFeedback) => void;
  lessonProgress: (lesson: Lesson) => number;
  speech: SpeechState;
  speechAvailable: boolean;
  registerReadables: (items: ReadItem[] | null) => void;
  playQueue: (items?: ReadItem[], startAt?: number) => void;
  /** Change reading speed; if reading is in progress it restarts the current item at the new speed. */
  setSpeechRate: (rate: number) => void;
  pauseQueue: () => void;
  resumeQueue: () => void;
  stopQueue: () => void;
  /** Speak one piece of text (e.g. "Hear description"). */
  speakOne: (id: string, text: string, onEnd?: () => void, onFail?: () => void) => void;
};

const StudentContext = createContext<Ctx | null>(null);

export const useStudent = () => {
  const c = useContext(StudentContext);
  if (!c) throw new Error("useStudent must be used inside StudentProvider");
  return c;
};

function defaultSettings(p: StudentProfile): Settings {
  return {
    textSize: p.accessibilityProfile.largeText ? "large" : "medium",
    highContrast: p.accessibilityProfile.highContrast,
    focusMode: p.learningPreferences.focusMode,
    describeImages: p.accessibilityProfile.imageDescriptions,
    keyboardHints: p.accessibilityProfile.keyboardNavigation,
    supports: null,
    explore: false,
    gameStars: {},
    gameStreak: { last: "", count: 0, done: [] },
    speechRate: 1,
    captions: { size: "l", theme: "dark" },
    signVideos: {},
    aacCustom: [],
    motor: { size: "xl", scan: false, scanSeconds: 2, dwell: false, dwellMs: 1500, timeFactor: 0, voice: false },
    reading: { font: "lexend", size: 1.25, lineHeight: 2, letterSpacing: 0.05, tint: "cream", ruler: false },
  };
}

const defaultsFor = (student: StudentProfile) => defaultSettings(student);

function toStudent(user: AuthUser): StudentProfile {
  return {
    ...DEMO_STUDENT,
    id: user.id,
    // A parent sets things up for their child, so lessons address the child.
    name: user.role === "parent" ? (user.child?.name ?? user.name) : user.name,
    age: user.child?.age ?? DEMO_STUDENT.age,
  };
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] = useState<Settings>(() => defaultsFor(DEMO_STUDENT));
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [dbError, setDbError] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechState>({ status: "idle", currentId: null });
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const progressRef = useRef(progress);
  const lastSavedSettings = useRef<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const supports = useMemo(() => settings.supports ?? ALL_SLUGS, [settings.supports]);
  const student = useMemo(() => (user ? toStudent(user) : DEMO_STUDENT), [user]);
  const reportDb = useCallback((e: unknown) => {
    console.error("[ilumo] database error:", e);
    setDbError("We couldn't reach the database, so your latest changes may not be saved.");
  }, []);

  // Load the signed-in user's data. No session means back to the login page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        const back = window.location.pathname + window.location.search;
        return router.replace(`/login?next=${encodeURIComponent(back)}`);
      }
      const u = session.user;
      try {
        const [profile, ls, pr] = await Promise.all([db.loadProfile(u.id), db.loadLessons(u.id), db.loadProgress(u.id)]);
        if (cancelled) return;
        const me: AuthUser = {
          id: u.id,
          email: u.email ?? profile?.email ?? "",
          name: profile?.name ?? (u.user_metadata?.name as string) ?? "Learner",
          role: profile?.role ?? "student",
          child: profile?.child ?? null,
        };
        const base = defaultsFor(toStudent(me));
        const saved = profile?.settings && typeof profile.settings === "object" ? (profile.settings as Partial<Settings>) : {};
        const merged: Settings = {
          ...base,
          ...saved,
          captions: { ...base.captions, ...saved.captions },
          motor: { ...base.motor, ...saved.motor },
          reading: { ...base.reading, ...saved.reading },
          signVideos: { ...base.signVideos, ...saved.signVideos },
          gameStars: { ...base.gameStars, ...saved.gameStars },
          gameStreak: { ...base.gameStreak, ...saved.gameStreak },
          aacCustom: Array.isArray(saved.aacCustom) ? saved.aacCustom : base.aacCustom,
        };
        // A child aged 5 to 10 gets the Explore shelf unless they or a parent switched it off.
        if (saved.explore === undefined && me.child && me.child.age >= 5 && me.child.age <= 10) merged.explore = true;
        const own = normalizeSupports(saved.supports);
        merged.supports = own.length ? own : normalizeSupports(profile?.child?.needs).length ? normalizeSupports(profile?.child?.needs) : null;
        lastSavedSettings.current = JSON.stringify(merged);
        setUser(me);
        setSettings(merged);
        setLessons(ls);
        progressRef.current = pr;
        setProgress(pr);
      } catch (e) {
        if (cancelled) return;
        // Signed in but the tables aren't reachable: keep the app usable for this session.
        setUser({ id: u.id, email: u.email ?? "", name: (u.user_metadata?.name as string) ?? "Learner", role: (u.user_metadata?.role as Role) ?? "student", child: null });
        reportDb(e);
      }
      setSpeechAvailable(speechSupported());
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, reportDb]);

  // Save accessibility settings (debounced) once they differ from what's stored.
  useEffect(() => {
    if (!ready || !user) return;
    const json = JSON.stringify(settings);
    if (json === lastSavedSettings.current) return;
    const t = setTimeout(() => {
      lastSavedSettings.current = json;
      db.saveSettings(user.id, settings).catch(reportDb);
    }, 600);
    return () => clearTimeout(t);
  }, [ready, user, settings, reportDb]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  // Reflect settings on <html> so CSS can react to them.
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.textSize = settings.textSize;
    el.dataset.contrast = settings.highContrast ? "high" : "normal";
    el.dataset.keys = settings.keyboardHints ? "on" : "off";
    return () => {
      delete el.dataset.textSize;
      delete el.dataset.contrast;
      delete el.dataset.keys;
    };
  }, [settings.textSize, settings.highContrast, settings.keyboardHints]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  );
  const stepTextSize = useCallback(
    (dir: 1 | -1) =>
      setSettings((s) => {
        const i = Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(s.textSize) + dir));
        return { ...s, textSize: SIZES[i] };
      }),
    [],
  );

  const saveLesson = useCallback(
    (lesson: Lesson) => {
      setLessons((ls) => [lesson, ...ls.filter((l) => l.id !== lesson.id)]);
      if (user) db.insertLesson(user.id, lesson).catch(reportDb);
    },
    [user, reportDb],
  );
  const getLesson = useCallback((id: string) => lessons.find((l) => l.id === id), [lessons]);

  // Update progress in memory right away and write it to the database shortly after.
  const commitProgress = useCallback(
    (lessonId: string, next: Progress) => {
      progressRef.current = { ...progressRef.current, [lessonId]: next };
      setProgress(progressRef.current);
      clearTimeout(timers.current[lessonId]);
      timers.current[lessonId] = setTimeout(() => {
        if (user) db.upsertProgress(user.id, lessonId, progressRef.current[lessonId]).catch(reportDb);
      }, 600);
    },
    [user, reportDb],
  );
  const markSectionRead = useCallback(
    (lessonId: string, index: number) => {
      const cur = progressRef.current[lessonId];
      if (cur?.sectionsRead.includes(index)) return;
      commitProgress(lessonId, { ...cur, sectionsRead: [...(cur?.sectionsRead ?? []), index], updatedAt: new Date().toISOString() });
    },
    [commitProgress],
  );
  const saveQuizResult = useCallback(
    (lessonId: string, answers: (string | null)[], feedback: QuizFeedback) => {
      const cur = progressRef.current[lessonId];
      commitProgress(lessonId, { ...cur, sectionsRead: cur?.sectionsRead ?? [], quiz: { answers, feedback }, updatedAt: new Date().toISOString() });
    },
    [commitProgress],
  );

  // Progress = sections read + the quiz, out of (sections + 1).
  const lessonProgress = useCallback(
    (lesson: Lesson) => {
      const p = progress[lesson.id];
      if (!p) return 0;
      const done = Math.min(p.sectionsRead.length, lesson.sections.length) + (p.quiz ? 1 : 0);
      return Math.round((done / (lesson.sections.length + 1)) * 100);
    },
    [progress],
  );

  // ---- Read aloud -------------------------------------------------------
  const queueRef = useRef<ReadItem[] | null>(null);
  const runId = useRef(0);

  const stopQueue = useCallback(() => {
    runId.current++;
    stopSpeech();
    setSpeech({ status: "idle", currentId: null });
  }, []);

  const rateRef = useRef(1);
  const listRef = useRef<ReadItem[]>([]);
  const indexRef = useRef(0);
  useEffect(() => {
    rateRef.current = settings.speechRate;
  }, [settings.speechRate]);

  const playQueue = useCallback(
    (items?: ReadItem[], startAt = 0) => {
      let queue = items ?? queueRef.current;
      if (!queue?.length) {
        const text = document.getElementById("main")?.innerText?.trim();
        queue = text ? [{ id: "page", text }] : [];
      }
      if (!queue.length) return;
      stopSpeech();
      const run = ++runId.current;
      const list = queue;
      listRef.current = list;
      const next = (i: number) => {
        if (run !== runId.current) return;
        if (i >= list.length) return setSpeech({ status: "idle", currentId: null });
        indexRef.current = i;
        setSpeech({ status: "playing", currentId: list[i].id });
        speakText(list[i].text, {
          rate: rateRef.current,
          onEnd: () => next(i + 1),
          onError: () => run === runId.current && setSpeech({ status: "idle", currentId: null }),
        });
      };
      next(Math.max(0, Math.min(list.length - 1, startAt)));
    },
    [],
  );

  const setSpeechRate = useCallback(
    (rate: number) => {
      rateRef.current = rate;
      setSettings((s) => ({ ...s, speechRate: rate }));
      // The browser can't change speed mid-sentence, so restart the current item.
      if (speech.status === "playing") playQueue(listRef.current, indexRef.current);
    },
    [speech.status, playQueue],
  );

  const pauseQueue = useCallback(() => {
    pauseSpeech();
    setSpeech((s) => (s.status === "playing" ? { ...s, status: "paused" } : s));
  }, []);
  const resumeQueue = useCallback(() => {
    resumeSpeech();
    setSpeech((s) => (s.status === "paused" ? { ...s, status: "playing" } : s));
  }, []);

  const speakOne = useCallback((id: string, text: string, onEnd?: () => void, onFail?: () => void) => {
    stopSpeech();
    const run = ++runId.current;
    setSpeech({ status: "playing", currentId: id });
    const done = () => {
      if (run !== runId.current) return; // something newer took over
      setSpeech({ status: "idle", currentId: null });
      onEnd?.();
    };
    const failed = () => {
      if (run !== runId.current) return;
      setSpeech({ status: "idle", currentId: null });
      onFail?.(); // e.g. the browser refused to speak before the page was touched
    };
    speakText(text, { rate: rateRef.current, onEnd: done, onError: failed });
  }, []);

  const registerReadables = useCallback((items: ReadItem[] | null) => {
    queueRef.current = items;
  }, []);

  // Never keep talking after the student leaves the app.
  useEffect(() => () => void stopSpeech(), []);

  const value = useMemo<Ctx>(
    () => ({
      ready, user: user!, signOut, dbError, student, settings, supports, updateUser, updateSettings, stepTextSize, lessons, progress, saveLesson, getLesson,
      markSectionRead, saveQuizResult, lessonProgress, speech, speechAvailable, registerReadables,
      playQueue, setSpeechRate, pauseQueue, resumeQueue, stopQueue, speakOne,
    }),
    [ready, user, signOut, dbError, student, settings, supports, updateUser, updateSettings, stepTextSize, lessons, progress, saveLesson, getLesson,
      markSectionRead, saveQuizResult, lessonProgress, speech, speechAvailable, registerReadables,
      playQueue, setSpeechRate, pauseQueue, resumeQueue, stopQueue, speakOne],
  );

  if (!ready || !user) {
    return (
      <div role="status" className="grid min-h-screen flex-1 place-items-center bg-canvas text-lg font-semibold text-brand-deep">
        Loading your learning space...
      </div>
    );
  }
  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}
