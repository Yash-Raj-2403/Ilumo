import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFlow } from "@/components/auth/auth-flow";

export const metadata: Metadata = { title: "Log in — ILUMO" };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthFlow mode="login" />
    </Suspense>
  );
}
