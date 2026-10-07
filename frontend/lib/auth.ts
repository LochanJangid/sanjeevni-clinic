export interface TokenClaims {
  sub?: string;
  username?: string;
}

export function parseTokenClaims(token: string): TokenClaims | null {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;

    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
    ) as unknown;
    if (typeof payload !== "object" || payload === null) return null;

    const claims = payload as Record<string, unknown>;
    return {
      sub: typeof claims.sub === "string" ? claims.sub : undefined,
      username: typeof claims.username === "string" ? claims.username : undefined,
    };
  } catch {
    return null;
  }
}
