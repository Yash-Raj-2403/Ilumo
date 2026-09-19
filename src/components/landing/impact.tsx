import { Brain, Eye, Heart, Mic, Volume2 } from "lucide-react";

const labels = [
  { name: "Audio", Icon: Volume2, cls: "bg-tint-pink text-rose-600" },
  { name: "Visual", Icon: Eye, cls: "bg-tint-blue text-blue-700" },
  { name: "Speech", Icon: Mic, cls: "bg-tint-green text-emerald-700" },
  { name: "Cognitive", Icon: Brain, cls: "bg-tint-purple text-violet-700" },
];

export function Impact() {
  return (
    <section id="impact" aria-labelledby="impact-heading" className="scroll-mt-24 bg-gradient-to-b from-[#f1eeff] to-[#e9e5fd] py-14">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 id="impact-heading" className="font-hand text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            A more inclusive tomorrow
            <br />
            starts with better learning today.
            <Heart className="ml-2 inline size-5 fill-rose-500 text-rose-500" aria-hidden />
          </h2>
          <p className="mt-3 text-base text-body">Different abilities. Brighter futures.</p>
        </div>
        <ul className="flex flex-wrap justify-center gap-3">
          {labels.map(({ name, Icon, cls }) => (
            <li key={name} className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold ${cls}`}>
              <Icon className="size-4" aria-hidden /> {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
