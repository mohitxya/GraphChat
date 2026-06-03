import { notFound } from "next/navigation";
import { ConversationCanvas } from "@/components/canvas/ConversationCanvas";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { prisma } from "@/lib/db/prisma";

export default async function ConversationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      nodes: { orderBy: { createdAt: "asc" } },
      edges: { orderBy: { createdAt: "asc" } },
      anchors: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!conversation) {
    notFound();
  }

  const serializable = JSON.parse(JSON.stringify(conversation));

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <Topbar title={conversation.title} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <ConversationCanvas conversation={serializable} />
        </section>
      </div>
    </main>
  );
}
