import Link from "next/link";

export function Topbar({ title }: { title?: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/75 px-5 backdrop-blur">
      <Link href="/" className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-accent/10 text-sm font-black text-accent">
          A
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">AnchorAI / DoubtGraph</div>
          <div className="text-xs text-muted">{title ?? "Span-grounded AI learning graphs"}</div>
        </div>
      </Link>
      <div className="text-xs text-muted">MVP</div>
    </header>
  );
}
