"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function Topbar({ title }: { title?: string }) {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/75 px-5 backdrop-blur">
      <Link href="/" className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-accent/10 text-sm font-black text-accent">
          A
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">GraphChat</div>
          <div className="text-xs text-muted">{title ?? "Span-grounded AI learning graphs"}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        {isLoaded && !isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button className="rounded-md px-3 py-2 text-xs font-semibold text-muted hover:bg-white/5 hover:text-foreground">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-md border border-border bg-panel2 px-3 py-2 text-xs font-semibold text-foreground hover:border-slate-500">
                Sign up
              </button>
            </SignUpButton>
          </>
        ) : null}
        {isLoaded && isSignedIn ? <UserButton /> : null}
      </div>
    </header>
  );
}
