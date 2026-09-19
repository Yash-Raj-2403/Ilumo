import type { Metadata } from "next";
import { GamePlayer } from "@/components/student/games/game-player";
import { findGame, GAMES } from "@/components/student/games/catalog";

export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/student/games/[game]">): Promise<Metadata> {
  const { game } = await params;
  return { title: findGame(game)?.title ?? "Game Zone" };
}

export default async function GamePage({ params }: PageProps<"/student/games/[game]">) {
  const { game } = await params;
  return <GamePlayer id={game} />;
}
