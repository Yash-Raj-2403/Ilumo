import { ChildDetail } from "@/components/parent/child-detail";

export default async function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChildDetail id={id} />;
}
