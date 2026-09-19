import { ArrowRight, Brain, Eye, Mic, Volume2, type LucideIcon } from "lucide-react";

const features: {
  title: string;
  text: string;
  Icon: LucideIcon;
  card: string;
  icon: string;
}[] = [
  { title: "Audio Support", text: "Text-to-speech, audio descriptions and summaries to make learning audible.", Icon: Volume2, card: "bg-tint-pink", icon: "bg-rose-100 text-rose-500" },
  { title: "Visual Support", text: "OCR, alt-text, screen-reader friendly content and detailed graph descriptions.", Icon: Eye, card: "bg-tint-blue", icon: "bg-blue-100 text-blue-600" },
  { title: "Speech Support", text: "Speech-to-text, voice interaction, AAC and accessible assessments.", Icon: Mic, card: "bg-tint-green", icon: "bg-emerald-100 text-emerald-600" },
  { title: "Cognitive Support", text: "Focus mode, content chunking, simplified content and adaptive learning.", Icon: Brain, card: "bg-tint-purple", icon: "bg-violet-100 text-violet-600" },
];

export function Features() {
  return (
    <section aria-labelledby="features-heading" className="relative bg-white/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div id="about" className="mx-auto max-w-2xl scroll-mt-28 text-center">
          <p className="inline-block rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold tracking-wider text-brand">
            OUR FEATURES
          </p>
          <h2 id="features-heading" className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Learning Made Accessible for Everyone
          </h2>
          <p className="mt-3 text-lg text-body">Multiple support systems. One inclusive platform.</p>
        </div>

        <ul id="features" className="mt-12 grid scroll-mt-28 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, text, Icon, card, icon }) => (
            <li key={title}>
              <article
                className={`group flex h-full flex-col rounded-3xl ${card} p-7 transition duration-300 hover:shadow-[0_24px_50px_rgba(60,40,120,0.14)] motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.02]`}
              >
                <span className={`grid size-16 place-items-center rounded-full ${icon}`}>
                  <Icon className="size-8" aria-hidden />
                </span>
                <h3 className="mt-6 text-xl font-bold text-ink">{title}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-body">{text}</p>
                <button
                  type="button"
                  aria-label={`Learn more about ${title}`}
                  className="mt-6 grid size-11 place-items-center rounded-full bg-white text-brand-deep shadow-md transition group-hover:shadow-lg"
                >
                  <ArrowRight className="size-5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
                </button>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
