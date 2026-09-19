import { LessonViewer } from "@/components/student/lesson-viewer";

export default async function LessonPage({ params }: PageProps<"/student/lesson/[id]">) {
  const { id } = await params;
  return <LessonViewer id={id} />;
}
