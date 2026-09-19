// Symbols for the communication board. They are emoji, so they work everywhere with no image files.

export type Symbol = { emoji: string; label: string };
export type SymbolGroup = { id: string; title: string; tint: string; items: Symbol[] };

export const GROUPS: SymbolGroup[] = [
  {
    id: "core", title: "Everyday words", tint: "bg-tint-yellow",
    items: [
      { emoji: "🙋", label: "I" }, { emoji: "👉", label: "you" }, { emoji: "❤️", label: "want" }, { emoji: "➕", label: "more" },
      { emoji: "🛑", label: "stop" }, { emoji: "🏃", label: "go" }, { emoji: "🆘", label: "help" }, { emoji: "👍", label: "like" },
      { emoji: "🚫", label: "not" }, { emoji: "✅", label: "all done" }, { emoji: "⏳", label: "wait" }, { emoji: "🙏", label: "please" },
    ],
  },
  {
    id: "answers", title: "Yes and no", tint: "bg-tint-green",
    items: [
      { emoji: "✅", label: "yes" }, { emoji: "❌", label: "no" }, { emoji: "🤷", label: "I don't know" }, { emoji: "🔁", label: "say it again" },
      { emoji: "🐢", label: "slow down" }, { emoji: "🙌", label: "thank you" },
    ],
  },
  {
    id: "needs", title: "What I need", tint: "bg-tint-blue",
    items: [
      { emoji: "🥤", label: "a drink" }, { emoji: "🍎", label: "food" }, { emoji: "🚻", label: "the toilet" }, { emoji: "🛋️", label: "a break" },
      { emoji: "🤕", label: "it hurts" }, { emoji: "😴", label: "I'm tired" }, { emoji: "🌡️", label: "I'm too hot" }, { emoji: "🧥", label: "I'm cold" },
    ],
  },
  {
    id: "feelings", title: "How I feel", tint: "bg-tint-pink",
    items: [
      { emoji: "😊", label: "happy" }, { emoji: "😢", label: "sad" }, { emoji: "😠", label: "angry" }, { emoji: "😨", label: "scared" },
      { emoji: "🤩", label: "excited" }, { emoji: "🤢", label: "sick" }, { emoji: "😕", label: "confused" }, { emoji: "😌", label: "calm" },
    ],
  },
  {
    id: "school", title: "At school", tint: "bg-tint-purple",
    items: [
      { emoji: "📖", label: "book" }, { emoji: "✏️", label: "pencil" }, { emoji: "🧑‍🏫", label: "teacher" }, { emoji: "🧑‍🤝‍🧑", label: "friend" },
      { emoji: "📝", label: "write" }, { emoji: "🔊", label: "loud" }, { emoji: "🤫", label: "quiet" }, { emoji: "💡", label: "I understand" },
    ],
  },
];

export const QUICK: Symbol[] = [
  { emoji: "🆘", label: "I need help" },
  { emoji: "😕", label: "I don't understand" },
  { emoji: "🔁", label: "Can you repeat that?" },
  { emoji: "🛋️", label: "I need a break" },
  { emoji: "🙋", label: "I have a question" },
  { emoji: "⏳", label: "Please wait, I'm thinking" },
  { emoji: "✅", label: "Yes" },
  { emoji: "❌", label: "No" },
];
