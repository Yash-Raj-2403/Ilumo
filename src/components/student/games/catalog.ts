// The Game Zone: short games for ages 5 to 10. Every game is a set of five questions with kind, instant feedback.
export type GameCategory = "language" | "math" | "science" | "life" | "independence";

export const GAME_TABS: { id: GameCategory; label: string; emoji: string; color: string }[] = [
  { id: "language", label: "Language", emoji: "📖", color: "#bfeee6" },
  { id: "math", label: "Math", emoji: "📐", color: "#ffb3ae" },
  { id: "science", label: "Science", emoji: "🔬", color: "#a8e4ff" },
  { id: "life", label: "Life Skills", emoji: "🛒", color: "#ffdcbf" },
  { id: "independence", label: "Independence Skills", emoji: "🚦", color: "#b0dfe3" },
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
  { id: "rhyme-time", category: "language", title: "Rhyme Time", blurb: "Find the word that rhymes.", how: "You will see a picture and a word. Pick the word that sounds the same at the end, like cat and hat.", emoji: "🎵", card: "bg-[#a9ded4]" },
  { id: "missing-letter", category: "language", title: "Missing Letter", blurb: "Fill in the missing vowel.", how: "A word has one letter missing. Pick the vowel that finishes it, like d _ g for dog.", emoji: "✏️", card: "bg-[#c9f0e9]" },
  { id: "take-away", category: "math", title: "Take Away", blurb: "Subtract by counting what is left.", how: "You will see some fruit and how many to take away. Pick how many are left.", emoji: "🍌", card: "bg-[#ffc9a3]" },
  { id: "shape-finder", category: "math", title: "Shape Finder", blurb: "Name the shape you see.", how: "You will see a shape. Pick its name: circle, square, triangle, star, heart or diamond.", emoji: "🔷", card: "bg-[#ff9f98]" },
  { id: "animal-homes", category: "science", title: "Animal Homes", blurb: "Where does each animal live?", how: "You will see an animal. Pick the place where it lives.", emoji: "🐻", card: "bg-[#c4ecff]" },
  { id: "five-senses", category: "science", title: "Five Senses", blurb: "Which body part do we use?", how: "You will see something to see, hear, smell, taste or touch. Pick the body part we use.", emoji: "👃", card: "bg-[#8fd6f7]" },
  { id: "daily-routine", category: "life", title: "Daily Routine", blurb: "What do we do next?", how: "You will read about a part of the day. Pick what we do.", emoji: "🪥", card: "bg-[#ffd0a8]" },
  { id: "feeling-faces", category: "life", title: "Feeling Faces", blurb: "How does this face feel?", how: "You will see a face. Pick the feeling it shows.", emoji: "😊", card: "bg-[#ffe9d6]" },
  { id: "sound-finder", category: "independence", title: "Sound Finder", blurb: "Which side is the sound on?", how: "Press Play sound and listen, best with headphones. Pick left or right. This game needs hearing, so try another game if the sound is hard to hear.", emoji: "🎧", card: "bg-[#8fcdd3]" },
  { id: "safe-or-not", category: "independence", title: "Safe or Not?", blurb: "Decide what is safe to do.", how: "You will read about something to do. Pick if it is safe or not safe. When something is not safe, tell a grown-up.", emoji: "🛟", card: "bg-[#cdeaed]" },
];

export const findGame = (id: string) => GAMES.find((g) => g.id === id);
