// Ready-made basics for children aged 5 to 10. Fixed, checked wording: no AI needed, works offline.
import type { LessonContent } from "@/lib/lesson-types";

export type ExploreTopic = {
  slug: string;
  emoji: string;
  card: string; // Tailwind tint class
  blurb: string;
  /** The picture strip shown in the lesson: each item has a label so it never depends on colour or emoji alone. */
  pictures: { e: string; label: string }[];
  content: LessonContent;
};

const q = (question: string, options: string[], correctAnswer: string, explanation: string) => ({ question, options, correctAnswer, explanation });

export const EXPLORE_TOPICS: ExploreTopic[] = [
  {
    slug: "letters",
    emoji: "🔤",
    card: "bg-tint-yellow",
    blurb: "Letters and the sounds they make",
    pictures: [{ e: "🍎", label: "apple" }, { e: "🐝", label: "bee" }, { e: "🐱", label: "cat" }, { e: "🐶", label: "dog" }],
    content: {
      title: "Letters and Sounds",
      summary: "Words are made of letters. Each letter has a name and a sound. A is for apple. B is for bee.",
      sections: [
        { heading: "Letters make words", content: "The alphabet has 26 letters. We put letters together to make words." },
        { heading: "Every letter has a sound", content: "The letter A says a, like in apple. The letter B says b, like in bee. The letter C says k, like in cat. The letter D says d, like in dog." },
        { heading: "Say it slowly", content: "To read the word cat, say each sound slowly: c, a, t. Then say them fast together: cat." },
      ],
      keyPoints: ["There are 26 letters.", "Every letter has a sound.", "Sounds put together make a word."],
      visualDescriptions: [{ title: "Four letter pictures", description: "Four pictures in a row. A red apple for A. A bee with wings for B. A cat sitting down for C. A dog with a wagging tail for D." }],
      importantTerms: [{ term: "Letter", meaning: "A mark we use to write. There are 26." }, { term: "Sound", meaning: "What a letter says when we read it." }],
      quiz: [
        q("Which letter is for apple?", ["A", "B", "D"], "A", "Apple starts with the letter A."),
        q("How many letters are in the alphabet?", ["10", "26", "50"], "26", "The alphabet has 26 letters."),
        q("What do we make when we put sounds together?", ["A word", "A song", "A shape"], "A word", "Sounds put together make a word."),
      ],
    },
  },
  {
    slug: "numbers",
    emoji: "🔢",
    card: "bg-tint-blue",
    blurb: "Counting and simple adding",
    pictures: [{ e: "⭐", label: "1 star" }, { e: "⭐⭐", label: "2 stars" }, { e: "⭐⭐⭐", label: "3 stars" }, { e: "⭐⭐⭐⭐", label: "4 stars" }],
    content: {
      title: "Numbers and Counting",
      summary: "Numbers tell us how many. We count one thing at a time. Adding means putting groups together.",
      sections: [
        { heading: "Counting", content: "Point at each thing and say a number. One, two, three, four, five. The last number you say is how many there are." },
        { heading: "More and fewer", content: "A group with more things has a bigger number. Four stars is more than two stars." },
        { heading: "Adding", content: "Adding means putting groups together. Two stars and one star make three stars. We write it like this: 2 + 1 = 3." },
      ],
      keyPoints: ["Count one thing at a time.", "The last number is how many.", "Adding puts groups together."],
      visualDescriptions: [{ title: "Stars to count", description: "Four rows of yellow stars. The first row has one star. The second has two. The third has three. The fourth has four." }],
      importantTerms: [{ term: "Count", meaning: "Saying numbers in order to find out how many." }, { term: "Add", meaning: "Put groups together to make a bigger group." }],
      quiz: [
        q("What is 2 + 1?", ["2", "3", "4"], "3", "Two and one more make three."),
        q("Which is more: 4 stars or 2 stars?", ["4 stars", "2 stars", "They are the same"], "4 stars", "Four is bigger than two."),
        q("What does adding mean?", ["Putting groups together", "Taking things away", "Hiding things"], "Putting groups together", "Adding puts groups together."),
      ],
    },
  },
  {
    slug: "colours-shapes",
    emoji: "🎨",
    card: "bg-tint-pink",
    blurb: "Colours and shapes all around us",
    pictures: [{ e: "🔴", label: "red circle" }, { e: "🟦", label: "blue square" }, { e: "🔺", label: "red triangle" }, { e: "🟡", label: "yellow circle" }],
    content: {
      title: "Colours and Shapes",
      summary: "Things around us have colours and shapes. A ball is a circle. A book is a rectangle. Some shapes have corners.",
      sections: [
        { heading: "Colours", content: "The sun is yellow. Grass is green. The sky is blue on a clear day. An apple can be red." },
        { heading: "Shapes", content: "A circle is round and has no corners. A square has four corners and four sides that are the same. A triangle has three corners and three sides." },
        { heading: "Shapes at home", content: "A plate is a circle. A window is often a square or a rectangle. A slice of pizza looks like a triangle." },
      ],
      keyPoints: ["A circle is round.", "A square has four equal sides.", "A triangle has three corners."],
      visualDescriptions: [{ title: "Shapes and colours", description: "A red circle, a blue square, a red triangle and a yellow circle in a row." }],
      importantTerms: [{ term: "Shape", meaning: "The outline of a thing, like a circle or a square." }, { term: "Corner", meaning: "A pointy place where two sides meet." }],
      quiz: [
        q("How many corners does a triangle have?", ["2", "3", "4"], "3", "A triangle has three corners."),
        q("Which shape is round with no corners?", ["Circle", "Square", "Triangle"], "Circle", "A circle is round and has no corners."),
        q("What shape is a plate?", ["Circle", "Triangle", "Square"], "Circle", "A plate is usually round, like a circle."),
      ],
    },
  },
  {
    slug: "animals",
    emoji: "🐾",
    card: "bg-tint-green",
    blurb: "Animals, where they live and what they eat",
    pictures: [{ e: "🐄", label: "cow" }, { e: "🐟", label: "fish" }, { e: "🐦", label: "bird" }, { e: "🐶", label: "dog" }],
    content: {
      title: "Animals",
      summary: "Animals live in many places. Fish live in water. Birds have wings and feathers. Cows live on farms and eat grass.",
      sections: [
        { heading: "Where animals live", content: "Fish live in water. Birds live in trees and nests. Cows live on farms. Dogs can live with people at home." },
        { heading: "What animals eat", content: "Cows eat grass. Fish eat small water plants and animals. Birds eat seeds, worms and fruit. Dogs eat meat and other food." },
        { heading: "How animals move", content: "Fish swim. Birds fly with their wings. Dogs run on four legs." },
      ],
      keyPoints: ["Fish live in water.", "Birds have wings and can fly.", "Animals need food and water."],
      visualDescriptions: [{ title: "Four animals", description: "A cow, a fish, a bird and a dog, each in a small picture." }],
      importantTerms: [{ term: "Habitat", meaning: "The place where an animal lives." }, { term: "Wings", meaning: "Body parts a bird uses to fly." }],
      quiz: [
        q("Where do fish live?", ["In water", "In a tree", "In a nest"], "In water", "Fish live in water."),
        q("What do birds use to fly?", ["Wings", "Fins", "Paws"], "Wings", "Birds fly with their wings."),
        q("What does a cow eat?", ["Grass", "Fish", "Ice cream"], "Grass", "Cows eat grass."),
      ],
    },
  },
  {
    slug: "my-body",
    emoji: "🧍",
    card: "bg-tint-purple",
    blurb: "My body and my five senses",
    pictures: [{ e: "👀", label: "eyes" }, { e: "👂", label: "ear" }, { e: "👃", label: "nose" }, { e: "👅", label: "tongue" }, { e: "✋", label: "hand" }],
    content: {
      title: "My Body and My Senses",
      summary: "We learn about the world with five senses. We see with eyes, hear with ears, smell with a nose, taste with a tongue and touch with our skin.",
      sections: [
        { heading: "Seeing and hearing", content: "Our eyes help us see colours and shapes. Our ears help us hear sounds, like a bell or a friend talking." },
        { heading: "Smelling and tasting", content: "Our nose helps us smell things, like a flower. Our tongue helps us taste things, like sweet or sour." },
        { heading: "Touching", content: "Our skin helps us feel things. We can feel if something is soft, hard, hot or cold." },
        { heading: "Every body is different", content: "Some people use a wheelchair, glasses, a hearing aid or a communication board. Our bodies work in different ways, and that is okay." },
      ],
      keyPoints: ["We have five senses.", "Eyes see. Ears hear.", "Every body is different, and that is okay."],
      visualDescriptions: [{ title: "The five senses", description: "Five pictures: eyes for seeing, an ear for hearing, a nose for smelling, a tongue for tasting and a hand for touching." }],
      importantTerms: [{ term: "Sense", meaning: "A way our body learns about the world." }, { term: "Skin", meaning: "The covering of our body that helps us feel." }],
      quiz: [
        q("How many senses do we have?", ["3", "5", "10"], "5", "We have five senses."),
        q("What do we use to smell a flower?", ["Nose", "Ears", "Hands"], "Nose", "We smell with our nose."),
        q("Do all bodies work the same way?", ["No, every body is different", "Yes, exactly the same"], "No, every body is different", "Every body is different, and that is okay."),
      ],
    },
  },
  {
    slug: "feelings",
    emoji: "😊",
    card: "bg-tint-yellow",
    blurb: "Feelings, and what helps when they are big",
    pictures: [{ e: "😊", label: "happy" }, { e: "😢", label: "sad" }, { e: "😠", label: "angry" }, { e: "😨", label: "scared" }],
    content: {
      title: "Feelings",
      summary: "Everyone has feelings. Happy, sad, angry and scared are all okay. When a feeling is big, we can do something calm to help.",
      sections: [
        { heading: "Feelings are okay", content: "Happy, sad, angry and scared are all feelings. Every person has them. No feeling is bad." },
        { heading: "Big feelings", content: "Sometimes a feeling is very big. Our body might feel hot, tight or shaky. That is a sign to slow down." },
        { heading: "What can help", content: "We can breathe slowly. Breathe in for four, breathe out for four. We can ask for a hug, use a quiet space or tell a grown-up how we feel." },
        { heading: "Ways to say it", content: "We can say it, point to a picture, write it or draw it. Every way is a good way to share a feeling." },
      ],
      keyPoints: ["All feelings are okay.", "Breathing slowly helps.", "We can tell a grown-up how we feel."],
      visualDescriptions: [{ title: "Four feeling faces", description: "Four round faces. A smiling happy face, a crying sad face, a frowning angry face and a wide-eyed scared face." }],
      importantTerms: [{ term: "Feeling", meaning: "What we feel inside, like happy or sad." }, { term: "Calm", meaning: "Slow and quiet inside." }],
      quiz: [
        q("Is it okay to feel sad?", ["Yes", "No"], "Yes", "All feelings are okay."),
        q("What can help when a feeling is big?", ["Breathe slowly", "Hide", "Shout"], "Breathe slowly", "Slow breathing helps our body feel calm."),
        q("Who can we tell how we feel?", ["A grown-up we trust", "Nobody"], "A grown-up we trust", "Telling a grown-up we trust helps."),
      ],
    },
  },
];

export const findTopic = (slug: string) => EXPLORE_TOPICS.find((t) => t.slug === slug);
