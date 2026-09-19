import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ILUMO — See the Ability, home"
      className={`inline-flex items-center ${className ?? ""}`}
    >
      <Image
        src="/images/ilumo-logo.png"
        alt="ILUMO"
        width={617}
        height={192}
        priority
        className="h-14 w-auto sm:h-16"
      />
    </Link>
  );
}
