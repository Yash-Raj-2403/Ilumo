"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { ArrowRight, Brain, Eye, GraduationCap, Heart, LayoutDashboard, Mic, Sparkles, Users, Volume2 } from "lucide-react";
import { useAuthSession } from "@/lib/supabase/use-session";
import { useMyProfile } from "@/lib/supabase/use-supports";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { SquigglyText } from "@/components/ui/squiggly-text";

const gradientText =
  "bg-gradient-to-r from-[#5b4df5] via-[#c2559f] to-[#e0704a] bg-clip-text text-transparent";

function UniqueWay() {
  const reduce = useReducedMotion();
  const text = <span className={`inline-block pb-2 ${gradientText}`}>Unique Way</span>;
  if (reduce) return text;
  return (
    <SquigglyText scale={[3, 4]} baseFrequency={0.03} stepDuration={110}>
      {text}
    </SquigglyText>
  );
}

const badges = [
  { title: "Listen", href: "/student/support/blind-low-vision", sub: "instead of just read", icon: Volume2, bg: "bg-tint-blue", ring: "bg-blue-100 text-blue-600", pos: "sm:left-[-2%] sm:top-[3%]", z: 110, delay: "0s", rot: "sm:-rotate-3" },
  { title: "See", href: "/student/support/blind-low-vision", sub: "with clearer details", icon: Eye, bg: "bg-tint-green", ring: "bg-emerald-100 text-emerald-600", pos: "sm:right-[-2%] sm:top-[8%]", z: 90, delay: "1.2s", rot: "sm:rotate-3" },
  { title: "Speak", href: "/student/support/speech", sub: "and be heard", icon: Mic, bg: "bg-tint-pink", ring: "bg-rose-100 text-rose-500", pos: "sm:bottom-[17%] sm:left-[-4%]", z: 120, delay: "2.1s", rot: "sm:-rotate-3" },
  { title: "Learn", href: "/student/support/autism", sub: "without limits", icon: Brain, bg: "bg-tint-purple", ring: "bg-violet-100 text-violet-600", pos: "sm:bottom-[24%] sm:right-[-3%]", z: 100, delay: "0.6s", rot: "sm:rotate-3" },
];

