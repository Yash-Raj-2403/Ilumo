import { redirect } from "next/navigation";

// Explore now lives inside the Game Zone, under the Learn tab.
export default function ExplorePage() {
  redirect("/student/games#learn");
}
