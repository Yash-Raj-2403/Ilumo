// Short awareness posts. They are written to be accurate and respectful: no cures, no myths,
// no invented statistics. Where a number is mentioned it is worded as an estimate.

export type BlogPost = {
  slug: string;
  emoji: string;
  title: string;
  kicker: string;
  teaser: string;
  /** Tailwind classes for the card colour. */
  tint: string;
  read: string;
  intro: string;
  sections: { heading: string; body: string }[];
  facts: string[];
  ally: string[];
  /** The ILUMO support that goes with this post. */
  support?: { label: string; href: string };
};

export const POSTS: BlogPost[] = [
  {
    slug: "autism",
    emoji: "🧩",
    title: "Autism: a different way of experiencing the world",
    kicker: "Autism",
    teaser: "Autism is not an illness. It is a natural difference in how a brain takes in the world.",
    tint: "bg-tint-yellow",
    read: "3 min read",
    intro:
      "Autistic people think, communicate and sense the world in their own ways. Autism is a spectrum, which does not mean “a little” or “a lot”. It means every autistic person has a different mix of strengths and challenges.",
    sections: [
      {
        heading: "What it can look like",
        body: "Many autistic people love routines and clear plans, notice small details others miss, and have deep interests they can talk about for hours. Some find eye contact tiring, or read tone of voice differently. Sounds, lights, textures and crowds can feel much louder or brighter than they do to other people.",
      },
      {
        heading: "What helps in learning",
        body: "Predictable steps, one task at a time, clear and literal instructions, visual schedules, calm spaces, and time to finish. A surprise change is easier when it is announced early.",
      },
      {
        heading: "What autism is not",
        body: "It is not caused by bad parenting or by vaccines, it is not something a person “grows out of”, and it does not mean someone cannot feel empathy. Many autistic people care deeply and show it in their own way.",
      },
    ],
    facts: ["Autism is lifelong and every autistic person is different.", "Sensory differences are very common.", "Routine and clear structure often make learning easier."],
    ally: ["Say what you mean plainly.", "Give a heads-up before changes.", "Offer a quiet place without making it a big deal."],
    support: { label: "Try Autism & Neurodivergence support", href: "/student/support/autism" },
  },
  {
    slug: "adhd",
    emoji: "⚡",
    title: "ADHD: it's not laziness, it's how attention works",
    kicker: "ADHD",
    teaser: "People with ADHD are not lazy or careless. Their brains manage attention and energy differently.",
    tint: "bg-tint-pink",
    read: "3 min read",
    intro:
      "ADHD (attention-deficit/hyperactivity disorder) affects how a person starts tasks, holds attention, manages time and controls impulses. It is a neurodevelopmental difference, and it has nothing to do with intelligence or effort.",
    sections: [
      {
        heading: "What it can look like",
        body: "Some people with ADHD find it very hard to start or finish boring tasks but can focus for hours on something they find exciting. Others feel restless inside, lose things, or forget instructions. Some are very energetic and creative, and many are great in a crisis.",
      },
      {
        heading: "What helps in learning",
        body: "Short chunks with a clear finish line, movement breaks, timers and checklists, quiet or low-distraction spaces, and quick feedback. Breaking a big task into a first tiny step is often the key.",
      },
      {
        heading: "Common myths",
        body: "ADHD is not caused by too much sugar or screen time, and it is not just about boys or children. Many adults have it too, and girls and women are often noticed much later.",
      },
    ],
    facts: ["ADHD is about regulating attention, not lacking it.", "Interest can create intense focus, called hyperfocus.", "Structure and breaks help more than telling someone to try harder."],
    ally: ["Break big jobs into small steps.", "Give reminders kindly, without sighing.", "Celebrate progress, not just perfect results."],
    support: { label: "Explore focus-friendly learning", href: "/student/support/autism" },
  },
  {
    slug: "dyslexia",
    emoji: "📖",
    title: "Dyslexia: smart minds, different reading roads",
    kicker: "Dyslexia",
    teaser: "Dyslexia makes reading and spelling harder. It says nothing about how clever someone is.",
    tint: "bg-tint-blue",
    read: "3 min read",
    intro:
      "Dyslexia is a learning difference that mainly affects reading, spelling and connecting letters to sounds. It is common: many estimates suggest up to about one person in ten has some form of it.",
    sections: [
      {
        heading: "What it can look like",
        body: "Words can be slow to decode, letters can seem to swap places, and spelling may not stick even after lots of practice. Many people with dyslexia are excellent at big-picture thinking, storytelling, building things and solving problems.",
      },
      {
        heading: "What helps in learning",
        body: "Hearing text read aloud, clear spacing and easy-to-read fonts, softer background colours, short sentences, phonics practice that links sounds to letters, and extra time. Repeating a skill in small, friendly steps works well.",
      },
      {
        heading: "What dyslexia is not",
        body: "It is not caused by poor eyesight, laziness or low intelligence. It is not fixed by reading more of the same thing. It needs the right support.",
      },
    ],
    facts: ["Dyslexia is about reading and spelling, not intelligence.", "Read-aloud and spacing changes help many people.", "Early, patient support makes a real difference."],
    ally: ["Never make someone read aloud unprepared.", "Offer audio and shorter text.", "Praise effort and ideas, not just spelling."],
    support: { label: "Try Learning Disabilities support", href: "/student/support/learning" },
  },
  {
    slug: "blind-low-vision",
    emoji: "👁️",
    title: "Blind and low vision: seeing the world through other tools",
    kicker: "Blind & Low Vision",
    teaser: "Most people who are blind can see a little. Many use sound, touch and technology every day.",
    tint: "bg-tint-green",
    read: "3 min read",
    intro:
      "“Blind” covers a wide range. Some people see nothing at all, but many have some sight: blurry, patchy, very narrow, or only light and shadow. “Low vision” means sight that glasses cannot fully correct.",
    sections: [
      {
        heading: "What people use",
        body: "Screen readers that speak text aloud, braille on paper or on refreshable displays, magnification, high-contrast colours, white canes and guide dogs, and a lot of good memory and planning.",
      },
      {
        heading: "What helps in learning",
        body: "Text that a screen reader can read, clear descriptions of pictures and diagrams, large text and strong contrast, materials in braille, and keyboard or voice control instead of a mouse.",
      },
      {
        heading: "Good manners",
        body: "Say your name when you speak, ask before helping, and describe rather than point. Pictures without descriptions are locked doors for a screen reader user.",
      },
    ],
    facts: ["Blindness is a spectrum, and many blind people have some vision.", "Braille is a real literacy tool, not just a symbol.", "Good image descriptions help everyone."],
    ally: ["Add descriptions to important images.", "Do not grab a person's arm or cane.", "Read important signs and menus aloud if asked."],
    support: { label: "Try Blind & Low Vision support", href: "/student/support/blind-low-vision" },
  },
  {
    slug: "deaf-hoh",
    emoji: "👂",
    title: "Deaf and hard of hearing: it is about communication, not silence",
    kicker: "Deaf & Hard of Hearing",
    teaser: "Sign languages are full languages, and captions are a right, not a favour.",
    tint: "bg-tint-purple",
    read: "3 min read",
    intro:
      "People who are Deaf or hard of hearing hear in many different ways, from a little to none. Some use hearing aids or implants, some use sign language, some use lip-reading and writing, and many mix these.",
    sections: [
      {
        heading: "Sign languages",
        body: "Sign languages such as ASL and BSL are complete languages with their own grammar. They are not the same everywhere, and they are not just gestures for English. For many Deaf people a sign language is their first language, and written English can feel like a second one.",
      },
      {
        heading: "What helps in learning",
        body: "Accurate captions and transcripts, short and clear written instructions, visual alerts in place of beeps, and seeing the speaker's face. Live captions in group talks make a big difference.",
      },
      {
        heading: "Common myths",
        body: "Lip-reading only captures part of speech, so it is never a full substitute for captions. Talking louder does not help, and Deaf people are not less intelligent.",
      },
    ],
    facts: ["Sign languages are real languages with their own grammar.", "Lip-reading catches only part of what is said.", "Captions help many people, not only Deaf ones."],
    ally: ["Face the person and speak normally.", "Turn on captions by default.", "Get attention with a wave or tap, not a shout."],
    support: { label: "Try Deaf & Hard of Hearing support", href: "/student/support/deaf-hoh" },
  },
  {
    slug: "speech",
    emoji: "💬",
    title: "Non-speaking and speech differences: everyone has something to say",
    kicker: "Speech",
    teaser: "Not speaking is not the same as having nothing to say. AAC gives people a voice.",
    tint: "bg-tint-pink",
    read: "3 min read",
    intro:
      "Some people speak a little, some speak with difficulty, and some do not speak at all. Their thoughts and feelings are just as rich. AAC (augmentative and alternative communication) is any way of communicating beyond speech.",
    sections: [
      {
        heading: "What AAC can be",
        body: "Picture boards, symbol cards, letter boards, tablets that speak, sign, gestures and eye pointing. High-tech and low-tech both count, and most people use a mix.",
      },
      {
        heading: "What helps in learning",
        body: "Questions that can be answered by tapping, choosing or typing, plenty of time to respond, no pressure to speak, and a communication tool that is always within reach.",
      },
      {
        heading: "How to talk with someone who uses AAC",
        body: "Wait. Give them time to build their message. Talk to the person, not over their head. Ask open questions and offer choices, and never finish their sentences unless they ask you to.",
      },
    ],
    facts: ["AAC is communication, not a last resort.", "Understanding language and speaking are different skills.", "Extra time is one of the most useful supports."],
    ally: ["Be patient and wait for the answer.", "Speak to the person directly.", "Learn how they say yes and no."],
    support: { label: "Try Speech & Non-speaking support", href: "/student/support/speech" },
  },
  {
    slug: "motor",
    emoji: "♿",
    title: "Physical and motor disabilities: access is about options",
    kicker: "Motor",
    teaser: "Some people cannot use a mouse or tap precisely. Give them a way in that fits their body.",
    tint: "bg-tint-blue",
    read: "3 min read",
    intro:
      "Motor disabilities affect movement, strength or control. They can come from conditions such as cerebral palsy, muscular dystrophy, spinal injuries, tremors or arthritis. Someone may use a wheelchair, or find fine movements very hard, or get tired quickly.",
    sections: [
      {
        heading: "How people use computers",
        body: "Keyboards, single-switch buttons, head or eye tracking, voice control, big buttons, and software that scans through choices one by one until you press your switch.",
      },
      {
        heading: "What helps in learning",
        body: "Big, well-spaced buttons, no dragging or tiny targets, full keyboard use, plenty of time before anything times out, and voice control. Fewer steps means less effort.",
      },
      {
        heading: "Small things matter",
        body: "A timer that cannot be extended can end someone's quiz for reasons that have nothing to do with knowledge. Being generous with time is a form of fairness.",
      },
    ],
    facts: ["Many people use a switch or voice instead of a mouse.", "Fatigue is real, so fewer clicks helps.", "Extra time is fair, not special treatment."],
    ally: ["Never rush someone.", "Choose big, spaced-out buttons.", "Make everything work from a keyboard."],
    support: { label: "Try Physical & Motor support", href: "/student/support/motor" },
  },
  {
    slug: "neurodiversity",
    emoji: "🌈",
    title: "Neurodiversity: every mind belongs in the classroom",
    kicker: "Neurodiversity",
    teaser: "Brains differ, just like bodies do. Learning works best when it bends to fit people.",
    tint: "bg-tint-yellow",
    read: "2 min read",
    intro:
      "Neurodiversity is the idea that natural differences in how brains work, such as autism, ADHD and dyslexia, are part of human variety. It does not deny that people can need help. It says the answer is support and acceptance, not trying to make everyone the same.",
    sections: [
      {
        heading: "Why it matters",
        body: "When a classroom only works one way, people who learn differently are told they are the problem. When a lesson can be read, heard, seen, captioned and chunked, more people can join in, and everyone gains from it.",
      },
      {
        heading: "Universal design",
        body: "Curb cuts were built for wheelchairs and help everyone with a suitcase or a pram. Captions were built for Deaf viewers and help anyone in a noisy room. Accessible learning works the same way.",
      },
      {
        heading: "What ILUMO does",
        body: "ILUMO adapts one lesson to many needs: captions, read-aloud, braille, symbols, flashcards, simpler words and more time. Nobody should have to prove they deserve to learn.",
      },
    ],
    facts: ["Differences are part of human variety.", "Support helps most when it is offered without fuss.", "Design for the edges and everyone benefits."],
    ally: ["Ask what helps, don't assume.", "Offer choices in how to show learning.", "Treat access as normal, not extra."],
    support: { label: "See all the ways ILUMO can help", href: "/#features" },
  },
];

export const findPost = (slug: string) => POSTS.find((p) => p.slug === slug);
