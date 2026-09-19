import { Suspense } from "react";
import { UploadMaterial } from "@/components/student/upload-material";

export default function NewMaterial() {
  return (
    <Suspense fallback={null}>
      <UploadMaterial />
    </Suspense>
  );
}
