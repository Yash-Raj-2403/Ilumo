import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFlow } from "@/components/auth/auth-flow";

export const metadata: Metadata = { title: "Sign up — ILUMO" };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthFlow mode="signup" />
    </Suspense>
  );
}
