import type { Metadata } from "next";
import { StudentProvider } from "@/components/student/student-provider";
import { StudentShell } from "@/components/student/student-shell";

export const metadata: Metadata = { title: "ILUMO" };

// Shared by the student area (/student) and the parent area (/parent).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentProvider>
      <StudentShell>{children}</StudentShell>
    </StudentProvider>
  );
}
