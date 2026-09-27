import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

// Limits for the public demo. Unset env vars keep local dev and CI unrestricted.
const env = (name: string, fallback: number) => Number(process.env[name] ?? fallback);

export const MAX_DIFFICULTY = env("MAX_DIFFICULTY", 7);
export const MAX_MINING_MS = env("MAX_MINING_MS", 0); // 0 = no time limit
export const MAX_MEMPOOL = env("MAX_MEMPOOL", 0); // 0 = unbounded

/**
 * Guards destructive endpoints. When ADMIN_TOKEN is set (production), callers must
 * send it in the `x-admin-token` header; without it the endpoint stays open, which
 * is what local dev and the CI pre-mining job rely on.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return next();

  const given = Buffer.from(req.header("x-admin-token") ?? "");
  const expected = Buffer.from(token);
  if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
    return next();
  }
  res.status(403).json({ error: "Resetting the chain is disabled on the public demo. It resets automatically every night." });
}

// Opt-in (RATE_LIMITS=on in production): the CI pre-mining job fires dozens of
// transactions per second at a local backend and must not be throttled.
const RATE_LIMITS_ON = process.env.RATE_LIMITS === "on";
const passThrough = (_req: Request, _res: Response, next: NextFunction) => next();

const perMinute = (limit: number, message: string) =>
  RATE_LIMITS_ON
    ? rateLimit({
        windowMs: 60_000,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: { error: message },
      })
    : passThrough;

export const limits = {
  global: perMinute(env("RATE_LIMIT_GLOBAL", 600), "Too many requests, please slow down."),
  transaction: perMinute(env("RATE_LIMIT_TX", 30), "Too many transactions, please wait a minute."),
  mine: perMinute(env("RATE_LIMIT_MINE", 10), "Too many mining requests, please wait a minute."),
  control: perMinute(env("RATE_LIMIT_CONTROL", 30), "Too many requests, please wait a minute."),
};
