import type { Metadata } from "next";
import { GameZone } from "@/components/student/games/game-zone";

export const metadata: Metadata = { title: "Game Zone" };

export default function GamesPage() {
  return <GameZone />;
}
