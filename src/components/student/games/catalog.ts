// The Game Zone: short games for ages 5 to 10. Every game is a set of five questions with kind, instant feedback.
export type GameCategory = "language" | "math" | "science" | "life" | "independence";

export const GAME_TABS: { id: GameCategory; label: string; emoji: string }[] = [
  { id: "language", label: "Language", emoji: "📖" },
  { id: "math", label: "Math", emoji: "📐" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "life", label: "Life Skills", emoji: "🛒" },
  { id: "independence", label: "Independence Skills", emoji: "🚦" },
];

export type Game = {
  id: string;
  category: GameCategory;
  title: string;
  blurb: string;
  how: string;
  emoji: string;
  card: string; // Tailwind background for the coloured top of the card
};

export const GAMES: Game[] = [
  { id: "letter-match", category: "language", title: "Letter Match", blurb: "Which letter does the picture start with?", how: "You will see a picture and hear its name. Pick the letter it starts with.", emoji: "🔤", card: "bg-[#bfeee6]" },
  { id: "fruit-count", category: "math", title: "Fruit Count", blurb: "Add up the fruit by counting!", how: "You will see two groups of fruit. Count them all together and pick the number.", emoji: "🍓", card: "bg-[#ffb3ae]" },
  { id: "matter-sort", category: "science", title: "Matter Sort", blurb: "Is it a solid, a liquid or a gas?", how: "You will see something from everyday life. Pick if it is a solid, a liquid or a gas.", emoji: "🧊", card: "bg-[#a8e4ff]" },
  { id: "coin-shop", category: "life", title: "Coin Shop", blurb: "Pay the right number of coins.", how: "Each thing in the shop has a price in coins. Pick the pile of coins that pays exactly.", emoji: "🪙", card: "bg-[#ffdcbf]" },
  { id: "street-smart", category: "independence", title: "Street Smart", blurb: "Listen, then decide if it is safe to cross.", how: "Press Play sound and listen. Fast beeps mean the walk signal is on. Slow ticks or a rumbling car mean wait. Always cross with a grown-up.", emoji: "🚦", card: "bg-[#b0dfe3]" },
];

export const findGame = (id: string) => GAMES.find((g) => g.id === id);
