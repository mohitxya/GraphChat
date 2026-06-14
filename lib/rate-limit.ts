import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type LlmRoute = "generate-root" | "ask-span";

type RateLimitResult =
  | {
      allowed: true;
      headers: HeadersInit;
    }
  | {
      allowed: false;
      response: NextResponse;
    };

function readPositiveInt(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function hasUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  return Boolean(
    url &&
      token &&
      url.startsWith("https://") &&
      url !== "https://..." &&
      token !== "..."
  );
}

const redis = hasUpstashConfig() ? Redis.fromEnv() : null;

const rootLimit = readPositiveInt("ROOT_LIMIT_10M", 5);
const spanLimit = readPositiveInt("SPAN_LIMIT_10M", 20);
const dailyLimit = readPositiveInt("DAILY_LLM_LIMIT", 50);

const rootLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(rootLimit, "10 m"),
      prefix: "graphchat:rl:root",
      analytics: true
    })
  : null;

const spanLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(spanLimit, "10 m"),
      prefix: "graphchat:rl:span",
      analytics: true
    })
  : null;

const dailyLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(dailyLimit, "1 d"),
      prefix: "graphchat:rl:daily",
      analytics: true
    })
  : null;

function rateLimitHeaders(limit: number, remaining: number, reset: number): HeadersInit {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": new Date(reset).toISOString()
  };
}

function blockedResponse(limit: number, remaining: number, reset: number) {
  return NextResponse.json(
    {
      error: "Rate limit reached. Please try again later.",
      resetAt: new Date(reset).toISOString()
    },
    {
      status: 429,
      headers: rateLimitHeaders(limit, remaining, reset)
    }
  );
}

export async function enforceLlmRateLimit({
  request,
  userId,
  route
}: {
  request: Request;
  userId: string;
  route: LlmRoute;
}): Promise<RateLimitResult> {
  if (process.env.AI_DEMO_DISABLED === "true") {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "The AI demo is temporarily disabled. Please try again later." },
        { status: 503 }
      )
    };
  }

  if (!redis || !rootLimiter || !spanLimiter || !dailyLimiter) {
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Rate limiting is not configured." },
          { status: 503 }
        )
      };
    }

    console.warn("Upstash Redis is not configured; skipping rate limiting in development.");
    return { allowed: true, headers: {} };
  }

  const ip = getClientIp(request);
  const routeLimiter = route === "generate-root" ? rootLimiter : spanLimiter;
  const identifier = `user:${userId}`;
  const routeResult = await routeLimiter.limit(identifier, { ip });

  if (!routeResult.success) {
    return {
      allowed: false,
      response: blockedResponse(routeResult.limit, routeResult.remaining, routeResult.reset)
    };
  }

  const dailyResult = await dailyLimiter.limit(identifier, { ip });

  if (!dailyResult.success) {
    return {
      allowed: false,
      response: blockedResponse(dailyResult.limit, dailyResult.remaining, dailyResult.reset)
    };
  }

  return {
    allowed: true,
    headers: rateLimitHeaders(routeResult.limit, routeResult.remaining, routeResult.reset)
  };
}
