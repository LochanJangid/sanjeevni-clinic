export interface TokenClaims {
  sub?: string;
  username?: string;
  role?: "patient" | "doctor" | "admin" | string;
  doctor_id?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
      role: typeof claims.role === "string" ? claims.role : "patient",
      doctor_id: typeof claims.doctor_id === "number" ? claims.doctor_id : undefined,
    };
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getAuthClaims(): TokenClaims | null {
  const token = getAuthToken();
  return token ? parseTokenClaims(token) : null;
}

export function setAuthSession(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
  window.dispatchEvent(new Event("sanjeevni-session-change"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  window.dispatchEvent(new Event("sanjeevni-session-change"));
}

export async function loginWithDoctorKey(doctorKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/users/doctor_key_login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_key: doctorKey.trim().toUpperCase() }),
    });
    const data = await response.json();
    if (response.ok && data.access_token) {
      setAuthSession(data.access_token);
      return { success: true };
    }
    return { success: false, error: data.detail || "Invalid Doctor Access Key" };
  } catch {
    return { success: false, error: "Unable to reach authorization server." };
  }
}
