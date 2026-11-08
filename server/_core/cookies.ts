import type { CookieOptions, Request } from "express";

const isHttps = (req: Request) => {
  if (req.protocol === "https") return true;
  const forwarded = req.headers["x-forwarded-proto"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (value ?? "").split(",")[0]?.trim() === "https";
};

/** Same-site session cookie. `Secure` only over HTTPS so sign-in also works on http://localhost. */
export function getSessionCookieOptions(req: Request): CookieOptions {
  return { httpOnly: true, path: "/", sameSite: "lax", secure: isHttps(req) };
}
