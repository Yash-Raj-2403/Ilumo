import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Impact } from "@/components/landing/impact";
import { IntroScreen } from "@/components/landing/intro-screen";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <IntroScreen />
      <Navbar />
      <main id="main" className="flex-1">
        <Hero />
        <Features />
        <Impact />
      </main>
      <Footer />
    </>
  );
}
