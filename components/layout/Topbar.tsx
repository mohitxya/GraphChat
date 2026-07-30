"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type ModelInfo = {
  label: string;
};

export function Topbar({ title }: { title?: string }) {
  const { isLoaded, isSignedIn } = useUser();
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadModelInfo() {
      if (!isLoaded || !isSignedIn) {
        setModelInfo(null);
        return;
      }

      try {
        const response = await fetch("/api/model");
        const payload = await response.json();

        if (!response.ok) {
          return;
        }

        if (!ignore) {
          setModelInfo({ label: payload.label });
        }
      } catch {
        if (!ignore) {
          setModelInfo(null);
        }
      }
    }

    loadModelInfo();

    return () => {
      ignore = true;
    };
  }, [isLoaded, isSignedIn]);

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
        {isLoaded && isSignedIn ? (
          <>
            {modelInfo ? (
              <div className="hidden max-w-56 truncate rounded-md border border-border bg-panel2 px-2.5 py-1.5 text-xs font-semibold text-muted sm:block">
                {modelInfo.label}
              </div>
            ) : null}
            <UserButton />
          </>
        ) : null}
      </div>
    </header>
  );
}
