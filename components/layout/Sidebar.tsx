export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-background/60 p-4 backdrop-blur lg:block">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Workflow</div>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          <p>1. Ask for a root explanation.</p>
          <p>2. Highlight any confusing span.</p>
          <p>3. Ask a branch question.</p>
          <p>4. Keep drilling down recursively.</p>
        </div>
      </div>
      <div className="rounded-md border border-border bg-panel p-3 text-xs leading-6 text-muted">
        Anchors store visible-text offsets plus quote/context fallback. If markdown changes later, the text quote still gives us a recovery path.
      </div>
    </aside>
  );
}
