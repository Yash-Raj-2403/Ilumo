import Link from "next/link";
import { Logo } from "./logo";

const links = [
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Our Impact", href: "/#impact" },
  { label: "For Parents", href: "/parents" },
  { label: "Contact", href: "/#contact" },
];

export function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 text-body">Learning should have no limits.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {links.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="font-medium text-ink hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-brand/10 py-5 text-center text-sm text-body">© 2026 ILUMO</div>
    </footer>
  );
}
