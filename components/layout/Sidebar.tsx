"use client";

import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState } from "react";

type SidebarConversation = {
  id: string;
  title: string;
  updatedAt: string;
  nodes?: Array<{
    question: string | null;
    content: string;
  }>;
};

function getConversationLabel(conversation: SidebarConversation) {
  return conversation.title || conversation.nodes?.[0]?.question || conversation.nodes?.[0]?.content || "Untitled conversation";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeConversationId = useMemo(() => pathname.match(/^\/conversations\/([^/]+)/)?.[1], [pathname]);
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/conversations");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load conversations.");
        }

        if (!ignore) {
          setConversations(payload.conversations ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      ignore = true;
    };
  }, [pathname]);

  async function deleteConversation(event: MouseEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    event.stopPropagation();
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete conversation.");
      }

      const nextConversations = conversations.filter((conversation) => conversation.id !== id);
      setConversations(nextConversations);

      if (id === activeConversationId) {
        const nextConversation = nextConversations[0];
        router.replace(nextConversation ? `/conversations/${nextConversation.id}` : "/");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-background/60 p-3 backdrop-blur lg:flex lg:flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Conversations</div>
          <div className="text-xs text-slate-400">Your saved learning graphs</div>
        </div>
        <Link
          href="/"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-panel2 text-muted hover:border-slate-500 hover:text-foreground"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {error ? <p className="mb-3 rounded-md border border-red-900/60 bg-red-950/40 p-2 text-xs text-red-200">{error}</p> : null}

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading
          </div>
        ) : null}

        {!isLoading && conversations.length === 0 ? (
          <div className="rounded-md border border-border bg-panel p-3 text-xs leading-5 text-muted">
            Start a root explanation and it will appear here.
          </div>
        ) : null}

        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const label = getConversationLabel(conversation);

          return (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className={`group flex min-h-12 items-center gap-2 rounded-md border px-2 py-2 text-sm transition ${
                isActive
                  ? "border-accent/50 bg-accent/10 text-foreground"
                  : "border-transparent text-slate-300 hover:border-border hover:bg-panel"
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <button
                type="button"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted opacity-0 hover:bg-red-950/70 hover:text-red-200 focus:opacity-100 group-hover:opacity-100"
                disabled={deletingId === conversation.id}
                onClick={(event) => deleteConversation(event, conversation.id)}
                title="Delete conversation"
              >
                {deletingId === conversation.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
