import type { Metadata } from "next";
import { PageHeader, SiteShell } from "@/components/landing/site-shell";
import { ContactForm } from "@/components/landing/contact-form";

export const metadata: Metadata = { title: "Contact — ILUMO", description: "Get in touch with the ILUMO team." };

export default function Contact() {
  return (
    <SiteShell>
      <PageHeader eyebrow="CONTACT" title="We'd love to hear from you">
        Questions, ideas, or something that isn&apos;t accessible enough? Tell us and we will read every message.
      </PageHeader>
      <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <ContactForm />
      </div>
    </SiteShell>
  );
}