export function Hero() {
  // People who are already signed in are not asked who they are again: they get their dashboard.
  const { signedIn } = useAuthSession();
  const { role } = useMyProfile();
  return (
    <section id="home" className="relative isolate scroll-mt-24 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_20%,#ece8fb_0%,transparent_70%),radial-gradient(40%_40%_at_0%_0%,#fff1e6_0%,transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 md:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-8 lg:pb-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand">
            <Sparkles className="size-4" aria-hidden /> Inclusive Learning for a Brighter Tomorrow
          </p>
          <h1 className="mt-6 text-[2.75rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-7xl">
            Every Mind Learns
            <br />
            in a <UniqueWay />
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-body">
            ILUMO is an AI-powered inclusive learning platform that adapts educational content to your needs — with
            audio, visual, speech and cognitive support. Because learning should have no limits.
          </p>
          <div className="mt-9 flex min-h-[4.25rem] flex-wrap gap-4">
            {signedIn === true ? (
              <Link
                href={role === "parent" ? "/parent" : "/student"}
                className="group inline-flex items-center gap-3 rounded-full bg-brand-deep px-7 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(37,29,107,0.3)] transition motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1450]"
              >
                <LayoutDashboard className="size-5" aria-hidden /> Continue to my dashboard
                <ArrowRight className="size-5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
              </Link>
            ) : signedIn === false ? (
              <>
            <Link
                  href="/student"
                  className="group inline-flex items-center gap-3 rounded-full bg-brand-deep px-7 py-4 text-base font-semibold text-white shadow-[0_14px_30px_rgba(37,29,107,0.3)] transition motion-safe:hover:-translate-y-0.5 hover:bg-[#1a1450]"
                >
                  <GraduationCap className="size-5" aria-hidden /> I&apos;m a Student
                  <ArrowRight className="size-5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
                </Link>
                <Link
                  href="/signup?role=parent"
                  className="group inline-flex items-center gap-3 rounded-full border-2 border-brand-deep/70 bg-white px-7 py-4 text-base font-semibold text-brand-deep transition motion-safe:hover:-translate-y-0.5 hover:bg-brand-soft"
                >
                  <Users className="size-5" aria-hidden /> I&apos;m a Parent
                  <ArrowRight className="size-5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
                </Link>
              </>
            ) : null}
          </div>
          <p className="mt-10 inline-flex items-center gap-2 font-hand text-2xl text-ink/80">
            <span className="relative">
              Different abilities. Brighter futures.
              <svg aria-hidden viewBox="0 0 240 10" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none">
                <path d="M2 7c50-6 130-6 236-2" fill="none" stroke="#f5b542" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            <Heart className="size-5 fill-rose-500 text-rose-500" aria-hidden />
          </p>
        </div>

        <div className="mx-auto w-full max-w-[540px]">
          <CardContainer containerClassName="!py-0" className="w-full">
            <CardBody className="relative h-auto w-full sm:aspect-[14/15]">
              <div className="relative h-[330px] [transform-style:preserve-3d] sm:absolute sm:inset-0 sm:h-auto">
                <CardItem translateZ={10} className="absolute inset-0 !w-full h-full">
                  <div aria-hidden className="absolute left-[14%] top-[8%] h-[78%] w-[72%] rounded-[62%_38%_55%_45%/48%_58%_42%_52%] bg-gradient-to-br from-[#e6e0ff] via-[#dfe9ff] to-[#ffe4ef]" />
                  <div aria-hidden className="absolute right-[6%] top-[22%] h-[38%] w-[26%] rounded-[50%_50%_45%_55%/60%_55%_45%_40%] bg-[#ffe7b0]/80" />
                  <div aria-hidden className="absolute right-[10%] top-[8%] h-[24%] w-[30%] rounded-[55%_45%_50%_50%] bg-[#d9f3d6]/90" />
                  <div aria-hidden className="absolute bottom-[8%] left-[4%] h-[28%] w-[30%] rounded-[50%_50%_60%_40%/55%_45%_55%_45%] bg-[#d6f2e0]" />
                  <div aria-hidden className="absolute bottom-[6%] right-[3%] h-[26%] w-[28%] rounded-[55%_45%_50%_50%] bg-[#ffe1cc]/90" />
                  <svg aria-hidden viewBox="0 0 60 70" className="absolute left-[2%] top-[36%] hidden w-[11%] sm:block">
                    <g stroke="#ffc933" strokeWidth="4" strokeLinecap="round" fill="none">
                      <path d="M28 6l3 10M8 20l9 5M6 44l9-4M14 62l6-9M50 30a14 14 0 1 0-8 19" />
                    </g>
                  </svg>
                </CardItem>

                <CardItem translateZ={60} className="absolute bottom-0 left-1/2 w-[64%] -translate-x-1/2 sm:w-[66%]">
                  <Image
                    src="/images/ilumo-child.png"
                    alt="A smiling child in a mustard sweater resting their chin on their hands, looking up happily"
                    width={710}
                    height={830}
                    priority
                    sizes="(min-width:1024px) 360px, 60vw"
                    className="h-auto w-full [mask-image:linear-gradient(to_bottom,#000_86%,transparent_100%)]"
                  />
                </CardItem>
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-3 sm:contents">
                {badges.map(({ title, sub, icon: Icon, bg, ring, pos, z, delay, rot, href }) => {
                  const card = (
                  <div
                        style={{ animationDelay: delay }}
                        className={`flex items-center gap-2.5 rounded-2xl border border-white/80 ${bg} p-2.5 shadow-[0_12px_30px_rgba(60,40,120,0.14)] backdrop-blur-sm motion-safe:animate-float sm:gap-3 sm:rounded-3xl sm:p-3.5 ${rot}`}
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full sm:size-11 ${ring}`}>
                          <Icon className="size-4 sm:size-5" aria-hidden />
                        </span>
                        <span className="leading-tight">
                          <span className="block text-base font-bold text-ink sm:text-lg">{title}</span>
                          <span className="block text-xs text-body sm:text-sm">{sub}</span>
                        </span>
                      </div>
                  );
                  return (
                  <li key={title} className="contents">
                    <CardItem translateZ={z} className={`sm:absolute ${pos} sm:w-[46%] w-full`}>
                      {href ? (
                        <Link href={href} aria-label={`${title} ${sub}: try it`} className="block rounded-3xl transition motion-safe:hover:scale-105">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </CardItem>
                  </li>
                  );
                })}
              </ul>
            </CardBody>
          </CardContainer>
        </div>
      </div>
    </section>
  );
}
